import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Lightbulb, Zap, FileCode } from "lucide-react";
import type { DiffComment } from "./DiffViewer";

const SEV_ICON = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  suggestion: Lightbulb,
  optimization: Zap,
} as const;

const SEV_COLOR: Record<string, string> = {
  critical: "text-critical",
  warning: "text-warning",
  suggestion: "text-suggestion",
  optimization: "text-optimization",
};

export type DiffFileSummary = {
  filename: string;
  comments: DiffComment[];
  additions?: number;
  deletions?: number;
};

/**
 * Sticky severity sidebar for the diff view.
 * Lists files with severity dot, hot-jumps to file or issue, and shows
 * a tiny merge-safety chip for the whole PR.
 */
export function DiffSidebar({
  files,
  mergeSafety,
  aiConfidence,
}: {
  files: DiffFileSummary[];
  mergeSafety?: number;
  aiConfidence?: number;
}) {
  const totals = useMemo(() => {
    let critical = 0,
      warning = 0,
      suggestion = 0;
    for (const f of files)
      for (const c of f.comments) {
        if (c.severity === "critical") critical++;
        else if (c.severity === "warning") warning++;
        else suggestion++;
      }
    return { critical, warning, suggestion, total: critical + warning + suggestion };
  }, [files]);

  const [active, setActive] = useState<string | null>(files[0]?.filename ?? null);

  // Track which file section is in the viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = files
      .map((f) => document.getElementById(`file-${encodeURIComponent(f.filename)}`))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) {
          const name = decodeURIComponent(top.target.id.replace(/^file-/, ""));
          setActive(name);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [files]);

  const jump = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <aside className="hidden lg:block w-72 shrink-0 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-auto scrollbar-thin">
      <div className="glass rounded-xl p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-3">
          review map
        </div>

        {/* merge safety chip */}
        {typeof mergeSafety === "number" && (
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">merge safety</span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                mergeSafety >= 70 ? "text-emerald-300" : mergeSafety >= 45 ? "text-amber-300" : "text-rose-400"
              }`}
            >
              {mergeSafety}%
            </span>
          </div>
        )}
        {typeof aiConfidence === "number" && (
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">ai confidence</span>
            <span className="font-mono tabular-nums text-primary">{aiConfidence}%</span>
          </div>
        )}

        {/* severity totals */}
        <div className="grid grid-cols-3 gap-1 mb-4 text-[10px] font-mono">
          <div className="rounded-md bg-critical/10 px-2 py-1.5 text-center">
            <div className="text-critical font-semibold tabular-nums">{totals.critical}</div>
            <div className="text-muted-foreground uppercase tracking-wider">crit</div>
          </div>
          <div className="rounded-md bg-warning/10 px-2 py-1.5 text-center">
            <div className="text-warning font-semibold tabular-nums">{totals.warning}</div>
            <div className="text-muted-foreground uppercase tracking-wider">warn</div>
          </div>
          <div className="rounded-md bg-suggestion/10 px-2 py-1.5 text-center">
            <div className="text-suggestion font-semibold tabular-nums">{totals.suggestion}</div>
            <div className="text-muted-foreground uppercase tracking-wider">hint</div>
          </div>
        </div>

        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground mb-2">
          files · {files.length}
        </div>

        <ul className="space-y-0.5">
          {files.map((f) => {
            const sev = f.comments.some((c) => c.severity === "critical")
              ? "critical"
              : f.comments.some((c) => c.severity === "warning")
                ? "warning"
                : f.comments.length
                  ? "suggestion"
                  : null;
            const Icon = sev ? SEV_ICON[sev as keyof typeof SEV_ICON] : null;
            const isActive = active === f.filename;
            return (
              <li key={f.filename}>
                <button
                  onClick={() => jump(`file-${encodeURIComponent(f.filename)}`)}
                  className={`w-full group text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-[11.5px] font-mono transition relative ${
                    isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="diff-active"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-primary rounded-full"
                    />
                  )}
                  <FileCode className="w-3 h-3 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{f.filename.split("/").pop()}</span>
                  {Icon && <Icon className={`w-3 h-3 ${SEV_COLOR[sev as string]}`} />}
                  {f.comments.length > 0 && (
                    <span className="text-[9px] tabular-nums text-muted-foreground">
                      {f.comments.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {totals.total === 0 && (
          <div className="mt-4 text-[11px] text-emerald-300 font-mono">
            ✓ no findings · ship it
          </div>
        )}
      </div>
    </aside>
  );
}
