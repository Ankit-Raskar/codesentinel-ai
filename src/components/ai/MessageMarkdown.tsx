import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";

function CodeBlock({ inline, className, children }: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className ?? "")?.[1];
  const text = String(children ?? "").replace(/\n$/, "");

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-surface-2 text-[0.85em] font-mono text-foreground/90 border border-border/60">
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 rounded-lg border border-border/60 bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-2/60 border-b border-border/60">
        <span className="font-mono">{lang ?? "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="inline-flex items-center gap-1 hover:text-foreground transition"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="m-0 p-3 text-xs leading-relaxed overflow-x-auto scrollbar-thin font-mono text-foreground/95">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function MessageMarkdownInner({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-3 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h3]:text-sm [&_h3]:font-medium [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground [&_strong]:font-semibold">
      <ReactMarkdown
        components={{
          code: CodeBlock as never,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const MessageMarkdown = memo(MessageMarkdownInner);
