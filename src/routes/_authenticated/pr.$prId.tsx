import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles, Loader2, ArrowLeft, ShieldAlert, AlertTriangle, Lightbulb, Zap,
  MessageSquare, Send, ExternalLink, Github, CheckCircle2, XCircle, RefreshCw,
  Wrench, GitMerge, Clock, ShieldCheck, ShieldX, FileCode2, GitBranch,
} from "lucide-react";
import { getPullRequestDetail } from "@/lib/github.functions";
import { analyzePullRequest, getReview, listReviewsForPR } from "@/lib/reviews.functions";
import { postReviewToGitHub, listPostingsForReview } from "@/lib/github-review.functions";
import { DiffViewer } from "@/components/DiffViewer";
import { DiffSidebar } from "@/components/DiffSidebar";
import { ScoreRing } from "@/components/ScoreRing";
import { StreamingReviewProgress } from "@/components/cinematic/StreamingReviewProgress";
import { useAssistant } from "@/stores/assistant";


export const Route = createFileRoute("/_authenticated/pr/$prId")({ component: PRPage });

const SEV_META = {
  critical:     { icon: ShieldAlert, color: "text-critical", bg: "bg-critical/10 border-critical/30" },
  warning:      { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  suggestion:   { icon: Lightbulb, color: "text-suggestion", bg: "bg-suggestion/10 border-suggestion/30" },
  optimization: { icon: Zap, color: "text-optimization", bg: "bg-optimization/10 border-optimization/30" },
} as const;

function PRPage() {
  const { prId } = Route.useParams();
  const qc = useQueryClient();

  const detailFn = useServerFn(getPullRequestDetail);
  const reviewsFn = useServerFn(listReviewsForPR);
  const analyzeFn = useServerFn(analyzePullRequest);
  const getReviewFn = useServerFn(getReview);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["pr", prId], queryFn: () => detailFn({ data: { prId } }),
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", prId], queryFn: () => reviewsFn({ data: { prId } }),
  });

  const latest = reviews?.[0];
  const { data: reviewData } = useQuery({
    queryKey: ["review", latest?.id],
    queryFn: () => getReviewFn({ data: { reviewId: latest!.id } }),
    enabled: !!latest && latest.status === "completed",
  });

  const analyze = useMutation({
    mutationFn: () => analyzeFn({ data: { prId } }),
    onSuccess: () => {
      toast.success("Review complete");
      qc.invalidateQueries({ queryKey: ["reviews", prId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ask = useAssistant((s) => s.ask);
  const setCtx = useAssistant((s) => s.setContext);

  useEffect(() => {
    setCtx({
      prId,
      repoId: detail?.pr?.repository_id,
      prTitle: detail?.pr?.title,
      prNumber: detail?.pr?.github_pr_number,
      reviewId: reviewData?.review?.id ?? latest?.id,
    });
  }, [prId, detail?.pr?.repository_id, detail?.pr?.title, detail?.pr?.github_pr_number, reviewData?.review?.id, latest?.id, setCtx]);




  if (isLoading || !detail) {
    return <div className="glass rounded-xl p-10 text-center text-muted-foreground">Loading PR…</div>;
  }
  const pr = detail.pr;
  const review = reviewData?.review;
  const rawComments = reviewData?.comments ?? [];

  // Sort by severity hierarchy for clearer issue ordering
  const SEV_ORDER: Record<string, number> = { critical: 0, warning: 1, suggestion: 2, optimization: 3 };
  const comments = [...rawComments].sort((a, b) => {
    const da = SEV_ORDER[a.severity] ?? 9;
    const db = SEV_ORDER[b.severity] ?? 9;
    if (da !== db) return da - db;
    return (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
  });

  const blockers = review?.critical_count ?? 0;
  const mergeSafety = review?.merge_safety_score ? Number(review.merge_safety_score) : null;
  const reviewDurationMs = review?.completed_at && review?.created_at
    ? new Date(review.completed_at).getTime() - new Date(review.created_at).getTime()
    : null;

  return (
    <div className="space-y-6">
      <Link to="/repos/$repoId" params={{ repoId: pr.repository_id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to PRs
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
            <GitBranch className="w-3 h-3" />
            <span>{pr.head_ref ?? "feature"} → {pr.base_ref ?? "main"}</span>
            {detail.files?.length ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1"><FileCode2 className="w-3 h-3" />{detail.files.length} files</span>
              </>
            ) : null}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{pr.title}</h1>
          <div className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono">#{pr.github_pr_number}</span>
            <span>·</span>
            <span>{pr.author}</span>
            <span>·</span>
            <a href={pr.html_url ?? undefined} target="_blank" rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 hover:underline">
              View on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <AIQuickActions
            ask={ask}
            ctx={{ prId, repoId: pr.repository_id, reviewId: review?.id ?? latest?.id }}
            hasReview={!!review}
          />
          <button onClick={() => ask("Give me a one-paragraph briefing on this PR: scope, risk, and what to look at first.", { prId, repoId: pr.repository_id, reviewId: review?.id ?? latest?.id })}
            className="px-3 py-2 rounded-md glass text-sm flex items-center gap-2 hover:border-primary/40 hover:bg-surface-2 transition-all duration-200">
            <MessageSquare className="w-4 h-4" /> Ask CodeSentinel
          </button>

          <button
            onClick={() => analyze.mutate()} disabled={analyze.isPending}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 glow-border hover:brightness-110 transition-all duration-200 disabled:opacity-70"
          >
            {analyze.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyze.isPending ? "Scanning…" : "Run AI review"}
          </button>
        </div>
      </div>

      {/* Scanning animation */}
      {analyze.isPending && <StreamingReviewProgress />}

      {/* Review meta strip — AI reviewer, timing, blockers, merge recommendation */}
      {review?.status === "completed" && (
        <ReviewMetaStrip
          durationMs={reviewDurationMs}
          completedAt={review.completed_at ?? null}
          blockers={blockers}
          mergeSafety={mergeSafety}
          totalIssues={review.total_issues ?? comments.length}
        />
      )}

      {/* Review summary */}
      {review?.status === "completed" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="glass-strong rounded-xl p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Summary
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Stat label="Issues" value={review.total_issues ?? 0} />
                <Stat label="Critical" value={review.critical_count ?? 0} color="text-critical" />
                <Stat label="Warnings" value={review.warning_count ?? 0} color="text-warning" />
                <Stat label="Bug prob." value={`${Math.round((Number(review.bug_probability) || 0) * 100)}%`} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ScoreRing value={Number(review.quality_score) || 0} label="Quality" />
              <ScoreRing value={Number(review.security_score) || 0} label="Security" color="oklch(0.74 0.18 160)" />
              <ScoreRing value={Number(review.performance_score) || 0} label="Perf" color="oklch(0.78 0.17 75)" />
              <ScoreRing value={Number(review.merge_safety_score) || 0} label="Merge" color="oklch(0.65 0.18 300)" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Post to GitHub */}
      {review?.status === "completed" && (
        <PostToGitHub reviewId={review.id} />
      )}

      {/* Issues */}
      {comments.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-semibold">Findings <span className="text-muted-foreground font-normal">({comments.length})</span></h2>
            <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">sorted by severity</div>
          </div>
          <div className="space-y-2.5">
            {comments.map((c, i) => {
              const meta = SEV_META[c.severity as keyof typeof SEV_META] ?? SEV_META.suggestion;
              const Icon = meta.icon;
              return (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.4), duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                  className={`group rounded-xl border p-4 ${meta.bg} hover:border-opacity-60 transition-colors`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border border-current/20`}>
                          {c.severity}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.category}</span>
                        <span className="text-xs text-muted-foreground/80 font-mono truncate">
                          {c.file_path}{c.line_number ? `:${c.line_number}` : ""}
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono tabular-nums">
                          {Math.round(Number(c.confidence) * 100)}% conf
                        </span>
                      </div>
                      <h3 className="font-medium mt-1.5 text-[15px] leading-snug">{c.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{c.explanation}</p>
                      {c.suggested_fix && (
                        <pre className="mt-3 text-[12.5px] leading-relaxed bg-background/60 border border-border/60 rounded-md p-3 overflow-x-auto scrollbar-thin whitespace-pre-wrap font-mono">
                          {c.suggested_fix}
                        </pre>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files diff */}
      <div className="flex gap-6 items-start">
        <DiffSidebar
          files={detail.files.map((f) => ({
            filename: f.filename,
            comments: comments.filter((c) => c.file_path === f.filename),
          }))}
          mergeSafety={review?.merge_safety_score ? Math.round(Number(review.merge_safety_score) * 10) : undefined}
          aiConfidence={review?.quality_score ? Math.round(Number(review.quality_score) * 10) : undefined}
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold mb-3">Changed files ({detail.files.length})</h2>
          <div className="space-y-3">
            {detail.files.map(f => (
              <DiffViewer
                key={f.filename}
                filename={f.filename}
                patch={f.patch}
                comments={comments.filter(c => c.file_path === f.filename)}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="glass rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${color ?? ""}`}>{value}</div>
    </div>
  );
}

function PostToGitHub({ reviewId }: { reviewId: string }) {
  const qc = useQueryClient();
  const postFn = useServerFn(postReviewToGitHub);
  const listFn = useServerFn(listPostingsForReview);
  const [mode, setMode] = useState<"COMMENT" | "APPROVE" | "REQUEST_CHANGES">("COMMENT");

  const { data: postings } = useQuery({
    queryKey: ["postings", reviewId],
    queryFn: () => listFn({ data: { reviewId } }),
  });

  const post = useMutation({
    mutationFn: () => postFn({ data: { reviewId, mode } }),
    onSuccess: (r: { githubUrl?: string }) => {
      toast.success("Review posted to GitHub");
      if (r.githubUrl) window.open(r.githubUrl, "_blank");
      qc.invalidateQueries({ queryKey: ["postings", reviewId] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["postings", reviewId] });
    },
  });

  const last = postings?.[0];

  const MODE_META = {
    COMMENT: { label: "Comment", className: "bg-primary text-primary-foreground" },
    APPROVE: { label: "Approve", className: "bg-emerald-500/90 text-white" },
    REQUEST_CHANGES: { label: "Request changes", className: "bg-rose-500/90 text-white" },
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl p-5"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold flex items-center gap-2">
            <Github className="w-4 h-4" /> Post review to GitHub
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Publish the AI findings as inline review comments on the pull request.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass rounded-md p-0.5 flex text-xs">
            {(Object.keys(MODE_META) as (keyof typeof MODE_META)[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md transition ${mode === m ? "bg-surface" : "opacity-70 hover:opacity-100"}`}
              >
                {MODE_META[m].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => post.mutate()}
            disabled={post.isPending}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 glow-border ${MODE_META[mode].className}`}
          >
            {post.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {post.isPending ? "Posting…" : "Post to GitHub"}
          </button>
        </div>
      </div>

      {last && (
        <div className="mt-4 flex items-center gap-3 text-xs">
          {last.status === "posted" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {last.status === "failed" && <XCircle className="w-4 h-4 text-rose-400" />}
          {(last.status === "queued" || last.status === "posting") && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
          <span className="capitalize text-muted-foreground">
            Last posting: <span className="text-foreground">{last.status}</span>
            {last.attempts > 1 && <span className="text-muted-foreground"> · attempt {last.attempts}</span>}
          </span>
          {last.github_html_url && (
            <a href={last.github_html_url} target="_blank" rel="noreferrer"
              className="ml-auto text-primary inline-flex items-center gap-1">
              View on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {last.status === "failed" && (
            <button onClick={() => post.mutate()} className="ml-auto inline-flex items-center gap-1 text-rose-300 hover:text-rose-200">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          )}
        </div>
      )}
      {last?.error && (
        <pre className="mt-2 text-[11px] text-rose-300/90 bg-rose-500/5 border border-rose-500/20 rounded p-2 overflow-x-auto whitespace-pre-wrap">
          {last.error}
        </pre>
      )}
    </motion.div>
  );
}

const PR_QUICK_ACTIONS = [
  { icon: ShieldAlert, label: "Explain issue", prompt: "Walk me through the most critical finding in this review. Explain the failure mode in code, then ship a minimal fix as a diff." },
  { icon: Wrench, label: "Suggest fix", prompt: "Produce a complete patch for the highest-confidence issue in this PR. Include the file path, the diff, and the trade-off you accepted." },
  { icon: Zap, label: "Optimize", prompt: "Identify the most impactful performance regression in this PR. Show before/after code." },
  { icon: GitMerge, label: "Merge safety", prompt: "Given the merge safety score and security findings, give me a merge recommendation with the 2 most important caveats." },
];

function AIQuickActions({
  ask,
  ctx,
  hasReview,
}: {
  ask: (p: string, c: { prId?: string; repoId?: string; reviewId?: string }) => void;
  ctx: { prId?: string; repoId?: string; reviewId?: string };
  hasReview: boolean;
}) {
  if (!hasReview) return null;
  return (
    <div className="hidden md:flex gap-1">
      {PR_QUICK_ACTIONS.map((q) => {
        const Icon = q.icon;
        return (
          <button
            key={q.label}
            type="button"
            onClick={() => ask(q.prompt, ctx)}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-md text-xs glass hover:border-primary/40 transition text-muted-foreground hover:text-foreground"
            title={q.prompt}
          >
            <Icon className="w-3.5 h-3.5 text-primary/80" />
            {q.label}
          </button>
        );
      })}
    </div>
  );
}

function formatRelativeTime(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ReviewMetaStrip({
  durationMs,
  completedAt,
  blockers,
  mergeSafety,
  totalIssues,
}: {
  durationMs: number | null;
  completedAt: string | null;
  blockers: number;
  mergeSafety: number | null;
  totalIssues: number;
}) {
  const duration = durationMs && durationMs > 0
    ? durationMs < 1000
      ? `${durationMs}ms`
      : `${(durationMs / 1000).toFixed(1)}s`
    : null;

  const safetyPct = mergeSafety != null ? Math.round(mergeSafety * 10) : null;
  const recommendation =
    blockers > 0
      ? { label: "Request changes", icon: ShieldX, tone: "text-rose-300 bg-rose-500/10 border-rose-500/30" }
      : safetyPct != null && safetyPct >= 70
        ? { label: "Ready to merge", icon: ShieldCheck, tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" }
        : { label: "Review recommended", icon: AlertTriangle, tone: "text-amber-300 bg-amber-500/10 border-amber-500/30" };

  const RecIcon = recommendation.icon;
  const relTime = formatRelativeTime(completedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="glass rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap"
    >
      {/* AI reviewer identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 grid place-items-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">CodeSentinel AI</div>
          <div className="text-[10px] text-muted-foreground font-mono leading-tight">llama-3.3-70b · groq</div>
        </div>
      </div>

      <div className="h-8 w-px bg-border/60 hidden sm:block" />

      {/* Timing */}
      {duration && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary/70" />
          <span>completed in <span className="text-foreground font-medium tabular-nums">{duration}</span></span>
        </div>
      )}

      {relTime && (
        <div className="text-xs text-muted-foreground tabular-nums">{relTime}</div>
      )}

      <div className="text-xs text-muted-foreground">
        <span className="text-foreground font-medium tabular-nums">{totalIssues}</span> findings
      </div>

      {blockers > 0 && (
        <div className="text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 pulse-glow" />
          <span className="text-rose-300 font-medium tabular-nums">{blockers}</span>
          <span className="text-muted-foreground">{blockers === 1 ? "blocker" : "blockers"} detected</span>
        </div>
      )}

      {/* Merge recommendation badge — pushed to the right */}
      <div className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${recommendation.tone}`}>
        <RecIcon className="w-3.5 h-3.5" />
        {recommendation.label}
        {safetyPct != null && (
          <span className="text-[10px] font-mono opacity-75 ml-1">· {safetyPct}%</span>
        )}
      </div>
    </motion.div>
  );
}

