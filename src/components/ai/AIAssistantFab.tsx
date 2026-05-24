import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistant } from "@/stores/assistant";

export function AIAssistantFab() {
  const open = useAssistant((s) => s.open);
  const setOpen = useAssistant((s) => s.setOpen);

  return (
    <AnimatePresence>
      {!open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          whileHover={{ y: -2 }}
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-elevated border border-primary/40 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] hover:border-primary/70 transition"
          aria-label="Open AI assistant"
        >
          <span className="relative grid place-items-center w-6 h-6 rounded-md bg-primary/15">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="absolute inset-0 rounded-md ring-1 ring-primary/40 animate-pulse" />
          </span>
          <span className="text-sm font-medium tracking-tight">Ask CodeSentinel</span>
          <kbd className="hidden sm:inline ml-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border/60 bg-surface">
            ⌘K
          </kbd>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
