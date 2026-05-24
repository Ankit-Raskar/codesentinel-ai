import { motion } from "framer-motion";

// Deterministic pseudo-random so SSR/CSR match
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return Math.abs(x - Math.floor(x));
}

export function ActivityHeatmap() {
  const days = 7;
  const weeks = 16;
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Review activity</h3>
          <div className="text-xs text-muted-foreground">last 16 weeks · UTC</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          less
          {[0.1, 0.3, 0.55, 0.8, 1].map((v) => (
            <span
              key={v}
              className="w-3 h-3 rounded-sm"
              style={{ background: `oklch(0.72 0.18 235 / ${v})` }}
            />
          ))}
          more
        </div>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${weeks}, minmax(10px, 1fr))` }}
        >
          {Array.from({ length: weeks * days }).map((_, i) => {
            const v = seeded(i);
            const intensity = v < 0.3 ? 0.08 : v < 0.55 ? 0.28 : v < 0.78 ? 0.5 : v < 0.92 ? 0.75 : 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 24) * 0.008, duration: 0.25 }}
                className="aspect-square rounded-sm"
                style={{ background: `oklch(0.72 0.18 235 / ${intensity})` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TrendSparkline({
  values,
  label,
  color = "oklch(0.72 0.18 235)",
  suffix = "",
}: {
  values: number[];
  label: string;
  color?: string;
  suffix?: string;
}) {
  const w = 280;
  const h = 70;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const last = values[values.length - 1];
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-sm" style={{ color }}>
          {last}
          {suffix}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
        <defs>
          <linearGradient id={`g-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.polygon
          fill={`url(#g-${label})`}
          points={area}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={pts}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
    </div>
  );
}
