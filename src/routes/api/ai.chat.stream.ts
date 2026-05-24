import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { groqChatStream, type ChatMsg } from "@/lib/groq.server";
import type { Database } from "@/integrations/supabase/types";

const Body = z.object({
  message: z.string().min(1).max(8000),
  reviewId: z.string().uuid().optional().nullable(),
  prId: z.string().uuid().optional().nullable(),
  repoId: z.string().uuid().optional().nullable(),
});

const PERSONALITY = `You are CodeSentinel — a calm, sharp staff-level engineer
embedded in the developer's PR review workflow. You think like a security
researcher and a performance engineer. You speak the way a senior teammate
would in a code review: precise, technical, never preachy, never generic.

Voice rules:
- Lead with the mechanism, not the label. Say *why* something is unsafe or slow.
- Prefer concrete code over vague advice. Show diffs or minimal patches in
  fenced code blocks with a language tag.
- When you ship a fix, briefly state the trade-off you accepted.
- Never use chatbot filler ("Great question!", "Certainly!", "I hope this
  helps!", "As an AI..."). Don't restate the user's question.
- Use markdown: short paragraphs, fenced code blocks with languages,
  bullet lists for >2 distinct items.
- If context is thin, say what you'd need to confirm — don't invent files
  or symbols that aren't in the context block.

You are not a chatbot. You are a reviewer on the PR.`;

function formatContext(ctx: {
  pr?: { title: string; number: number | null; author: string | null; branch: string | null } | null;
  repo?: { name: string; language: string | null } | null;
  review?: {
    summary: string | null;

    quality: number | null;
    security: number | null;
    performance: number | null;
    merge_safety: number | null;
    bug_probability: number | null;
  } | null;
  issues: Array<{
    severity: string;
    category: string;
    title: string;
    file_path: string;
    line_number: number | null;
    explanation: string;
    suggested_fix: string | null;
  }>;
  files: Array<{ filename: string; additions: number | null; deletions: number | null; patch: string | null }>;
}) {
  const parts: string[] = ["[CONTEXT]"];
  if (ctx.repo) parts.push(`Repository: ${ctx.repo.name}${ctx.repo.language ? ` (${ctx.repo.language})` : ""}`);
  if (ctx.pr) {
    parts.push(
      `Pull request #${ctx.pr.number ?? "?"}: ${ctx.pr.title}` +
        (ctx.pr.author ? ` by ${ctx.pr.author}` : "") +
        (ctx.pr.branch ? ` on ${ctx.pr.branch}` : ""),
    );
  }
  if (ctx.review) {
    parts.push(
      `Latest AI review — quality:${ctx.review.quality ?? "?"} security:${ctx.review.security ?? "?"} ` +
        `performance:${ctx.review.performance ?? "?"} merge_safety:${ctx.review.merge_safety ?? "?"} ` +
        `bug_prob:${ctx.review.bug_probability ?? "?"}`,
    );
    if (ctx.review.summary) parts.push(`Review summary: ${ctx.review.summary}`);
  }
  if (ctx.issues.length) {
    parts.push("\nFindings:");
    for (const i of ctx.issues.slice(0, 25)) {
      parts.push(
        `- [${i.severity}/${i.category}] ${i.title} @ ${i.file_path}${i.line_number ? `:${i.line_number}` : ""}\n  ${i.explanation}` +
          (i.suggested_fix ? `\n  Suggested:\n${truncate(i.suggested_fix, 600)}` : ""),
      );
    }
  }
  if (ctx.files.length) {
    parts.push("\nChanged files (diffs truncated):");
    for (const f of ctx.files.slice(0, 12)) {
      parts.push(`- ${f.filename} (+${f.additions ?? 0}/-${f.deletions ?? 0})`);
      if (f.patch) {
        parts.push("```diff\n" + truncate(f.patch, 1400) + "\n```");
      }
    }
  }
  parts.push("[/CONTEXT]");
  return parts.join("\n");
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "\n…(truncated)" : s;
}

export const Route = createFileRoute("/api/ai/chat/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Supabase not configured", { status: 500 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub;

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch (e) {
          return new Response("Invalid body: " + (e as Error).message, { status: 400 });
        }

        // ---- Gather context ----
        let prRow: {
          id: string;
          title: string;
          github_pr_number: number | null;
          author: string | null;
          head_branch: string | null;
          repository_id: string;
        } | null = null;
        let repoRow: { id: string; full_name: string; language: string | null } | null = null;
        let reviewRow: {
          id: string;
          summary: string | null;
          quality_score: number | null;
          security_score: number | null;
          performance_score: number | null;
          merge_safety_score: number | null;
          bug_probability: number | null;
        } | null = null;
        let issues: Array<{
          severity: string;
          category: string;
          title: string;
          file_path: string;
          line_number: number | null;
          explanation: string;
          suggested_fix: string | null;
        }> = [];
        let files: Array<{ filename: string; additions: number | null; deletions: number | null; patch: string | null }> = [];

        if (parsed.reviewId) {
          const { data: r } = await supabase
            .from("ai_reviews")
            .select(
              "id, summary, quality_score, security_score, performance_score, merge_safety_score, bug_probability, pull_request_id",
            )
            .eq("id", parsed.reviewId)
            .eq("user_id", userId)
            .maybeSingle();
          if (r) {
            reviewRow = {
              id: r.id,
              summary: r.summary,
              quality_score: r.quality_score as number | null,
              security_score: r.security_score as number | null,
              performance_score: r.performance_score as number | null,
              merge_safety_score: r.merge_safety_score as number | null,
              bug_probability: r.bug_probability as number | null,
            };
            if (!parsed.prId) parsed.prId = r.pull_request_id as string;
            const { data: cmts } = await supabase
              .from("review_comments")
              .select("severity,category,title,file_path,line_number,explanation,suggested_fix")
              .eq("review_id", r.id)
              .limit(40);
            issues = (cmts ?? []) as typeof issues;
          }
        }

        if (parsed.prId) {
          const { data: pr } = await supabase
            .from("pull_requests")
            .select("id,title,github_pr_number,author,head_ref,repository_id")
            .eq("id", parsed.prId)
            .eq("user_id", userId)
            .maybeSingle();
          if (pr) {
            prRow = {
              id: pr.id,
              title: pr.title,
              github_pr_number: pr.github_pr_number,
              author: pr.author,
              head_branch: pr.head_ref,
              repository_id: pr.repository_id,
            };
            if (!parsed.repoId) parsed.repoId = pr.repository_id as string;
          }
        }


        if (parsed.repoId) {
          const { data: rp } = await supabase
            .from("repositories")
            .select("id,full_name,language")
            .eq("id", parsed.repoId)
            .eq("user_id", userId)
            .maybeSingle();
          if (rp) repoRow = { id: rp.id, full_name: rp.full_name, language: rp.language as string | null };
        }

        // ---- History (recent turns scoped to review or general) ----
        let histQ = supabase
          .from("chat_messages")
          .select("role,content,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(16);
        histQ = parsed.reviewId
          ? histQ.eq("review_id", parsed.reviewId)
          : histQ.is("review_id", null);
        const { data: hist } = await histQ;

        const messages: ChatMsg[] = [
          { role: "system", content: PERSONALITY },
        ];

        const ctxText = formatContext({
          pr: prRow
            ? { title: prRow.title, number: prRow.github_pr_number, author: prRow.author, branch: prRow.head_branch }
            : null,
          repo: repoRow ? { name: repoRow.full_name, language: repoRow.language } : null,
          review: reviewRow
            ? {
                summary: reviewRow.summary,
                quality: reviewRow.quality_score,
                security: reviewRow.security_score,
                performance: reviewRow.performance_score,
                merge_safety: reviewRow.merge_safety_score,
                bug_probability: reviewRow.bug_probability,
              }
            : null,
          issues,
          files,
        });
        if (prRow || repoRow || reviewRow || issues.length || files.length) {
          messages.push({ role: "system", content: ctxText });
        }

        for (const h of hist ?? []) {
          if (h.role === "user" || h.role === "assistant") {
            messages.push({ role: h.role, content: h.content });
          }
        }
        messages.push({ role: "user", content: parsed.message });

        // Persist user message immediately
        await supabase.from("chat_messages").insert({
          user_id: userId,
          review_id: parsed.reviewId ?? null,
          role: "user",
          content: parsed.message,
        });

        try {
          const stream = await groqChatStream({
            messages,
            temperature: 0.3,
            max_tokens: 2000,
            onComplete: async (full) => {
              if (full.trim()) {
                await supabase.from("chat_messages").insert({
                  user_id: userId,
                  review_id: parsed.reviewId ?? null,
                  role: "assistant",
                  content: full,
                });
              }
            },
          });
          return new Response(stream, {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "X-Accel-Buffering": "no",
            },
          });
        } catch (e) {
          return new Response((e as Error).message, { status: 500 });
        }
      },
    },
  },
});
