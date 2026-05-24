import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ghPostReview, type GHReviewEvent, type GHReviewComment } from "./github.server";

const SEVERITY_BADGE: Record<string, string> = {
  critical: "🔴 CRITICAL",
  warning: "🟠 WARNING",
  suggestion: "🔵 SUGGESTION",
  optimization: "🟢 OPTIMIZATION",
};

const SEVERITY_ORDER = ["critical", "warning", "suggestion", "optimization"];

type IssueRow = {
  file_path: string;
  line_number: number | null;
  severity: string;
  category: string;
  title: string;
  explanation: string;
  suggested_fix: string | null;
  confidence: number | null;
};

function buildSummaryBody(
  review: {
    summary: string | null;
    quality_score: number | null;
    security_score: number | null;
    performance_score: number | null;
    merge_safety_score: number | null;
    total_issues: number | null;
    critical_count: number | null;
    warning_count: number | null;
    suggestion_count: number | null;
    optimization_count: number | null;
  },
  issues: IssueRow[],
): string {
  const lines: string[] = [];
  lines.push("## 🛡️ CodeSentinel AI — Review Summary");
  lines.push("");
  if (review.summary) lines.push(review.summary, "");

  lines.push("### Scores");
  lines.push(
    `| Quality | Security | Performance | Merge Safety |`,
    `| --- | --- | --- | --- |`,
    `| ${review.quality_score ?? "–"} / 10 | ${review.security_score ?? "–"} / 10 | ${review.performance_score ?? "–"} / 10 | ${review.merge_safety_score ?? "–"} / 10 |`,
    "",
  );

  lines.push("### Issues found");
  lines.push(
    `- 🔴 Critical: **${review.critical_count ?? 0}**`,
    `- 🟠 Warning: **${review.warning_count ?? 0}**`,
    `- 🔵 Suggestion: **${review.suggestion_count ?? 0}**`,
    `- 🟢 Optimization: **${review.optimization_count ?? 0}**`,
    "",
  );

  // Group inline-less issues (no line number) into a per-severity appendix
  const orphan = issues.filter((i) => !i.line_number);
  if (orphan.length) {
    lines.push("### Additional findings (file-level)");
    for (const sev of SEVERITY_ORDER) {
      const group = orphan.filter((i) => i.severity === sev);
      if (!group.length) continue;
      lines.push(`\n**${SEVERITY_BADGE[sev] ?? sev}**`);
      for (const i of group) {
        lines.push(`- \`${i.file_path}\` — **${i.title}**  \n  ${i.explanation}`);
      }
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("_Posted automatically by [CodeSentinel AI](https://codesentinel.ai)._");
  return lines.join("\n");
}

function buildInlineComments(issues: IssueRow[]): GHReviewComment[] {
  return issues
    .filter((i) => i.line_number && i.line_number > 0)
    .slice(0, 50)
    .map((i) => {
      const sev = SEVERITY_BADGE[i.severity] ?? i.severity.toUpperCase();
      const body = [
        `**${sev} — ${i.title}**`,
        "",
        i.explanation,
        i.suggested_fix ? `\n<details><summary>Suggested fix</summary>\n\n\`\`\`\n${i.suggested_fix}\n\`\`\`\n</details>` : "",
        i.confidence != null ? `\n_AI confidence: ${Math.round(Number(i.confidence) * 100)}%_` : "",
      ].join("\n");
      return {
        path: i.file_path,
        line: i.line_number!,
        side: "RIGHT" as const,
        body,
      };
    });
}

export const postReviewToGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reviewId: z.string().uuid(),
        mode: z.enum(["COMMENT", "APPROVE", "REQUEST_CHANGES"]).default("COMMENT"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase: db, userId } = context;
    const supabase = db as unknown as { from: (t: string) => any };

    // Load review + PR + repo
    const { data: review, error: rErr } = await supabase
      .from("ai_reviews")
      .select("*, pull_requests(*, repositories(full_name))")
      .eq("id", data.reviewId)
      .eq("user_id", userId)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    if (!review) throw new Error("Review not found");
    if (review.status !== "completed") throw new Error("Review is not completed yet");

    const pr = review.pull_requests as {
      id: string;
      github_pr_number: number;
      head_sha: string | null;
      repositories: { full_name: string };
    };
    if (!pr) throw new Error("PR not found");

    const { data: prof } = await supabase
      .from("profiles")
      .select("github_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof?.github_token) throw new Error("Connect GitHub in Settings first.");

    const { data: issues } = await supabase
      .from("review_comments")
      .select("file_path, line_number, severity, category, title, explanation, suggested_fix, confidence")
      .eq("review_id", review.id);

    const issueRows = (issues ?? []) as IssueRow[];
    const inline = buildInlineComments(issueRows);
    const body = buildSummaryBody(review, issueRows);
    const event = data.mode as GHReviewEvent;

    // Create posting record
    const { data: posting, error: pErr } = await supabase
      .from("review_postings")
      .insert({
        user_id: userId,
        review_id: review.id,
        pull_request_id: pr.id,
        mode: event,
        status: "posting",
        attempts: 1,
        payload: { body_preview: body.slice(0, 500), inline_count: inline.length },
      })
      .select()
      .single();
    if (pErr) throw new Error(pErr.message);

    // Retry up to 3 times with exponential backoff
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const gh = await ghPostReview(
          prof.github_token,
          pr.repositories.full_name,
          pr.github_pr_number,
          { commitId: pr.head_sha ?? undefined, body, event, comments: inline },
        );

        await supabase
          .from("review_postings")
          .update({
            status: "posted",
            github_review_id: gh.id,
            github_html_url: gh.html_url,
            attempts: attempt,
            error: null,
          })
          .eq("id", posting.id);

        await supabase.from("github_webhook_events").insert({
          user_id: userId,
          event_type: "review.posted",
          source: "github-api",
          status: "ok",
          payload: { review_id: review.id, pr: pr.github_pr_number, github_review_id: gh.id },
        });

        return { ok: true, postingId: posting.id, githubUrl: gh.html_url };
      } catch (e) {
        lastErr = e;
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
          await supabase
            .from("review_postings")
            .update({ attempts: attempt + 1 })
            .eq("id", posting.id);
        }
      }
    }

    const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    await supabase
      .from("review_postings")
      .update({ status: "failed", error: errMsg })
      .eq("id", posting.id);

    await supabase.from("github_webhook_events").insert({
      user_id: userId,
      event_type: "review.post_failed",
      source: "github-api",
      status: "error",
      error: errMsg,
      payload: { review_id: review.id, pr: pr.github_pr_number },
    });

    throw new Error(errMsg);
  });

export const listPostingsForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reviewId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase: db, userId } = context;
    const supabase = db as unknown as { from: (t: string) => any };
    const { data: rows, error } = await supabase
      .from("review_postings")
      .select("*")
      .eq("review_id", data.reviewId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
