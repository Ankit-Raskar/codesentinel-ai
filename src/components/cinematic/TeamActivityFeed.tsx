import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitMerge, ShieldAlert, CheckCircle2, GitCommit, Zap, Shield, Sparkles,
} from "lucide-react";
import { nextTeamEvent, type TeamEvent } from "@/lib/demoData";

const ICONS = {
  merge: GitMerge,
  vuln: ShieldAlert,
  ok: CheckCircle2,
  push: GitCommit,
  perf: Zap,
  shield: Shield,
  ai: Sparkles,
} as const;

const TONE: Record<TeamEvent["kind"], string> = {
  merge: "text-primary",
  vuln: "text-rose-300",
  ok: "text-emerald-300",
  push: "text-muted-foreground",
  perf: "text-amber-300",
  shield: "text-sky-300",
  ai: "text-suggestion",
};

export function TeamActivityFeed({ resetKey = 0 }: { resetKey?: number }) {
  const [events, setEvents] = useState<(TeamEvent & { id: string; t: string })[]>([]);

  useEffect(() => {
    setEvents([]);
    let n = 0;
    const seedBase = Date.now() ^ (resetKey * 9301);
    const tick = () => {
      n++;
      const ev = nextTeamEvent(seedBase + n * 1013);
      setEvents((prev) =>
        [{ ...ev, id: `${seedBase}-${n}`, t: relTime(n) }, ...prev].slice(0, 8),
      );
    };
    tick();
    const id = setInterval(tick, 1800 + Math.random() * 1400);
    return () => clearInterval(id);
  }, [resetKey]);

  return (
    <div className="glass-strong rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 scan-beam opacity-25 pointer-events-none" />
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
            team · live activity
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{events.length} events</span>
      </div>

      <div className="relative space-y-1.5 min-h-[210px]">
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const Icon = ICONS[e.kind];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="flex items-start gap-2 px-2 py-1.5 rounded-md border border-border/40 bg-surface-2/40"
              >
                <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TONE[e.kind]}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] leading-snug truncate">{e.text}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{e.t}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function relTime(n: number) {
  if (n === 1) return "just now";
  if (n < 4) return `${n}s ago`;
  return `${n * 6}s ago`;
}
