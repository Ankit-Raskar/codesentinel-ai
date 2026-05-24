import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

const LINES = [
  "▸ initializing codesentinel kernel…",
  "▸ mounting groq inference channel · llama-3.3-70b",
  "▸ syncing repository graph · 14 sources",
  "▸ calibrating scan engine · OWASP·CVE·perf",
  "▸ warming embedding cache · 38k symbols",
  "▸ handshake · review.stream OK",
  "▸ system ready",
];

const STORAGE_KEY = "cs_boot_seen_v2";

export function BootSequence() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setVisible(true);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timeouts.push(setTimeout(() => setStep(i + 1), 220 + i * 180));
    });
    timeouts.push(setTimeout(() => setVisible(false), 220 + LINES.length * 180 + 480));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background"
        >
          <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(50% 40% at 50% 50%, color-mix(in oklab, var(--glow) 18%, transparent), transparent 70%)",
            }}
          />
          <div className="relative w-[min(520px,90vw)] px-6">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-7"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 grid place-items-center glow-border">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">CodeSentinel</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                  ai engineering ops · booting
                </div>
              </div>
            </motion.div>

            <div className="font-mono text-[11.5px] leading-relaxed text-muted-foreground/90 min-h-[164px]">
              {LINES.slice(0, step).map((l, i) => (
                <motion.div
                  key={l}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={i === step - 1 ? "text-primary" : ""}
                >
                  {l}
                </motion.div>
              ))}
            </div>

            <div className="mt-5 h-[2px] w-full rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40"
                initial={{ width: 0 }}
                animate={{ width: `${(step / LINES.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
