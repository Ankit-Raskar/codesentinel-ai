import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequest, FileCode, Bug, ShieldAlert, Zap, Gauge, Lightbulb, CheckCircle2, Loader2,
} from "lucide-react";

const STAGES = [
  { id: "fetch",   label: "Fetching pull request diff from GitHub", icon: GitPullRequest, dur: 1200 },
  { id: "parse",   label: "Parsing changed files & hunk headers",   icon: FileCode,       dur: 1500 },
  { id: "bugs",    label: "Detecting logic bugs & null references", icon: Bug,            dur: 2200 },
  { id: "sec",     label: "Scanning for security vulnerabilities",  icon: ShieldAlert,    dur: 2400 },
  { id: "perf",    label: "Analyzing performance hot paths",        icon: Zap,            dur: 2000 },
  { id: "merge",   label: "Computing merge-safety score",           icon: Gauge,          dur: 1400 },
  { id: "fix",     label: "Generating suggested fixes",             icon: Lightbulb,      dur: 1800 },
];

export function StreamingReviewProgress() {
  const [active, setActive] = useState(0);
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    let i = 0;
    const advance = () => {
      i = Math.min(i + 1, STAGES.length - 1);
      setActive(i);
      if (i < STAGES.length - 1) setTimeout(advance, STAGES[i].dur);
    };
    const t = setTimeout(advance, STAGES[0].dur);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTokens((n) => n + Math.floor(8 + Math.random() * 24)), 120);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-strong rounded-xl p-6 relative overflow-hidden">
      <div className="scan-line" />
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 grid place-items-center glow-border">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
          <div>
            <div className="font-semibold text-sm">CodeSentinel is reviewing</div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Llama 3.3 70B · Groq · streaming
            </div>
          </div>
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">
          <span className="text-primary tabular-nums">{tokens.toLocaleString()}</span> tokens analyzed
        </div>
      </div>

      <ol className="relative space-y-2">
        {STAGES.map((s, idx) => {
          const state = idx < active ? "done" : idx === active ? "active" : "pending";
          const Icon = state === "done" ? CheckCircle2 : s.icon;
          return (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: state === "pending" ? 0.4 : 1, x: 0 }}
              className="flex items-center gap-3 text-sm"
            >
              <span
                className={`w-7 h-7 rounded-md grid place-items-center shrink-0 ${
                  state === "done" ? "bg-emerald-500/15 text-emerald-400" :
                  state === "active" ? "bg-primary/15 text-primary glow-border" :
                  "bg-surface text-muted-foreground"
                }`}
              >
                {state === "active"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />}
              </span>
              <span className={state === "active" ? "text-foreground" : state === "done" ? "text-muted-foreground line-through decoration-emerald-500/40" : "text-muted-foreground"}>
                {s.label}
              </span>
              <AnimatePresence>
                {state === "active" && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="ml-auto font-mono text-[10px] text-primary uppercase tracking-wider"
                  >
                    running
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
