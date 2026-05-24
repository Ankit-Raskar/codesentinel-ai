import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { groqChat } from "./groq.server";
import { ghGetPullFiles } from "./github.server";

const SYSTEM = `You are CodeSentinel AI, an elite senior code reviewer.
Analyze the provided pull request diff and return STRICT JSON only, no prose.

Detect: bugs, security vulnerabilities (SQL injection, XSS, hardcoded secrets,
unsafe eval, weak auth, insecure deps), performance issues (n+1, blocking ops,
memory leaks, inefficient loops, unnecessary re-renders), code smells, bad
practices, unused vars, duplicate code, unsafe patterns.

Return JSON with this exact schema:
{
  "summary": "1-2 sentence high-level review",
  "quality_score": number 0-10,
  "security_score": number 0-10,
  "performance_score": number 0-10,
  "merge_safety_score": number 0-10,
  "bug_probability": number 0-1,
  "issues": [
    {
      "file_path": "path/to/file",
      "line_number": number or null,
      "severity": "critical" | "warning" | "suggestion" | "optimization",
      "category": "bug" | "security" | "performance" | "smell" | "style",
      "title": "short title",
      "explanation": "why this is an issue (1-3 sentences)",
      "suggested_fix": "concrete fix in plain text or code snippet",
      "confidence": number 0-1
    }
  ]
}

If the diff is empty or trivial, return an empty issues array but still score it.
Limit to the 12 most important issues. Be precise about line_number using the diff hunk headers when possible.`;

function buildDiffPrompt(files: { filename: string; patch?: string; status: string }[]) {
  const blocks = files
    .filter((f) => f.patch)
    .slice(0, 25)
    .map((f) => {
      const patch = (f.patch ?? "").slice(0, 6000);
      return `### FILE: ${f.filename} (${f.status})\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");
  return blocks || "No textual diff available.";
}

type Issue = {
  file_path: string;
  line_number: number | null;
  severity: "critical" | "warning" | "suggestion" | "optimization";
  category: string;
  title: string;
  explanation: string;
  suggested_fix: string;
  confidence: number;
};

type Analysis = {
  summary: string;
  quality_score: number;
  security_score: number;
  performance_score: number;
  merge_safety_score: number;
  bug_probability: number;
  issues: Issue[];
};

export const analyzePullRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ prId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: pr, error: pErr } = await supabase
      .from("pull_requests")
      .select("*, repositories(*)")
      .eq("id", data.prId)
      .eq("user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pr) throw new Error("PR not found");

    const { data: prof } = await supabase
      .from("profiles")
      .select("github_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof?.github_token) throw new Error("Connect GitHub in Settings first.");

    // create review row (running)
    const { data: review, error: rErr } = await supabase
      .from("ai_reviews")
      .insert({
        user_id: userId,
        pull_request_id: pr.id,
        status: "running",
      })
      .select()
      .single();
    if (rErr) throw new Error(rErr.message);

    try {
      const files = await ghGetPullFiles(prof.github_token, pr.repositories.full_name, pr.github_pr_number);
      const userPrompt = `PR Title: ${pr.title}\nPR Body: ${pr.body ?? ""}\n\n${buildDiffPrompt(files)}`;
      const raw = await groqChat({ system: SYSTEM, user: userPrompt, json: true, temperature: 0.15 });

      let parsed: Analysis;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("AI returned malformed JSON");
      }

      const counts = { critical: 0, warning: 0, suggestion: 0, optimization: 0 };
      for (const i of parsed.issues ?? []) {
        const s = i.severity as keyof typeof counts;
        if (counts[s] !== undefined) counts[s]++;
      }

      await supabase
        .from("ai_reviews")
        .update({
          status: "completed",
          summary: parsed.summary,
          quality_score: parsed.quality_score,
          security_score: parsed.security_score,
          performance_score: parsed.performance_score,
          merge_safety_score: parsed.merge_safety_score,
          bug_probability: parsed.bug_probability,
          total_issues: parsed.issues?.length ?? 0,
          critical_count: counts.critical,
          warning_count: counts.warning,
          suggestion_count: counts.suggestion,
          optimization_count: counts.optimization,
          raw_response: parsed as any,
          completed_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      if (parsed.issues?.length) {
        await supabase.from("review_comments").insert(
          parsed.issues.map((i) => ({
            user_id: userId,
            review_id: review.id,
            file_path: i.file_path,
            line_number: i.line_number,
            severity: i.severity,
            category: i.category,
            title: i.title,
            explanation: i.explanation,
            suggested_fix: i.suggested_fix,
            confidence: i.confidence,
          })),
        );
      }

      return { reviewId: review.id };
    } catch (e) {
      await supabase
        .from("ai_reviews")
        .update({ status: "failed", error: e instanceof Error ? e.message : String(e) })
        .eq("id", review.id);
      throw e;
    }
  });

export const getReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reviewId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: review, error } = await supabase
      .from("ai_reviews")
      .select("*")
      .eq("id", data.reviewId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!review) throw new Error("Review not found");
    const { data: comments } = await supabase
      .from("review_comments")
      .select("*")
      .eq("review_id", review.id)
      .order("severity", { ascending: true });
    return { review, comments: comments ?? [] };
  });

export const listReviewsForPR = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ prId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("ai_reviews")
      .select("*")
      .eq("pull_request_id", data.prId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [repos, prs, reviews, comments] = await Promise.all([
      supabase.from("repositories").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("pull_requests").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase
        .from("ai_reviews")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("review_comments").select("severity, category").eq("user_id", userId),
    ]);

    const c = comments.data ?? [];
    const bySeverity = {
      critical: c.filter((x) => x.severity === "critical").length,
      warning: c.filter((x) => x.severity === "warning").length,
      suggestion: c.filter((x) => x.severity === "suggestion").length,
      optimization: c.filter((x) => x.severity === "optimization").length,
    };
    const byCategory = {
      bug: c.filter((x) => x.category === "bug").length,
      security: c.filter((x) => x.category === "security").length,
      performance: c.filter((x) => x.category === "performance").length,
      smell: c.filter((x) => x.category === "smell").length,
      style: c.filter((x) => x.category === "style").length,
    };

    return {
      reposCount: repos.count ?? 0,
      prsCount: prs.count ?? 0,
      reviewsCount: reviews.data?.length ?? 0,
      recentReviews: reviews.data ?? [],
      bySeverity,
      byCategory,
    };
  });
