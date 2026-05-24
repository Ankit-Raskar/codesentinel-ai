import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/reviews.functions";
import { Sparkles, ShieldAlert, Clock, PlayCircle, FlaskConical, ArrowRight } from "lucide-react";
import { DEMO_REPOS } from "@/lib/demoData";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/reviews")({ component: Reviews });

function Reviews() {
  const fn = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["dash"], queryFn: () => fn() });

  const hasReal = (data?.recentReviews?.length ?? 0) > 0;

  // Build synthetic recent-review feed from demo PRs
  const demoReviews = useMemo(() => {
    const items: {
      id: string;
      title: string;
      repo: string;
      prNumber: number;
      mergeSafety: number;
      issues: number;
      critical: number;
      status: string;
      summary: string;
      ago: string;
    }[] = [];
    let mins = 1;
    for (const r of DEMO_REPOS) {
      for (const p of r.prs) {
        items.push({
          id: p.id,
          title: p.title,
          repo: r.name,
          prNumber: p.number,
          mergeSafety: p.mergeSafety,
          issues: p.issues.length,
          critical: p.issues.filter((i) => i.severity === "critical").length,
          status: p.status,
          summary: p.summary,
          ago: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
        });
        mins += 7 + Math.floor(Math.random() * 22);
      }
    }
    return items;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          {!hasReal && (
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-full mb-2">
              <FlaskConical className="w-3 h-3" /> Sample reviews · connect GitHub for yours
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Every AI review across your repositories.
          </p>
        </div>
        <Link
          to="/demo"
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <PlayCircle className="w-4 h-4" /> Watch a review run
        </Link>
      </div>

      <div className="glass rounded-xl divide-y divide-border overflow-hidden">
        {hasReal
          ? data!.recentReviews.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.summary?.slice(0, 100) || "(no summary)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} · {r.total_issues ?? 0} issues
                  </div>
                </div>
                <div className="text-sm font-mono text-primary">{r.quality_score ?? "—"}/10</div>
              </div>
            ))
          : demoReviews.map((r) => {
              const safetyTone =
                r.mergeSafety >= 80 ? "text-emerald-300"
                : r.mergeSafety >= 60 ? "text-amber-200"
                : "text-rose-300";
              return (
                <Link key={r.id} to="/demo" className="p-4 flex items-start gap-3 hover:bg-surface-2/60 transition">
                  <div className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${
                    r.critical > 0 ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"
                  }`}>
                    {r.critical > 0 ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>{r.repo} · #{r.prNumber}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.ago}</span>
                      <span>{r.issues} findings</span>
                      {r.critical > 0 && <span className="text-rose-300">{r.critical} critical</span>}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-1.5 line-clamp-1">{r.summary}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">merge safety</div>
                    <div className={`text-lg font-mono font-semibold ${safetyTone}`}>{r.mergeSafety}%</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-1.5" />
                </Link>
              );
            })}
      </div>
    </div>
  );
}
