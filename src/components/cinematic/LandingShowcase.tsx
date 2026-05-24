import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Lightbulb, Zap, GitMerge, Bug, Lock, Activity } from "lucide-react";

const LOG_ITEMS = [
  { repo: "acme/payments-api",  sev: "critical", icon: ShieldAlert,   color: "text-critical",     msg: "SQL injection in /charges handler" },
  { repo: "vercept/dash",       sev: "warning",  icon: AlertTriangle, color: "text-warning",      msg: "N+1 query in invoices loader" },
  { repo: "kiln/runtime",       sev: "ok",       icon: GitMerge,      color: "text-emerald-400",  msg: "Merge-safety 96 — auto-approved" },
  { repo: "lattice/web",        sev: "suggest",  icon: Lightbulb,     color: "text-suggestion",   msg: "Extract <PricingTable/> for re-use" },
  { repo: "northstar/core",     sev: "critical", icon: Lock,          color: "text-critical",     msg: "Hardcoded JWT secret in auth.ts" },
  { repo: "mercury/billing",    sev: "perf",     icon: Zap,           color: "text-optimization", msg: "useMemo missing in OrdersTable" },
  { repo: "bloom/api",          sev: "warning",  icon: Bug,           color: "text-warning",      msg: "Possible null deref in resolver" },
  { repo: "acme/payments-api",  sev: "ok",       icon: Activity,      color: "text-emerald-400",  msg: "37 files scanned in 4.1s" },
];

function LogRow({ item }: { item: (typeof LOG_ITEMS)[number] }) {
  const Icon = item.icon;
  return (
    <div className="glass rounded-md px-3 py-2 flex items-center gap-2.5 text-xs min-w-[320px]">
      <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
      <span className="font-mono text-muted-foreground">{item.repo}</span>
      <span className="text-foreground/90 truncate">{item.msg}</span>
    </div>
  );
}

export function MarqueeReviewLog() {
  const doubled = [...LOG_ITEMS, ...LOG_ITEMS];
  return (
    <div className="relative marquee-mask overflow-hidden py-4">
      <div className="marquee-track flex gap-3 w-max">
        {doubled.map((it, i) => <LogRow key={i} item={it} />)}
      </div>
    </div>
  );
}

const TERMINAL_LINES = [
  { p: "$", c: "codesentinel review --pr 1284", color: "text-foreground" },
  { p: ">", c: "fetching diff for acme/payments-api#1284…", color: "text-muted-foreground" },
  { p: ">", c: "23 files changed · +812 −419", color: "text-muted-foreground" },
  { p: ">", c: "[llama-3.3-70b] streaming via groq…", color: "text-primary" },
  { p: "!", c: "critical: SQL injection · src/api/charges.ts:88", color: "text-critical" },
  { p: "!", c: "warning:  N+1 query · src/db/invoices.ts:42", color: "text-warning" },
  { p: "·", c: "suggest:  extract <PricingTable/> · src/ui/Pricing.tsx", color: "text-suggestion" },
  { p: ">", c: "quality 8.4 · security 6.1 · perf 7.8 · merge-safety 72", color: "text-foreground" },
  { p: "✓", c: "posted review with 11 inline comments → github.com/acme/payments-api/pull/1284", color: "text-emerald-400" },
];

export function AnimatedTerminal() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= TERMINAL_LINES.length) {
      const reset = setTimeout(() => setShown(0), 5000);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 650);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="glass-strong rounded-xl overflow-hidden font-mono text-[12px] leading-relaxed">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-surface">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
        <span className="ml-3 text-[10px] text-muted-foreground uppercase tracking-wider">~/acme · codesentinel</span>
      </div>
      <div className="p-4 space-y-1 min-h-[260px] relative">
        <div className="scan-line opacity-40" />
        {TERMINAL_LINES.slice(0, shown).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="text-primary/70 select-none w-3 shrink-0">{l.p}</span>
            <span className={l.color}>{l.c}</span>
            {i === shown - 1 && <span className="terminal-caret h-[1em] self-end" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const TICKERS = [
  { label: "Merge safety", value: 94, suffix: "%",   tone: "text-emerald-400" },
  { label: "Critical bugs blocked / 24h", value: 412, suffix: "",     tone: "text-critical" },
  { label: "Avg first-token",            value: 0.8, suffix: "s",    tone: "text-primary", decimals: 1 },
  { label: "Reviews in flight",          value: 137, suffix: "",     tone: "text-warning" },
];

export function LiveTickerStrip() {
  const [vals, setVals] = useState(() => TICKERS.map((t) => t.value));
  useEffect(() => {
    const t = setInterval(() => {
      setVals((vs) =>
        vs.map((v, i) => {
          const base = TICKERS[i].value;
          const wiggle = i === 2 ? (Math.random() - 0.5) * 0.4 : Math.round((Math.random() - 0.5) * Math.max(6, base * 0.04));
          const next = Math.max(0, +(base + wiggle).toFixed(TICKERS[i].decimals ?? 0));
          return next;
        }),
      );
    }, 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TICKERS.map((t, i) => (
        <div key={t.label} className="glass rounded-lg p-4 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t.label}</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${t.tone}`}>
            {typeof vals[i] === "number" && (TICKERS[i].decimals ? vals[i].toFixed(TICKERS[i].decimals) : vals[i].toLocaleString())}
            <span className="text-base text-muted-foreground">{t.suffix}</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-surface overflow-hidden">
            <motion.div
              key={vals[i]}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (vals[i] / (t.value * 2)) * 100)}%` }}
              transition={{ duration: 1.2 }}
              className="h-full bg-gradient-to-r from-primary/60 to-primary"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
