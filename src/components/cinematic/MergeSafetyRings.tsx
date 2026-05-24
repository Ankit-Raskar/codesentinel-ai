import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedCounter } from "./AnimatedCounter";

interface RingProps {
  value: number;
  label: string;
  sub?: string;
  color?: string;
  size?: number;
  delay?: number;
}

export function SafetyRing({
  value,
  label,
  sub,
  color = "oklch(0.72 0.18 235)",
  size = 160,
  delay = 0,
}: RingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{ background: color }}
        />
        <svg width={size} height={size} className="relative -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="oklch(1 0 0 / 0.08)"
            strokeWidth={stroke}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-3xl font-semibold tracking-tight font-mono">
              {inView ? <AnimatedCounter to={value} suffix="%" /> : "0%"}
            </div>
            {sub && (
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                {sub}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm font-medium tracking-tight">{label}</div>
    </div>
  );
}

export function MergeSafetyPanel() {
  return (
    <div className="glass-strong rounded-2xl p-8 sm:p-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-primary mb-2">
              Merge safety
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              vulnerable-auth-api#248
            </h3>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              feat/password-reset → main · 9 files · +312 / −47
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 pulse-glow" />
            <span className="text-rose-300">Hold — 2 critical</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 justify-items-center">
          <SafetyRing value={41} label="Merge safety" sub="weighted" color="oklch(0.7 0.22 22)" />
          <SafetyRing value={38} label="Security" sub="OWASP" color="oklch(0.74 0.2 35)" delay={0.15} />
          <SafetyRing value={78} label="Performance" sub="hot paths" color="oklch(0.82 0.17 75)" delay={0.3} />
          <SafetyRing value={94} label="AI confidence" sub="Llama 3.3" color="oklch(0.74 0.18 235)" delay={0.45} />
        </div>

        <div className="mt-8 grid sm:grid-cols-3 gap-3 text-xs">
          {[
            { k: "Deployment risk", v: "Low → High", c: "text-rose-300" },
            { k: "Blast radius", v: "auth subsystem", c: "text-amber-300" },
            { k: "Rollback cost", v: "~4 min", c: "text-emerald-300" },
          ].map((r) => (
            <div key={r.k} className="glass rounded-lg p-3 flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{r.k}</span>
              <span className={`font-mono ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
