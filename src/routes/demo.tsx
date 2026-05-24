import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ArrowLeft, ArrowRight, GitPullRequest, GitBranch, Sparkles,
  CheckCircle2, AlertTriangle, FileCode2, Play, ChevronLeft,
  Loader2, MessageSquare, ShieldCheck, Activity, Code2,
} from "lucide-react";
import {
  DEMO_REPOS, severityColor,
  type DemoPR, type DemoRepo, type DemoIssue,
} from "@/lib/demoData";
import { DemoAIChat } from "@/components/demo/DemoAIChat";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Try CodeSentinel — guided demo" },
      { name: "description", content: "Walk through an AI code review step by step: pick a repo, choose a PR, run the review, explore findings, then chat with the AI assistant." },
      { property: "og:title", content: "Try CodeSentinel — guided demo" },
      { property: "og:description", content: "A calm, manual walkthrough of an AI-powered PR review." },
    ],
  }),
});

const REPO_META: Record<string, string> = {
  "vulnerable-auth-api": "Authentication & session security service",
  "legacy-payment-service": "Stripe billing and ledger backend",
  "realtime-chat-service": "WebSocket-based chat and presence",
  "analytics-dashboard": "Internal product analytics dashboard",
  "ecommerce-backend": "Storefront API, orders and inventory",
  "ml-inference-gateway": "Model serving and rate-limiting gateway",
};

const STEPS = [
  { n: 1, label: "Choose repository" },
  { n: 2, label: "Select pull request" },
  { n: 3, label: "Start AI review" },
  { n: 4, label: "AI analysis" },
  { n: 5, label: "Review findings" },
  { n: 6, label: "AI assistant" },
] as const;

type StepN = 1 | 2 | 3 | 4 | 5 | 6;

const SCAN_STAGES = [
  "Fetching pull request diff…",
  "Parsing changed files…",
  "Running security analysis (OWASP, secrets)…",
  "Detecting performance regressions…",
  "Reviewing architecture & coupling…",
  "Computing merge safety score…",
  "Review complete.",
];

function DemoPage() {
  const [step, setStep] = useState<StepN>(1);
  const [repo, setRepo] = useState<DemoRepo | null>(null);
  const [pr, setPr] = useState<DemoPR | null>(null);
  const [issue, setIssue] = useState<DemoIssue | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  const go = (n: StepN) => setStep(n);

  // Step 4 — progressive scan reveal (one stage at a time, then auto-advance)
  useEffect(() => {
    if (step !== 4 || !pr) return;
    setStageIdx(0);
    const stageMs = 750;
    const timers: ReturnType<typeof setTimeout>[] = [];
    SCAN_STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setStageIdx(i + 1), stageMs * (i + 1)));
    });
    timers.push(
      setTimeout(() => {
        setIssue(pr.issues[0] ?? null);
        setStep(5);
      }, stageMs * (SCAN_STAGES.length + 1)),
    );
    return () => timers.forEach(clearTimeout);
  }, [step, pr]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Stepper step={step} repo={repo} pr={pr} onJump={(n) => {
        // only allow jumping back to completed steps
        if (n < step) setStep(n);
      }} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepShell key="s1" eyebrow="Step 1 of 6" title="Choose a repository" sub="Pick one of the preloaded demo repositories to review.">
              <RepoGrid
                selectedId={repo?.id}
                onPick={(r) => {
                  setRepo(r);
                  setPr(null);
                  setIssue(null);
                }}
              />
              <Footer
                primary={{ label: "Continue", disabled: !repo, onClick: () => go(2) }}
              />
            </StepShell>
          )}

          {step === 2 && repo && (
            <StepShell key="s2" eyebrow="Step 2 of 6" title="Select a pull request" sub={`Open pull requests in ${repo.owner}/${repo.name}.`}>
              <PRList
                repo={repo}
                selectedId={pr?.id}
                onPick={(p) => setPr(p)}
              />
              <Footer
                back={{ label: "Back", onClick: () => go(1) }}
                primary={{ label: "Continue", disabled: !pr, onClick: () => go(3) }}
              />
            </StepShell>
          )}

          {step === 3 && repo && pr && (
            <StepShell key="s3" eyebrow="Step 3 of 6" title="Start the AI review" sub="The AI will analyze the diff for security, performance, architecture, and merge safety. Nothing runs until you click below.">
              <ReviewPreview repo={repo} pr={pr} />
              <Footer
                back={{ label: "Back", onClick: () => go(2) }}
                primary={{
                  label: "Run AI review",
                  icon: <Play className="w-4 h-4" />,
                  onClick: () => go(4),
                }}
              />
            </StepShell>
          )}

          {step === 4 && repo && pr && (
            <StepShell key="s4" eyebrow="Step 4 of 6" title="AI analysis in progress" sub={`Reviewing #${pr.number} — ${pr.title}`}>
              <ScanProgress stageIdx={stageIdx} pr={pr} />
            </StepShell>
          )}

          {step === 5 && repo && pr && (
            <StepShell key="s5" eyebrow="Step 5 of 6" title="Review the AI findings" sub={`${pr.issues.length} findings on #${pr.number}. Click a finding to inspect details and the suggested fix.`}>
              <Findings pr={pr} issue={issue} setIssue={setIssue} />
              <Footer
                back={{ label: "Back", onClick: () => go(3) }}
                primary={{
                  label: "Open AI assistant",
                  icon: <MessageSquare className="w-4 h-4" />,
                  onClick: () => {
                    go(6);
                    setChatOpen(true);
                  },
                }}
              />
            </StepShell>
          )}

          {step === 6 && repo && pr && (
            <StepShell key="s6" eyebrow="Step 6 of 6" title="Chat with the AI assistant" sub="Ask the assistant to explain findings, draft fixes, or recommend whether to merge.">
              <AssistantCallout open={chatOpen} onOpen={() => setChatOpen(true)} />
              <Footer
                back={{ label: "Back to findings", onClick: () => go(5) }}
                primary={{
                  label: "Connect real GitHub",
                  href: "/login",
                }}
              />
            </StepShell>
          )}
        </AnimatePresence>
      </main>

      {pr && (
        <DemoAIChat
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          pr={pr}
          focusIssue={issue}
        />
      )}
    </div>
  );
}

/* ---------- shell pieces ---------- */

function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <span className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">CodeSentinel</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-muted-foreground border border-border">
            DEMO
          </span>
        </div>
      </div>
      <Link
        to="/login"
        className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium whitespace-nowrap"
      >
        <span className="hidden sm:inline">Connect real GitHub</span>
        <span className="sm:hidden">Connect</span>
      </Link>
    </header>
  );
}

function Stepper({
  step, repo, pr, onJump,
}: {
  step: StepN;
  repo: DemoRepo | null;
  pr: DemoPR | null;
  onJump: (n: StepN) => void;
}) {
  return (
    <div className="border-b border-border bg-surface/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 flex-wrap">
        {STEPS.map((s, i) => {
          const done = s.n < step;
          const active = s.n === step;
          const clickable = s.n < step;
          return (
            <div key={s.n} className="flex items-center gap-1.5 shrink-0">
              <button
                disabled={!clickable}
                onClick={() => onJump(s.n as StepN)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs transition ${
                  active ? "text-foreground" : done ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/50"
                } ${clickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-mono shrink-0 ${
                  active ? "bg-primary text-primary-foreground" :
                  done ? "bg-surface-2 text-foreground border border-border" :
                  "border border-border"
                }`}>
                  {done ? "✓" : s.n}
                </span>
                <span className={`whitespace-nowrap ${active ? "inline" : "hidden lg:inline"}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className="text-muted-foreground/30 text-xs">›</span>}
            </div>
          );
        })}
        <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] font-mono text-muted-foreground pl-3 shrink-0">
          {repo && <span>{repo.owner}/{repo.name}</span>}
          {pr && <span>· #{pr.number}</span>}
        </div>
      </div>
    </div>
  );
}

function StepShell({
  eyebrow, title, sub, children,
}: {
  eyebrow: string; title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">{eyebrow}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">{sub}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function Footer({
  back, primary,
}: {
  back?: { label: string; onClick: () => void };
  primary: { label: string; disabled?: boolean; onClick?: () => void; href?: string; icon?: React.ReactNode };
}) {
  const btnClass = `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
    primary.disabled
      ? "bg-surface-2 text-muted-foreground cursor-not-allowed"
      : "bg-primary text-primary-foreground hover:opacity-90"
  }`;
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/60">
      {back ? (
        <button
          onClick={back.onClick}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronLeft className="w-4 h-4" /> {back.label}
        </button>
      ) : <span />}
      {primary.href ? (
        <Link to={primary.href} className={btnClass}>
          {primary.icon} {primary.label} <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <button onClick={primary.onClick} disabled={primary.disabled} className={btnClass}>
          {primary.icon} {primary.label} {!primary.icon && <ArrowRight className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

/* ---------- step 1 ---------- */

function RepoGrid({ selectedId, onPick }: { selectedId?: string; onPick: (r: DemoRepo) => void }) {
  const repos = useMemo(() => DEMO_REPOS.slice(0, 4), []);
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {repos.map((r) => {
        const active = r.id === selectedId;
        const riskTone =
          r.riskScore > 70 ? "text-rose-400 border-rose-500/30 bg-rose-500/10" :
          r.riskScore > 40 ? "text-amber-300 border-amber-500/30 bg-amber-500/10" :
          "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
        return (
          <button
            key={r.id}
            onClick={() => onPick(r)}
            className={`text-left p-4 rounded-xl border transition ${
              active
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-border/80 hover:bg-surface-2/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-muted-foreground">{r.owner}</div>
                  <div className="font-semibold tracking-tight truncate">{r.name}</div>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${riskTone}`}>
                risk {r.riskScore}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              {REPO_META[r.name] ?? "Production service in the demo workspace."}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              <span>{r.language}</span>
              <span>· {r.openPRs} PRs</span>
              <span>· health {r.health}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- step 2 ---------- */

function PRList({ repo, selectedId, onPick }: { repo: DemoRepo; selectedId?: string; onPick: (p: DemoPR) => void }) {
  return (
    <ul className="space-y-2">
      {repo.prs.map((p) => {
        const active = p.id === selectedId;
        const safeTone =
          p.mergeSafety < 50 ? "text-rose-400" :
          p.mergeSafety < 75 ? "text-amber-300" :
          "text-emerald-400";
        return (
          <li key={p.id}>
            <button
              onClick={() => onPick(p)}
              className={`w-full text-left p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center gap-3 ${
                active
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-border/80 hover:bg-surface-2/40"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-mono text-muted-foreground">#{p.number}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                    {p.status}
                  </span>
                </div>
                <div className="font-medium mt-1 truncate">{p.title}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-1">
                  {p.author} · {p.branch} → main · {p.filesChanged} files · +{p.additions} / −{p.deletions}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-6 sm:text-center">
                <Metric label="Merge safety" value={`${p.mergeSafety}%`} tone={safeTone} />
                <Metric label="AI conf." value={`${p.aiConfidence}%`} tone="text-foreground" />
                <Metric label="Risk" value={p.issues.length ? `${p.issues.length} issues` : "clean"} tone={p.issues.length ? "text-amber-300" : "text-emerald-400"} />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className={`text-sm font-mono font-semibold ${tone}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

/* ---------- step 3 ---------- */

function ReviewPreview({ repo, pr }: { repo: DemoRepo; pr: DemoPR }) {
  const items = [
    { icon: ShieldCheck, label: "Security analysis", detail: "OWASP top 10, secrets, auth flow" },
    { icon: Activity, label: "Performance", detail: "N+1, blocking IO, re-renders" },
    { icon: Code2, label: "Architecture", detail: "Module boundaries, coupling, dependencies" },
    { icon: GitPullRequest, label: "Merge safety", detail: "Weighted score across severity & diff size" },
  ];
  return (
    <div className="rounded-xl border border-border p-5 bg-surface/40">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <div className="text-[10px] font-mono text-muted-foreground">{repo.owner}/{repo.name}</div>
          <div className="font-semibold mt-1">#{pr.number} — {pr.title}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">
            {pr.author} · {pr.filesChanged} files · +{pr.additions} / −{pr.deletions}
          </div>
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3 pt-4">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-3 text-sm">
            <it.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">{it.label}</div>
              <div className="text-xs text-muted-foreground">{it.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- step 4 ---------- */

function ScanProgress({ stageIdx, pr }: { stageIdx: number; pr: DemoPR }) {
  const done = stageIdx >= SCAN_STAGES.length;
  return (
    <div className="rounded-xl border border-border p-6 bg-surface/40">
      <div className="flex items-center gap-2 text-sm">
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        )}
        <span className="font-medium">
          {done ? "Analysis complete" : "Analyzing pull request"}
        </span>
        <span className="ml-auto text-[11px] font-mono text-muted-foreground">
          #{pr.number}
        </span>
      </div>
      <ol className="mt-5 space-y-2.5">
        {SCAN_STAGES.map((s, i) => {
          const reached = i < stageIdx;
          const current = i === stageIdx - 1 && !done;
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-mono shrink-0 ${
                reached
                  ? (current ? "bg-primary text-primary-foreground" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30")
                  : "border border-border text-muted-foreground/50"
              }`}>
                {reached && !current ? "✓" : i + 1}
              </span>
              <span className={reached ? "text-foreground" : "text-muted-foreground/60"}>
                {s}
              </span>
              {current && <Loader2 className="w-3 h-3 text-primary animate-spin ml-1" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- step 5 ---------- */

function Findings({ pr, issue, setIssue }: { pr: DemoPR; issue: DemoIssue | null; setIssue: (i: DemoIssue) => void }) {
  if (!pr.issues.length) {
    return (
      <div className="rounded-xl border border-border p-10 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <div className="font-medium">No blocking issues</div>
        <div className="text-sm text-muted-foreground mt-1">
          Merge safety {pr.mergeSafety}%. This PR is safe to merge.
        </div>
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      <ul className="space-y-1.5 md:max-h-[520px] md:overflow-y-auto pr-1">
        {pr.issues.map((it) => {
          const active = issue?.id === it.id;
          return (
            <li key={it.id}>
              <button
                onClick={() => setIssue(it)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  active
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/60 hover:bg-surface-2/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${severityColor(it.severity)}`}>
                    {it.severity}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{it.confidence}%</span>
                </div>
                <div className="text-sm font-medium mt-1.5">{it.title}</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                  {it.file}:{it.line}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="rounded-xl border border-border p-5 bg-surface/40 min-w-0">
        {issue && (
          <AnimatePresence mode="wait">
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                <span className={severityColor(issue.severity).split(" ")[0]}>{issue.severity}</span>
                <span className="text-muted-foreground">· {issue.category}</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mt-1">{issue.title}</h3>
              <div className="text-[11px] font-mono text-muted-foreground mt-1 flex items-center gap-1.5">
                <FileCode2 className="w-3 h-3" /> {issue.file}:{issue.line}
              </div>
              <p className="mt-4 text-sm text-foreground/90 leading-relaxed">{issue.explanation}</p>
              <div className="mt-4 grid gap-3">
                <CodeCard label="Detected" tone="bad" code={issue.snippet} />
                <CodeCard label="AI suggested fix" tone="good" code={issue.fix} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function CodeCard({ label, tone, code }: { label: string; tone: "bad" | "good"; code: string }) {
  const ring = tone === "bad" ? "border-rose-500/30" : "border-emerald-500/30";
  const tag = tone === "bad" ? "text-rose-300" : "text-emerald-300";
  return (
    <pre className={`rounded-lg p-3 text-[11.5px] font-mono leading-relaxed overflow-x-auto border bg-background/40 ${ring}`}>
      <div className="flex items-center justify-between mb-2 text-[9px] uppercase tracking-[0.2em]">
        <span className={tag}>{label}</span>
      </div>
      <code className="text-foreground/90 whitespace-pre">{code}</code>
    </pre>
  );
}

/* ---------- step 6 ---------- */

function AssistantCallout({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <div className="rounded-xl border border-border p-6 bg-surface/40">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/15 grid place-items-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">The assistant has the full review loaded</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Ask follow-up questions, request a deeper explanation of a finding, draft a fix as a diff, or get a merge recommendation. The assistant only references this pull request — it won't go off-topic.
          </p>
          {!open && (
            <button
              onClick={onOpen}
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" /> Open the AI assistant
            </button>
          )}
          {open && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Assistant is open on the right.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
