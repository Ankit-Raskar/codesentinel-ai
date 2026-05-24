import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ShieldAlert, Zap, Sparkles, Bug } from "lucide-react";

const stages = [
  {
    icon: ShieldAlert,
    tag: "Vulnerability detected",
    color: "text-rose-400",
    before: `const q = "SELECT * FROM users WHERE email='" + email + "'";\nconst r = await db.query(q);`,
    after: `const r = await db.query(\n  "SELECT * FROM users WHERE email = $1",\n  [email]\n);`,
    title: "SQL injection in auth.ts",
    note: "Critical · CWE-89 · confidence 99%",
  },
  {
    icon: Bug,
    tag: "Logic flaw",
    color: "text-amber-300",
    before: `if (user.role = 'admin') {\n  grantAccess();\n}`,
    after: `if (user.role === 'admin') {\n  grantAccess();\n}`,
    title: "Assignment used where comparison expected",
    note: "High · privilege escalation risk",
  },
  {
    icon: Zap,
    tag: "Performance",
    color: "text-sky-300",
    before: `for (const u of users) {\n  u.posts = await db.posts.where({ user_id: u.id });\n}`,
    after: `const ids = users.map(u => u.id);\nconst posts = await db.posts.whereIn('user_id', ids);`,
    title: "N+1 query collapsed (−180ms / req)",
    note: "Medium · hot path on /feed",
  },
  {
    icon: Sparkles,
    tag: "AI refactor",
    color: "text-primary",
    before: `function fmt(d) {\n  const x = new Date(d);\n  return x.getFullYear() + '-' + (x.getMonth()+1) + '-' + x.getDate();\n}`,
    after: `const fmt = (d: string) =>\n  new Date(d).toISOString().slice(0, 10);`,
    title: "Date formatter simplified · 1 dep removed",
    note: "Suggestion · safe rewrite",
  },
];

export function ScrollingAnalysis() {
  return (
    <div className="space-y-32">
      {stages.map((s, i) => (
        <ScrollScene key={i} stage={s} index={i} />
      ))}
    </div>
  );
}

function ScrollScene({ stage, index }: { stage: typeof stages[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const Icon = stage.icon;

  return (
    <div ref={ref} className="relative grid lg:grid-cols-[1fr_1.3fr] gap-8 items-center">
      <motion.div style={{ y, opacity }} className="space-y-4">
        <div className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] ${stage.color}`}>
          <Icon className="w-3.5 h-3.5" /> {stage.tag}
        </div>
        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">{stage.title}</h3>
        <div className="text-xs font-mono text-muted-foreground">{stage.note}</div>
        <div className="text-sm text-muted-foreground max-w-md">
          CodeSentinel inspects the diff, reasons about intent, and proposes a concrete patch — not a vague comment.
        </div>
      </motion.div>

      <motion.div style={{ opacity }} className="grid sm:grid-cols-2 gap-3">
        <CodeBlock label="before" tone="bad" code={stage.before} />
        <CodeBlock label="after" tone="good" code={stage.after} delay={0.15} />
      </motion.div>

      <div className="absolute -inset-x-8 -inset-y-12 -z-10 rounded-3xl bg-primary/[0.03] blur-3xl pointer-events-none" />
    </div>
  );
}

function CodeBlock({
  label,
  tone,
  code,
  delay = 0,
}: {
  label: string;
  tone: "bad" | "good";
  code: string;
  delay?: number;
}) {
  const ring =
    tone === "bad"
      ? "border-rose-500/30 shadow-[0_0_30px_-12px_rgba(244,63,94,0.45)]"
      : "border-emerald-500/30 shadow-[0_0_30px_-12px_rgba(16,185,129,0.45)]";
  return (
    <motion.pre
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={`glass rounded-xl p-4 text-[11.5px] font-mono leading-relaxed overflow-x-auto border ${ring}`}
    >
      <div className="flex items-center justify-between mb-2 text-[9px] uppercase tracking-[0.2em]">
        <span className={tone === "bad" ? "text-rose-300" : "text-emerald-300"}>{label}</span>
        <span className="text-muted-foreground">codesentinel</span>
      </div>
      <code className="text-foreground/90 whitespace-pre">{code}</code>
    </motion.pre>
  );
}
