export function ScoreRing({ value, label, color = "var(--glow)" }: { value: number; label: string; color?: string }) {
  const pct = Math.max(0, Math.min(10, value)) / 10;
  const r = 36;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          <circle cx="48" cy="48" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" fill="none" />
          <circle
            cx="48" cy="48" r={r}
            stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 800ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-semibold">{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
