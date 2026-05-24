import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, ShieldAlert, Wrench, GitMerge, Lightbulb } from "lucide-react";
import type { DemoPR, DemoIssue } from "@/lib/demoData";

type Msg = { id: string; role: "user" | "assistant"; content: string };

const QUICK = [
  { icon: ShieldAlert, label: "Explain top issue" },
  { icon: Wrench, label: "How do I fix it?" },
  { icon: GitMerge, label: "Should I merge?" },
  { icon: Lightbulb, label: "Suggest tests" },
];

function scriptedAnswer(pr: DemoPR, q: string): string {
  const top = pr.issues[0];
  const crit = pr.issues.filter((i) => i.severity === "critical").length;
  const high = pr.issues.filter((i) => i.severity === "high").length;
  const l = q.toLowerCase();
  if (!top) {
    return `No blocking issues on **#${pr.number}**. Merge safety is **${pr.mergeSafety}%** with AI confidence at ${pr.aiConfidence}%. Safe to merge.`;
  }
  if (l.includes("merge") || l.includes("ship")) {
    return `Merge safety is **${pr.mergeSafety}%**. I'd hold until the ${crit} critical and ${high} high findings are resolved — especially _${top.title}_ in \`${top.file}\`.`;
  }
  if (l.includes("test")) {
    return `Three tests would have caught these:\n\n1. Negative-path test for _${top.title}_ in \`${top.file}\`\n2. Auth / boundary test on the new endpoint\n3. Regression test asserting the fix snippet behavior`;
  }
  if (l.includes("fix") || l.includes("patch")) {
    return `For _${top.title}_ (\`${top.file}:${top.line}\`), apply:\n\n\`\`\`ts\n${top.fix}\n\`\`\`\n\nConfidence **${top.confidence}%**.`;
  }
  return `The most critical finding is **${top.title}** (${top.severity}) in \`${top.file}:${top.line}\`.\n\n${top.explanation}\n\nSuggested fix:\n\n\`\`\`ts\n${top.fix}\n\`\`\``;
}

export function DemoAIChat({
  open,
  onClose,
  pr,
  focusIssue,
}: {
  open: boolean;
  onClose: () => void;
  pr: DemoPR;
  focusIssue: DemoIssue | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "intro",
          role: "assistant",
          content: `I've finished reviewing **#${pr.number} ${pr.title}**.\n\nFound **${pr.issues.length}** findings across security, performance, and quality. Ask me anything — or pick a prompt below.`,
        },
      ]);
    }
  }, [open, pr.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [messages, typing]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const answer = scriptedAnswer(pr, focusIssue ? `${text} ${focusIssue.title}` : text);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: answer }]);
      setTyping(false);
    }, 900);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-40 bg-background border-l border-border flex flex-col shadow-2xl"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">AI Assistant</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  reviewing #{pr.number}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-surface-2 text-muted-foreground"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 text-foreground border border-border/60"
                  }`}
                >
                  {m.content.split(/(\*\*[^*]+\*\*|`[^`]+`|```[\s\S]+?```)/g).map((part, i) => {
                    if (part.startsWith("```"))
                      return (
                        <pre
                          key={i}
                          className="mt-2 mb-1 p-2 rounded-md bg-background/60 border border-border/60 text-[11.5px] font-mono overflow-x-auto"
                        >
                          <code>{part.replace(/```[a-z]*\n?|```/g, "")}</code>
                        </pre>
                      );
                    if (part.startsWith("**") && part.endsWith("**"))
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    if (part.startsWith("`") && part.endsWith("`"))
                      return (
                        <code
                          key={i}
                          className="px-1 py-0.5 rounded bg-background/60 font-mono text-[12px]"
                        >
                          {part.slice(1, -1)}
                        </code>
                      );
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-surface-2 border border-border/60 rounded-2xl px-3.5 py-2.5 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-2 pb-3 border-t border-border space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.label)}
                  className="text-[11px] px-2 py-1 rounded-md border border-border/60 hover:bg-surface-2 text-muted-foreground flex items-center gap-1"
                >
                  <q.icon className="w-3 h-3" /> {q.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this pull request…"
                className="flex-1 px-3 py-2 rounded-md bg-surface-2 border border-border/60 text-sm outline-none focus:border-primary/40"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
