import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, X, Send, Loader2, History, MessageSquarePlus,
  ShieldAlert, Zap, Lightbulb, Wrench, GitMerge, Cpu, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAssistant } from "@/stores/assistant";
import { listChatMessages } from "@/lib/chat.functions";
import { MessageMarkdown } from "./MessageMarkdown";

type Msg = { id: string; role: "user" | "assistant"; content: string; pending?: boolean };

const QUICK_PROMPTS = [
  { icon: ShieldAlert, label: "Explain top issue", prompt: "Walk me through the most critical finding in this review. Explain the failure mode in code, then ship a minimal fix as a diff." },
  { icon: Wrench, label: "Suggest a fix", prompt: "Pick the highest-confidence issue and produce a complete patch I could apply. Note the trade-off you accepted." },
  { icon: Zap, label: "Optimize performance", prompt: "Identify the most impactful performance regression in this PR (allocations, N+1, blocking IO, render thrash). Show before/after." },
  { icon: GitMerge, label: "Should I merge?", prompt: "Given the merge safety score, security findings, and changed surface area, give me a merge recommendation with the 2 most important caveats." },
  { icon: Lightbulb, label: "Suggest tests", prompt: "Propose the 3 tests this PR is missing that would have caught the issues you found. Include test names and a sketch of the assertions." },
  { icon: Cpu, label: "Review dependencies", prompt: "Any new or upgraded dependencies in this PR carry risk (supply chain, license, transitive vulns)? Be specific about which lines." },
];

const STAGES = [
  "Reading changed files…",
  "Cross-referencing review findings…",
  "Inspecting security implications…",
  "Reasoning about merge safety…",
  "Drafting recommendation…",
];

export function AIAssistantPanel() {
  const open = useAssistant((s) => s.open);
  const setOpen = useAssistant((s) => s.setOpen);
  const ctx = useAssistant((s) => s.context);
  const consumePending = useAssistant((s) => s.consumePending);

  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);

  // History from DB
  const historyKey = ["chat", ctx.reviewId ?? "general"] as const;
  const { data: serverMsgs } = useQuery({
    queryKey: historyKey,
    queryFn: () => listFn({ data: { reviewId: ctx.reviewId } }),
    enabled: open,
  });

  // Local in-flight stream buffer
  const [streaming, setStreaming] = useState<{ id: string; content: string } | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages: Msg[] = useMemo(() => {
    const base: Msg[] = (serverMsgs ?? []).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    if (pendingUser) base.push({ id: "tmp-user", role: "user", content: pendingUser });
    if (streaming) base.push({ id: streaming.id, role: "assistant", content: streaming.content, pending: true });
    return base;
  }, [serverMsgs, pendingUser, streaming]);

  // auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, streaming?.content]);

  // stage rotator while waiting for first token
  useEffect(() => {
    if (!streaming || streaming.content.length > 0) return;
    const t = setInterval(() => setStageIdx((i) => (i + 1) % STAGES.length), 900);
    return () => clearInterval(t);
  }, [streaming]);

  async function send(message: string) {
    setError(null);
    setPendingUser(message);
    setStreaming({ id: `s-${Date.now()}`, content: "" });
    setStageIdx(0);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Not signed in.");

      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          reviewId: ctx.reviewId ?? null,
          prId: ctx.prId ?? null,
          repoId: ctx.repoId ?? null,
        }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming((s) => (s ? { ...s, content: acc } : s));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError((e as Error).message);
      }
    } finally {
      setStreaming(null);
      setPendingUser(null);
      abortRef.current = null;
      // re-fetch persisted history (server saved both turns)
      qc.invalidateQueries({ queryKey: historyKey });
    }
  }

  // Consume queued prompt from store (quick action buttons)
  useEffect(() => {
    if (!open) return;
    const p = consumePending();
    if (p) void send(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = input.trim();
    if (!v || streaming) return;
    setInput("");
    void send(v);
  }

  // Conversation history grouped: this view shows simple "current thread" + general
  const subtitle = ctx.reviewId
    ? "Reviewing this PR"
    : ctx.prId
    ? "Open pull request"
    : ctx.repoName
    ? ctx.repoName
    : "General workspace";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[440px] md:w-[480px] bg-elevated border-l border-border/80 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.4)]"
          >
            {/* Header */}
            <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 grid place-items-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold tracking-tight">CodeSentinel</div>
                <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition ${showHistory ? "bg-surface-2 text-foreground" : ""}`}
                title="Conversation history"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {showHistory ? (
                <HistoryPane
                  messages={messages}
                  onJumpToCurrent={() => setShowHistory(false)}
                />
              ) : messages.length === 0 ? (
                <EmptyState
                  ctxSummary={subtitle}
                  onPick={(p) => send(p)}
                  disabled={!!streaming}
                />
              ) : (
                <div className="px-4 py-4 space-y-4">
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  {streaming && streaming.content.length === 0 && (
                    <StageIndicator stage={STAGES[stageIdx]} />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 bg-elevated">
              {error && (
                <div className="mx-3 mt-2 text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-md px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}
              {messages.length > 0 && !showHistory && (
                <QuickPromptStrip onPick={(p) => send(p)} disabled={!!streaming} />
              )}
              <form onSubmit={onSubmit} className="p-3 flex items-end gap-2">
                <div className="flex-1 rounded-lg border border-border/70 bg-surface focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                    rows={1}
                    placeholder={ctx.reviewId ? "Ask about this review…" : "Ask the assistant…"}
                    className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70 max-h-40"
                  />
                </div>
                {streaming ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="h-10 px-3 rounded-md bg-surface-2 border border-border/70 text-xs text-muted-foreground hover:text-foreground"
                    title="Stop"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="h-10 w-10 grid place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </form>
              <div className="px-3 pb-2 text-[10px] text-muted-foreground/70 flex items-center justify-between">
                <span>Groq · llama-3.3-70b</span>
                <span>↵ send · ⇧↵ newline</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-lg rounded-br-sm bg-primary/15 border border-primary/25 px-3 py-2 text-sm leading-relaxed text-foreground/95 whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5"
    >
      <div className="w-6 h-6 mt-0.5 shrink-0 rounded-md bg-primary/10 border border-primary/25 grid place-items-center">
        <Sparkles className="w-3 h-3 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <MessageMarkdown content={msg.content || "​"} />
        {msg.pending && (
          <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-primary animate-pulse rounded-[1px]" />
        )}
      </div>
    </motion.div>
  );
}

function StageIndicator({ stage }: { stage: string }) {
  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs text-muted-foreground pl-9"
    >
      <Loader2 className="w-3 h-3 animate-spin text-primary" />
      <span>{stage}</span>
    </motion.div>
  );
}

function EmptyState({
  ctxSummary,
  onPick,
  disabled,
}: {
  ctxSummary: string;
  onPick: (p: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="px-5 pt-8 pb-4">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">Your engineering copilot</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Context: <span className="text-foreground/80">{ctxSummary}</span>. Ask anything about the
        diff, security posture, or merge risk — I'll answer with code.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-1.5">
        {QUICK_PROMPTS.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.label}
              type="button"
              disabled={disabled}
              onClick={() => onPick(q.prompt)}
              className="group flex items-center gap-3 text-left px-3 py-2.5 rounded-md border border-border/60 bg-surface/60 hover:bg-surface hover:border-primary/40 transition disabled:opacity-50"
            >
              <Icon className="w-4 h-4 text-primary/80 group-hover:text-primary" />
              <span className="text-sm">{q.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">Run</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuickPromptStrip({ onPick, disabled }: { onPick: (p: string) => void; disabled: boolean }) {
  return (
    <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto scrollbar-thin">
      {QUICK_PROMPTS.slice(0, 4).map((q) => {
        const Icon = q.icon;
        return (
          <button
            key={q.label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(q.prompt)}
            className="shrink-0 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-surface/60 hover:bg-surface hover:border-primary/40 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <Icon className="w-3 h-3" />
            {q.label}
          </button>
        );
      })}
    </div>
  );
}

function HistoryPane({
  messages,
  onJumpToCurrent,
}: {
  messages: Msg[];
  onJumpToCurrent: () => void;
}) {
  // Group successive user → assistant pairs as "turns"
  const turns: { user: string; assistant?: string; id: string }[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === "user") {
      const next = messages[i + 1];
      turns.push({
        id: m.id,
        user: m.content,
        assistant: next?.role === "assistant" ? next.content : undefined,
      });
      if (next?.role === "assistant") i++;
    }
  }
  return (
    <div className="px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">This thread</span>
        <button
          type="button"
          onClick={onJumpToCurrent}
          className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
        >
          <MessageSquarePlus className="w-3 h-3" /> Back to chat
        </button>
      </div>
      {turns.length === 0 && (
        <div className="text-xs text-muted-foreground px-1 py-6 text-center">
          No conversation yet.
        </div>
      )}
      <ol className="space-y-1.5">
        {turns.map((t, i) => (
          <li
            key={t.id}
            className="px-3 py-2 rounded-md border border-border/60 bg-surface/60 text-xs"
          >
            <div className="text-muted-foreground text-[10px]">Turn {i + 1}</div>
            <div className="font-medium truncate">{t.user}</div>
            {t.assistant && (
              <div className="text-muted-foreground truncate mt-0.5">{t.assistant}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
