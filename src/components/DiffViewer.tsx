import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, ShieldAlert, AlertTriangle, Lightbulb, Zap, FileCode,
} from "lucide-react";

type Line = { type: "add" | "del" | "ctx" | "hunk"; text: string; ln?: number };

export type DiffComment = {
  id: string;
  severity: string;
  title: string;
  explanation?: string | null;
  suggested_fix?: string | null;
  line_number?: number | null;
};

const SEV_META: Record<string, { icon: typeof ShieldAlert; color: string; bg: string; ring: string }> = {
  critical:     { icon: ShieldAlert,    color: "text-critical",     bg: "bg-critical/10",     ring: "ring-critical/40" },
  warning:      { icon: AlertTriangle,  color: "text-warning",      bg: "bg-warning/10",      ring: "ring-warning/40" },
  suggestion:   { icon: Lightbulb,      color: "text-suggestion",   bg: "bg-suggestion/10",   ring: "ring-suggestion/40" },
  optimization: { icon: Zap,            color: "text-optimization", bg: "bg-optimization/10", ring: "ring-optimization/40" },
};

function parsePatch(patch: string): Line[] {
  const out: Line[] = [];
  let ln = 0;
  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const m = raw.match(/\+(\d+)/);
      ln = m ? parseInt(m[1], 10) : ln;
      out.push({ type: "hunk", text: raw });
    } else if (raw.startsWith("+") && !raw.startsWith("+++")) {
      out.push({ type: "add", text: raw.slice(1), ln });
      ln++;
    } else if (raw.startsWith("-") && !raw.startsWith("---")) {
      out.push({ type: "del", text: raw.slice(1) });
    } else {
      out.push({ type: "ctx", text: raw.replace(/^ /, ""), ln });
      ln++;
    }
  }
  return out;
}

// lightweight inline syntax highlighting (keywords, strings, comments, numbers)
const KW = /\b(import|from|export|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|extends|new|this|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|true|false|undefined|public|private|protected|static|interface|type|enum|implements|as|void|yield)\b/g;
function colorize(text: string): React.ReactNode[] {
  if (!text) return [text];
  // protect strings & comments first by splitting tokens
  const parts: React.ReactNode[] = [];
  const regex = /(\/\/.*$)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(...highlightKeywords(text.slice(last, m.index), key++));
    }
    if (m[1]) parts.push(<span key={`c${key++}`} className="text-muted-foreground/70 italic">{m[1]}</span>);
    else if (m[2]) parts.push(<span key={`s${key++}`} className="text-emerald-300/90">{m[2]}</span>);
    else if (m[3]) parts.push(<span key={`n${key++}`} className="text-amber-300/90">{m[3]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(...highlightKeywords(text.slice(last), key++));
  return parts;
}
function highlightKeywords(text: string, baseKey: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(KW.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={`k${baseKey}-${i++}`} className="text-primary/90">{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function DiffViewer({
  filename,
  patch,
  comments = [],
  defaultOpen = true,
}: {
  filename: string;
  patch?: string;
  comments?: DiffComment[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const lines = useMemo(() => (patch ? parsePatch(patch) : []), [patch]);
  const stats = useMemo(() => {
    let add = 0, del = 0;
    for (const l of lines) { if (l.type === "add") add++; else if (l.type === "del") del++; }
    return { add, del };
  }, [lines]);

  const commentsByLine = useMemo(() => {
    const map = new Map<number, DiffComment[]>();
    for (const c of comments) {
      if (!c.line_number) continue;
      const arr = map.get(c.line_number) ?? [];
      arr.push(c);
      map.set(c.line_number, arr);
    }
    return map;
  }, [comments]);

  return (
    <div className="glass rounded-lg overflow-hidden" id={`file-${encodeURIComponent(filename)}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 border-b border-border bg-surface flex items-center gap-2 text-xs font-mono hover:bg-surface-2 transition"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        <FileCode className="w-3.5 h-3.5 text-primary" />
        <span className="text-foreground truncate">{filename}</span>
        <span className="ml-auto flex items-center gap-2 text-[11px]">
          {comments.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-warning/15 text-warning">
              {comments.length} {comments.length === 1 ? "issue" : "issues"}
            </span>
          )}
          <span className="text-emerald-400">+{stats.add}</span>
          <span className="text-rose-400">-{stats.del}</span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {!patch ? (
              <div className="p-4 text-sm text-muted-foreground">No textual diff available.</div>
            ) : (
              <div className="text-xs font-mono overflow-x-auto scrollbar-thin">
                {lines.map((l, i) => {
                  const bg =
                    l.type === "add" ? "bg-emerald-500/10" :
                    l.type === "del" ? "bg-rose-500/10" :
                    l.type === "hunk" ? "bg-primary/5 text-primary" : "";
                  const prefix = l.type === "add" ? "+" : l.type === "del" ? "-" : l.type === "hunk" ? "" : " ";
                  const lineComments = l.ln ? commentsByLine.get(l.ln) : undefined;
                  return (
                    <div key={i}>
                      <div className={`px-3 py-[1px] ${bg} whitespace-pre flex`}>
                        <span className="inline-block w-10 text-right pr-2 text-muted-foreground/60 select-none shrink-0">
                          {l.ln ?? ""}
                        </span>
                        <span className="text-muted-foreground/70 select-none w-3 shrink-0">{prefix}</span>
                        <span className="flex-1">
                          {l.type === "hunk" ? l.text : colorize(l.text)}
                        </span>
                      </div>
                      {lineComments?.map(c => {
                        const meta = SEV_META[c.severity] ?? SEV_META.suggestion;
                        const Icon = meta.icon;
                        return (
                          <div
                            key={c.id}
                            className={`mx-3 my-2 rounded-md p-3 ring-1 ${meta.bg} ${meta.ring} font-sans not-italic`}
                          >
                            <div className="flex items-start gap-2">
                              <Icon className={`w-4 h-4 mt-0.5 ${meta.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${meta.color}`}>{c.severity}</span>
                                  <span className="text-sm font-medium">{c.title}</span>
                                </div>
                                {c.explanation && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.explanation}</p>
                                )}
                                {c.suggested_fix && (
                                  <pre className="mt-2 text-[11px] bg-surface/80 rounded p-2 overflow-x-auto whitespace-pre-wrap">{c.suggested_fix}</pre>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
