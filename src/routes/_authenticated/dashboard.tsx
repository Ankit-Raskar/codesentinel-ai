import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  GitBranch, GitPullRequest, ShieldAlert, Sparkles, ArrowRight,
  PlayCircle, Activity, CheckCircle2, Clock, Github, Zap, Bug, Lock,
  AlertTriangle, FlaskConical,
} from "lucide-react";
import { getDashboardStats } from "@/lib/reviews.functions";
import { DEMO_REPOS, nextTeamEvent, type DemoRepo, type DemoPR } from "@/lib/demoData";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dash"], queryFn: () => fn() });

  const hasRealData = (data?.reviewsCount ?? 0) > 0 || (data?.reposCount ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-xl glass animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 glass rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 glass rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!hasRealData) return <DemoWorkspace />;
  return <RealWorkspace data={data!} />;
}

// ─────────────────────────────────────────────────────────────
// Pre-populated demo workspace — shown until user connects GitHub
// ─────────────────────────────────────────────────────────────
function DemoWorkspace() {
  const repos = DEMO_REPOS.slice(0, 4);
  const allPRs = useMemo(
    () => DEMO_REPOS.flatMap((r) => r.prs.map((p) => ({ repo: r, pr: p }))),
    [],
  );
  const recentPRs = allPRs.slice(0, 6);

  // Build a "recent AI activity" stream from real demo issues
  const recentFindings = useMemo(() => {
    const items: {
      id: string;
      severity: string;
      title: string;
      repo: string;
      prNumber: number;
      file: string;
      ago: string;
    }[] = [];
    let mins = 2;
    for (const { repo, pr } of allPRs) {
      for (const it of pr.issues) {
        items.push({
          id: it.id,
          severity: it.severity,
          title: it.title,
          repo: repo.name,
          prNumber: pr.number,
          file: it.file,
          ago: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
        });
        mins += 3 + Math.floor(Math.random() * 11);
      }
    }
    return items.slice(0, 12);
  }, [allPRs]);

  // Live ticker of synthetic team events
  const [events, setEvents] = useState(() =>
    Array.from({ length: 5 }, (_, i) => nextTeamEvent(Date.now() + i * 97)),
  );
  useEffect(() => {
    const t = setInterval(
      () => setEvents((prev) => [nextTeamEvent(Date.now()), ...prev].slice(0, 6)),
      3800,
    );
    return () => clearInterval(t);
  }, []);

  // Aggregate metrics across demo data
  const m = useMemo(() => {
    let critical = 0, high = 0, total = 0, prs = 0;
    let safetySum = 0, secSum = 0, n = 0;
    for (const r of DEMO_REPOS) {
      prs += r.openPRs;
      for (const p of r.prs) {
        safetySum += p.mergeSafety;
        secSum += p.securityScore;
        n++;
        for (const i of p.issues) {
          total++;
          if (i.severity === "critical") critical++;
          if (i.severity === "high") high++;
        }
      }
    }
    return {
      critical, high, total, prs,
      avgSafety: Math.round(safetySum / n),
      avgSec: Math.round(secSum / n),
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header + demo banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-200 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-full mb-2">
            <FlaskConical className="w-3 h-3" /> Demo workspace · sample data
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Exploring with 4 sample repositories and 12 live AI reviews. Connect GitHub to swap in your real PRs.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/demo"
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            <PlayCircle className="w-4 h-4" /> Watch AI review a PR
          </Link>
          <Link
            to="/settings"
            className="px-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-2 text-sm inline-flex items-center gap-2 transition"
          >
            <Github className="w-4 h-4" /> Connect GitHub
          </Link>
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Repositories", value: DEMO_REPOS.length, icon: GitBranch, tone: "neutral" as const },
          { label: "Open PRs", value: m.prs, icon: GitPullRequest, tone: "neutral" as const },
          { label: "AI reviews", value: DEMO_REPOS.reduce((a, r) => a + r.prs.length, 0), icon: Sparkles, tone: "accent" as const },
          { label: "Critical findings", value: m.critical, icon: ShieldAlert, tone: "warn" as const },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass p-4"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] uppercase tracking-wider">{s.label}</span>
              <s.icon
                className={`w-3.5 h-3.5 ${
                  s.tone === "accent" ? "text-amber" : s.tone === "warn" ? "text-rose-300" : ""
                }`}
              />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Repositories grid */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-semibold">Repositories</h2>
            <p className="text-xs text-muted-foreground">Synced from your team. Click any repo to walk through its PRs.</p>
          </div>
          <Link to="/demo" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            Open in demo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {repos.map((r, i) => (
            <RepoCard key={r.id} r={r} i={i} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4">
        {/* Recent pull requests */}
        <section className="glass-strong rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-primary" /> Active pull requests
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {recentPRs.length} open
            </span>
          </div>
          <ul className="space-y-2">
            {recentPRs.map(({ repo, pr }) => (
              <PRRow key={pr.id} repo={repo} pr={pr} />
            ))}
          </ul>
        </section>

        {/* Live AI activity */}
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber pulse-glow" /> Live AI activity
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" /> live
            </span>
          </div>
          <ul className="space-y-2 text-sm">
            {events.map((e, i) => (
              <motion.li
                key={`${e.text}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2.5 py-1.5 border-b border-border/40 last:border-0"
              >
                <EventIcon kind={e.kind} />
                <span className="text-[13px] leading-snug text-foreground/90 flex-1">{e.text}</span>
              </motion.li>
            ))}
          </ul>
        </section>
      </div>

      {/* Recent AI findings */}
      <section className="glass-strong rounded-xl p-5">
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-300" /> Recent AI findings
          </h2>
          <div className="flex gap-3 text-[11px] font-mono flex-wrap">
            <span className="text-rose-300">{m.critical} critical</span>
            <span className="text-amber-200">{m.high} high</span>
            <span className="text-muted-foreground">avg merge safety {m.avgSafety}%</span>
          </div>
        </div>
        <ul className="divide-y divide-border/50">
          {recentFindings.map((f) => (
            <li key={f.id} className="py-2.5 flex items-start gap-3 text-sm">
              <SeverityDot s={f.severity} />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{f.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                  {f.repo} · PR #{f.prNumber} · {f.file}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {f.ago}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RepoCard({ r, i }: { r: DemoRepo; i: number }) {
  const riskTone =
    r.riskScore > 70 ? "text-rose-300" : r.riskScore > 40 ? "text-amber-200" : "text-emerald-300";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <Link
        to="/demo"
        className="block glass rounded-xl p-4 hover:glow-border transition group h-full"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[10px] font-mono text-muted-foreground truncate">
            {r.owner}/
          </span>
        </div>
        <div className="font-semibold truncate mt-0.5 group-hover:text-primary transition">{r.name}</div>
        <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[2em]">
          {r.language} · {r.stars.toLocaleString()}★
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Health</div>
            <div className="text-sm font-mono text-emerald-300">{r.health}%</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Risk</div>
            <div className={`text-sm font-mono ${riskTone}`}>{r.riskScore}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">PRs</div>
            <div className="text-sm font-mono">{r.openPRs}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
          <span className="text-muted-foreground flex items-center gap-1">
            <Activity className="w-2.5 h-2.5 text-emerald-400 pulse-glow" /> {r.lastScan}
          </span>
          <span className="text-rose-300/80">{r.vulnerabilities} vuln</span>
        </div>
      </Link>
    </motion.div>
  );
}

function PRRow({ repo, pr }: { repo: DemoRepo; pr: DemoPR }) {
  const statusTone =
    pr.status === "risky" ? "border-rose-500/40 text-rose-300 bg-rose-500/10"
    : pr.status === "ready" || pr.status === "approved" ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
    : "border-amber-500/40 text-amber-200 bg-amber-500/10";
  const safetyTone =
    pr.mergeSafety >= 80 ? "text-emerald-300" : pr.mergeSafety >= 60 ? "text-amber-200" : "text-rose-300";
  return (
    <li>
      <Link
        to="/demo"
        className="block rounded-lg border border-border/50 hover:border-primary/40 hover:bg-surface-2/60 transition p-3"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border ${statusTone}`}>
            {pr.status}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {repo.name} · #{pr.number}
          </span>
          <span className="ml-auto text-[11px] font-mono">
            merge safety <span className={`font-semibold ${safetyTone}`}>{pr.mergeSafety}%</span>
          </span>
        </div>
        <div className="mt-1.5 text-sm font-medium truncate">{pr.title}</div>
        <div className="mt-1 text-[11px] font-mono text-muted-foreground truncate">
          by {pr.author} · {pr.openedAt} · {pr.filesChanged} files · +{pr.additions} / −{pr.deletions} · {pr.issues.length} findings
        </div>
      </Link>
    </li>
  );
}

function SeverityDot({ s }: { s: string }) {
  const map: Record<string, string> = {
    critical: "bg-rose-500",
    high: "bg-amber-400",
    medium: "bg-amber-300/70",
    low: "bg-emerald-400",
    info: "bg-muted",
  };
  return <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${map[s] ?? "bg-muted"}`} />;
}

function EventIcon({ kind }: { kind: string }) {
  const map: Record<string, { Icon: typeof Bug; color: string }> = {
    vuln: { Icon: ShieldAlert, color: "text-rose-300" },
    shield: { Icon: Lock, color: "text-emerald-300" },
    merge: { Icon: GitPullRequest, color: "text-primary" },
    push: { Icon: GitBranch, color: "text-muted-foreground" },
    perf: { Icon: Zap, color: "text-amber-200" },
    ok: { Icon: CheckCircle2, color: "text-emerald-300" },
    ai: { Icon: Sparkles, color: "text-primary" },
  };
  const { Icon, color } = map[kind] ?? { Icon: AlertTriangle, color: "text-muted-foreground" };
  return <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />;
}

// ─────────────────────────────────────────────────────────────
// Real workspace (preserved from prior version)
// ─────────────────────────────────────────────────────────────
function RealWorkspace({ data }: { data: NonNullable<Awaited<ReturnType<typeof getDashboardStats>>> }) {
  const reviews = data.recentReviews ?? [];
  const hasData = reviews.length > 0;

  const avgSec = hasData
    ? Math.round(reviews.reduce((a, r) => a + (Number(r.security_score) || 0), 0) / reviews.length)
    : 0;
  const avgSafety = hasData
    ? Math.round(reviews.reduce((a, r) => a + (Number(r.quality_score) || 0), 0) / reviews.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reviews in flight, recent findings, and what's blocking merge.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/demo" className="px-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-2 text-sm inline-flex items-center gap-2 transition">
            <PlayCircle className="w-4 h-4" /> Demo
          </Link>
          <Link to="/repos" className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-2 hover:opacity-90 transition">
            Review a PR <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Repositories", value: data.reposCount ?? 0, icon: GitBranch },
          { label: "Open PRs", value: data.prsCount ?? 0, icon: GitPullRequest },
          { label: "AI reviews", value: data.reviewsCount ?? 0, icon: Sparkles },
          { label: "Critical findings", value: data.bySeverity.critical ?? 0, icon: ShieldAlert },
        ].map((s) => (
          <div key={s.label} className="glass p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] uppercase tracking-wider">{s.label}</span>
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4">
        <div className="glass-strong p-6">
          <h2 className="font-semibold mb-4">Merge readiness</h2>
          <div className="grid grid-cols-2 gap-3">
            <Readout label="Avg merge safety" value={avgSafety} suffix="%" tone={avgSafety < 60 ? "warn" : "good"} />
            <Readout label="Avg security" value={avgSec} suffix="%" tone={avgSec < 60 ? "warn" : "good"} />
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber" /> Recent reviews
          </h2>
          <ul className="divide-y divide-border/60 text-sm -mx-2">
            {reviews.slice(0, 8).map((r) => (
              <li key={r.id} className="py-2.5 px-2 flex items-start gap-3">
                <div className="w-7 h-7 rounded-md grid place-items-center shrink-0 bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-[13px]">{r.summary?.slice(0, 80) || "(no summary)"}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {new Date(r.created_at).toLocaleString()} · {r.status}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground shrink-0 tabular-nums">
                  {r.quality_score ?? "—"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, suffix = "", tone }: { label: string; value: number; suffix?: string; tone: "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-200" : "text-rose-300";
  return (
    <div className="rounded-lg border border-border/60 bg-surface px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}{suffix}</div>
    </div>
  );
}
