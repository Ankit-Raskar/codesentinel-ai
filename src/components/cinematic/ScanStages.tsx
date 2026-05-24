import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SCAN_STAGES } from "@/lib/demoData";

type Stage = { label: string; detail: string; ms: number };

export function ScanStages({ stages }: { stages?: Stage[] } = {}) {
  const data: Stage[] = stages ?? SCAN_STAGES;
  const [idx, setIdx] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    setIdx(0);
    const tick = () => {
      if (cancelled) return;
      setIdx(i);
      const stage = data[i];
      const delay = stage.ms || 1500;
      setTimeout(() => {
        if (cancelled) return;
        i = (i + 1) % data.length;
        tick();
      }, delay);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [data]);

  useEffect(() => {
    const t = setInterval(() => setTokenCount((n) => n + Math.floor(Math.random() * 13) + 3), 220);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 scan-beam opacity-40 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
              AI scan · in progress
            </span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            tokens streamed · <span className="text-primary">{tokenCount.toLocaleString()}</span>
          </div>
        </div>

        <ol className="space-y-2">
          {data.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "active" : "pending";
            return (
              <li
                key={s.label}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-all ${
                  state === "active"
                    ? "border-primary/40 bg-primary/5 glow-border"
                    : state === "done"
                    ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                    : "border-border/40 opacity-50"
                }`}
              >
                <div className="mt-0.5 w-4 h-4 shrink-0">
                  {state === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {state === "active" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                  {state === "pending" && (
                    <div className="w-3 h-3 mt-0.5 rounded-full border border-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {s.label}
                    {state === "active" && (
                      <span className="text-primary font-mono text-[10px]">…</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground truncate">
                    {s.detail}
                  </div>
                </div>
                <AnimatePresence>
                  {state === "active" && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-mono text-primary"
                    >
                      running
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
