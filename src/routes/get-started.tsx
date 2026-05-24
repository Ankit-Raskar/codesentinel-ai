import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Rocket, Server, MonitorSmartphone, Lock, Gauge,
  ArrowRight, ArrowLeft, CheckCircle2, GitBranch, Network, ShieldAlert,
  Sparkles, Workflow, Cpu,
} from "lucide-react";

export const Route = createFileRoute("/get-started")({
  component: GetStartedPage,
  head: () => ({
    meta: [
      { title: "Get started — CodeSentinel" },
      { name: "description", content: "A short, cinematic onboarding into your CodeSentinel review environment." },
    ],
  }),
});

type RepoKind = {
  id: string;
  title: string;
  desc: string;
  icon: typeof Shield;
  examples: string;
};

const REPO_KINDS: RepoKind[] = [
  {
    id: "saas",
    title: "Startup SaaS",
    desc: "Tight feedback loops, ship-daily codebases, mixed FE/BE.",
    icon: Rocket,
    examples: "TypeScript · Next.js · Postgres",
  },
  {
    id: "enterprise",
    title: "Enterprise backend",
    desc: "Heavy services, strict review gates, long-lived modules.",
    icon: Server,
    examples: "Java · Go · Kafka · gRPC",
  },
  {
    id: "frontend",
    title: "React frontend",
    desc: "Design-system heavy, render-budget sensitive, lots of hooks.",
    icon: MonitorSmartphone,
    examples: "React · Vite · Tailwind",
  },
  {
    id: "security",
    title: "Security-critical API",
    desc: "Auth, payments, anything that touches user data or money.",
    icon: Lock,
    examples: "OAuth · KMS · audit logs",
  },
  {
    id: "performance",
    title: "Performance-heavy service",
    desc: "Hot paths, latency budgets, fan-out and backpressure.",
    icon: Gauge,
    examples: "Rust · Node · Redis · queues",
  },
];

const BOOT_STEPS = [
  { label: "Preparing review environment", detail: "spawning sandbox · loading model weights", icon: Cpu, ms: 1100 },
  { label: "Parsing pull request", detail: "tree-sitter · 9 languages · AST diff", icon: GitBranch, ms: 1300 },
  { label: "Loading dependency graph", detail: "resolving 248 packages · CVE feed sync", icon: Network, ms: 1500 },
  { label: "Analyzing architecture", detail: "module boundaries · coupling · entry points", icon: Workflow, ms: 1400 },
  { label: "Generating vulnerability graph", detail: "OWASP top 10 · secret scan · ssrf paths", icon: ShieldAlert, ms: 1700 },
  { label: "Calibrating AI reviewer", detail: "Llama 3.3 70B · tuned to your repo profile", icon: Sparkles, ms: 1100 },
];

function GetStartedPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [bootIdx, setBootIdx] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  const bootRef = useRef<number[]>([]);

  // Skip onboarding for return visitors who've already completed it
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cs_onboarded") === "1") {
      // they've seen it — drop them straight into the dashboard
      nav({ to: "/dashboard" });
    }
  }, [nav]);

  const start = (id: string) => {
    setPicked(id);
    setStep(2);
  };

  // Drive the boot sequence when entering step 2
  useEffect(() => {
    if (step !== 2) return;
    setBootIdx(0);
    setBootDone(false);
    bootRef.current.forEach(clearTimeout);
    bootRef.current = [];
    let acc = 400;
    BOOT_STEPS.forEach((s, i) => {
      acc += s.ms;
      const t = window.setTimeout(() => setBootIdx(i + 1), acc);
      bootRef.current.push(t);
    });
    const done = window.setTimeout(() => {
      setBootDone(true);
      setStep(3);
    }, acc + 500);
    bootRef.current.push(done);
    return () => bootRef.current.forEach(clearTimeout);
  }, [step]);

  // After step 3 lands, hand off into the dashboard
  useEffect(() => {
    if (step !== 3) return;
    try { localStorage.setItem("cs_onboarded", "1"); } catch {}
    const t = window.setTimeout(() => nav({ to: "/dashboard" }), 1900);
    return () => clearTimeout(t);
  }, [step, nav]);

  const pickedKind = useMemo(() => REPO_KINDS.find((k) => k.id === picked), [picked]);

  return (
    <div className="min-h-screen stage-curtain relative overflow-hidden">
      {/* nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber/15 grid place-items-center">
            <Shield className="w-3.5 h-3.5 text-amber" />
          </div>
          <span className="font-semibold text-sm tracking-tight">CodeSentinel</span>
        </div>
        <Link
          to="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Skip onboarding
        </Link>
      </header>

      {/* progress dots */}
      <div className="relative z-10 flex justify-center gap-2 mt-4">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1 rounded-full transition-all duration-500 ${
              n === step
                ? "w-10 bg-amber"
                : n < step
                ? "w-6 bg-amber/40"
                : "w-6 bg-border"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section
            key="step1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.45 }}
            className="relative z-10 max-w-5xl mx-auto px-6 pt-14 pb-24"
          >
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber font-mono">
                step 01 · pick a profile
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
                What kind of repo are we reviewing?
              </h1>
              <p className="mt-3 text-muted-foreground text-sm sm:text-base">
                We'll tune the AI reviewer to your codebase's risk profile — auth and payments
                code gets a stricter pass than a marketing site.
              </p>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPO_KINDS.map((k, i) => (
                <motion.button
                  key={k.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => start(k.id)}
                  className="group text-left glass-strong rounded-xl p-6 magnetic-hover hover:border-amber/30 transition"
                >
                  <div className="w-9 h-9 rounded-md bg-amber/12 grid place-items-center">
                    <k.icon className="w-4 h-4 text-amber" />
                  </div>
                  <h3 className="mt-4 font-semibold tracking-tight">{k.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{k.desc}</p>
                  <div className="mt-4 text-[11px] font-mono text-muted-foreground">{k.examples}</div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-amber opacity-0 group-hover:opacity-100 transition">
                    Continue <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-3xl mx-auto px-6 pt-14 pb-24"
          >
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber font-mono">
                step 02 · initializing
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
                Setting up your{" "}
                <span className="text-amber">{pickedKind?.title.toLowerCase()}</span> environment
              </h2>
              <p className="mt-3 text-muted-foreground text-sm">
                This usually takes about ten seconds — feel free to watch.
              </p>
            </div>

            <div className="mt-12 glass-strong rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="scan-line opacity-60" />
              <ul className="relative space-y-3">
                {BOOT_STEPS.map((s, i) => {
                  const active = i === bootIdx;
                  const done = i < bootIdx;
                  return (
                    <li
                      key={s.label}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-400 ${
                        active
                          ? "border-amber/30 bg-amber/[0.04]"
                          : done
                          ? "border-border/60 bg-surface/40"
                          : "border-transparent opacity-50"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md grid place-items-center shrink-0 transition ${
                          active
                            ? "bg-amber/15 text-amber"
                            : done
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-surface-2 text-muted-foreground"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {s.label}
                          {active && (
                            <span className="text-[10px] font-mono text-amber ai-cursor" />
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">
                          {s.detail}
                        </div>
                      </div>
                      {active && (
                        <span className="text-[10px] font-mono text-amber shrink-0">
                          running…
                        </span>
                      )}
                      {done && (
                        <span className="text-[10px] font-mono text-emerald-300/80 shrink-0">
                          ok
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6 text-center text-[11px] font-mono text-muted-foreground">
              {bootDone ? "Handing off…" : "Don't close this tab."}
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section
            key="step3"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative z-10 max-w-2xl mx-auto px-6 pt-32 pb-24 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="w-16 h-16 mx-auto rounded-2xl bg-amber/15 grid place-items-center glow-amber"
            >
              <Shield className="w-7 h-7 text-amber" />
            </motion.div>
            <h2 className="mt-8 text-3xl sm:text-4xl font-semibold tracking-tight">
              You're in.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Taking you to your workspace…
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
