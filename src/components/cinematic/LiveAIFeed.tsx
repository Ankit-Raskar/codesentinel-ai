import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ShieldAlert, Zap, GitBranch, Cpu, CheckCircle2, FileCode2, GitPullRequest, Sparkles, Lock,
} from "lucide-react";

type Log = {
  icon: typeof ShieldAlert;
  text: string;
  tone: keyof typeof TONE;
  ms: number;
  kind?: "issue" | "score";
  sev?: "critical" | "warning" | "suggestion";
};

const TONE = {
  muted: "text-muted-foreground",
  primary: "text-primary",
  critical: "text-rose-400",
  warning: "text-amber-300",
  suggestion: "text-emerald-300",
} as const;

const ISSUE_POOL: Log[] = [
  { icon: ShieldAlert, text: "CRIT   ▸ raw SQL concat · users.ts:42", tone: "critical", ms: 0, kind: "issue", sev: "critical" },
  { icon: ShieldAlert, text: "CRIT   ▸ unsafe eval · webhook.ts:118", tone: "critical", ms: 0, kind: "issue", sev: "critical" },
  { icon: ShieldAlert, text: "CRIT   ▸ hardcoded secret · stripe.ts:8", tone: "critical", ms: 0, kind: "issue", sev: "critical" },
  { icon: Lock,        text: "CRIT   ▸ broken auth · session.ts:91",   tone: "critical", ms: 0, kind: "issue", sev: "critical" },
  { icon: Zap,         text: "WARN   ▸ O(n²) in subscriptionDiff()",   tone: "warning",  ms: 0, kind: "issue", sev: "warning" },
  { icon: Zap,         text: "WARN   ▸ blocking fs.readSync · log.ts", tone: "warning",  ms: 0, kind: "issue", sev: "warning" },
  { icon: Zap,         text: "WARN   ▸ ReDoS in email regex",          tone: "warning",  ms: 0, kind: "issue", sev: "warning" },
  { icon: CheckCircle2,text: "hint   ▸ debounce search input · 250ms", tone: "suggestion", ms: 0, kind: "issue", sev: "suggestion" },
  { icon: CheckCircle2,text: "hint   ▸ memo expensive selector",       tone: "suggestion", ms: 0, kind: "issue", sev: "suggestion" },
  { icon: CheckCircle2,text: "hint   ▸ extract Stripe webhook handler",tone: "suggestion", ms: 0, kind: "issue", sev: "suggestion" },
];

const PR_TITLES = [
  { num: 418, branch: "feat/billing-portal", title: "Add Stripe billing portal & invoice history" },
  { num: 521, branch: "fix/session-leak",    title: "Patch session leak in oauth refresh" },
  { num: 274, branch: "feat/realtime-feed",  title: "Realtime PR review feed over SSE" },
  { num: 612, branch: "perf/diff-engine",    title: "Switch diff engine to streaming tokens" },
];

function pick<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function seeded(s: number) {
  let v = (s >>> 0) || 1;
  return () => ((v = (v * 1664525 + 1013904223) >>> 0) / 0xffffffff);
}

function buildRun(seed: number) {
  const rng = seeded(seed);
  const pr = PR_TITLES[Math.floor(rng() * PR_TITLES.length)];
  const issueCount = 3 + Math.floor(rng() * 3); // 3-5 issues
  const issues = pick(ISSUE_POOL, issueCount, rng);
  const fileCount = 30 + Math.floor(rng() * 60);
  const loc = 8000 + Math.floor(rng() * 14000);
  const safety = 58 + Math.floor(rng() * 38); // 58-95

  const head: Log[] = [
    { icon: GitBranch,  text: `fetch  ▸ origin/${pr.branch}`,                   tone: "muted",   ms: 320 + Math.floor(rng() * 200) },
    { icon: Cpu,        text: `parse  ▸ ${fileCount} files · ${loc.toLocaleString()} LOC`, tone: "muted", ms: 680 + Math.floor(rng() * 220) },
    { icon: Activity,   text: `model  ▸ llama-3.3-70b · streaming`,             tone: "primary", ms: 1080 + Math.floor(rng() * 220) },
  ];
  let t = head[head.length - 1].ms + 280;
  const issueLogs = issues.map((iss) => {
    t += 320 + Math.floor(rng() * 280);
    return { ...iss, ms: t };
  });
  t += 360;
  const tail: Log[] = [
    { icon: Sparkles,     text: `score  ▸ merge_safety = ${(safety / 10).toFixed(1)} / 10`, tone: "primary", ms: t, kind: "score" },
    { icon: CheckCircle2, text: `review ▸ complete · ${issues.length} findings`,             tone: "primary", ms: t + 380 },
  ];
  return { logs: [...head, ...issueLogs, ...tail], pr, safety, total: issues.length };
}

// Deterministic initial seed so SSR and the first client render match.
// We reseed to a time-based value inside useEffect (client-only) before kicking off the run.
const INITIAL_SEED = 1;

export function LiveAIFeed() {
  const [run, setRun] = useState(() => buildRun(INITIAL_SEED));
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(6);
  const [counts, setCounts] = useState({ critical: 0, warning: 0, suggestion: 0 });
  const [safety, setSafety] = useState<number | null>(null);
  const seedRef = useRef(INITIAL_SEED);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const start = (r: ReturnType<typeof buildRun>) => {
      setStep(0);
      setProgress(6);
      setCounts({ critical: 0, warning: 0, suggestion: 0 });
      setSafety(null);

      r.logs.forEach((l, i) => {
        timeouts.push(
          setTimeout(() => {
            if (cancelled) return;
            setStep(i + 1);
            setProgress(Math.min(100, Math.round(((i + 1) / r.logs.length) * 100)));
            if (l.kind === "issue" && l.sev) {
              setCounts((c) => ({ ...c, [l.sev!]: c[l.sev!] + 1 }));
            }
            if (l.kind === "score") {
              let v = 0;
              const target = r.safety;
              const tick = setInterval(() => {
                v += Math.max(2, Math.floor(target / 18));
                if (v >= target) {
                  v = target;
                  clearInterval(tick);
                }
                if (!cancelled) setSafety(v);
              }, 26);
            }
          }, l.ms),
        );
      });

      const totalMs = r.logs[r.logs.length - 1].ms + 1400;
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          seedRef.current = seedRef.current + 9973;
          const next = buildRun(seedRef.current);
          setRun(next);
          start(next);
        }, totalMs),
      );
    };

    // Reseed on the client only, then start the run with fresh data.
    seedRef.current = Date.now();
    const first = buildRun(seedRef.current);
    setRun(first);
    start(first);
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = run.logs.slice(0, step);
  const isScanning = step > 0 && step < run.logs.length;

  return (
    <div className="glass-strong rounded-2xl relative overflow-hidden">
      {/* cinematic scan beam — only while scanning */}
      {isScanning && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, color-mix(in oklab, var(--glow) 45%, transparent) 50%, transparent 100%)",
            height: "22%",
            animation: "scan 2.6s linear infinite",
          }}
        />
      )}

      {/* window chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <FileCode2 className="w-3 h-3" /> codesentinel · review.stream
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
          live
        </div>
      </div>

      {/* PR header */}
      <div className="px-5 pt-5 pb-3 relative">
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <GitPullRequest className="w-3 h-3 text-primary" />
          <span className="text-foreground/80">#{run.pr.num}</span>
          <span>·</span>
          <span className="truncate">{run.pr.branch} → main</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.h3
            key={run.pr.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="mt-1.5 text-base sm:text-lg font-semibold tracking-tight"
          >
            {run.pr.title}
          </motion.h3>
        </AnimatePresence>

        {/* progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
            <span>analyzing · llama-3.3-70b</span>
            <span className="tabular-nums text-foreground/80">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
              animate={{ width: `${progress}%` }}
              transition={{ ease: [0.22, 0.61, 0.36, 1], duration: 0.7 }}
            />
            {isScanning && (
              <div
                className="absolute inset-y-0 w-12 opacity-70 mix-blend-screen pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in oklab, var(--glow) 80%, white), transparent)",
                  animation: "scan-beam 1.6s ease-in-out infinite",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* terminal */}
      <div className="px-5 pb-4">
        <div className="font-mono text-[11.5px] leading-relaxed min-h-[210px] space-y-1">
          <AnimatePresence initial={false}>
            {shown.map((l, i) => {
              const Icon = l.icon;
              return (
                <motion.div
                  key={`${run.pr.num}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                  className={`flex items-center gap-2 ${TONE[l.tone]}`}
                >
                  <Icon className="w-3 h-3 shrink-0 opacity-80" />
                  <span className="truncate">{l.text}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* counters + merge safety */}
      <div className="grid grid-cols-4 gap-px bg-white/5 border-t border-white/5">
        <Counter label="critical" value={counts.critical} tone="text-rose-400" pulse={counts.critical > 0 && isScanning} />
        <Counter label="warning" value={counts.warning} tone="text-amber-300" />
        <Counter label="hints" value={counts.suggestion} tone="text-emerald-300" />
        <div className="bg-background/40 px-3 py-3">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            merge safety
          </div>
          <div className="mt-1 flex items-end gap-1.5">
            <div className="text-2xl font-semibold tabular-nums">
              {safety ?? "–"}
              {safety !== null && <span className="text-sm text-muted-foreground">%</span>}
            </div>
            {safety !== null && (
              <span
                className={`text-[10px] font-mono mb-1 ${
                  safety >= 70 ? "text-emerald-300" : safety >= 45 ? "text-amber-300" : "text-rose-400"
                }`}
              >
                {safety >= 70 ? "ready" : safety >= 45 ? "review" : "block"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value, tone, pulse }: { label: string; value: number; tone: string; pulse?: boolean }) {
  return (
    <div className="bg-background/40 px-3 py-3 relative">
      {pulse && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-400 pulse-glow" />
      )}
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <motion.div
        key={value}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}
      >
        {value}
      </motion.div>
    </div>
  );
}
