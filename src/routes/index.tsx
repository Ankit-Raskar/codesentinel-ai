import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Shield, Zap, Bug, Lock, Cpu, GitPullRequest, Sparkles, ArrowRight,
  Github, Workflow, CheckCircle2, Gauge, PlayCircle, Layers,
} from "lucide-react";
import { LiveAIFeed } from "@/components/cinematic/LiveAIFeed";

export const Route = createFileRoute("/")({ component: Landing });

const features = [
  { icon: Bug, title: "Bug detection", desc: "Catches logic flaws, null refs, race conditions, and unsafe patterns before merge." },
  { icon: Lock, title: "Security scanner", desc: "SQL injection, XSS, hardcoded secrets, unsafe eval, and dependency CVEs." },
  { icon: Cpu, title: "Performance analyzer", desc: "Spots blocking ops, n+1 queries, leaks, and unnecessary re-renders." },
  { icon: Sparkles, title: "AI fix suggestions", desc: "Every issue ships with a concrete fix and a refactor proposal." },
  { icon: GitPullRequest, title: "PR summary scoring", desc: "Quality, security, performance, and merge-safety scores at a glance." },
  { icon: Zap, title: "Built on Llama 3.3 70B", desc: "Lightning-fast inference via Groq — reviews land in seconds, not minutes." },
];

const workflow = [
  { icon: Github, title: "Connect GitHub", desc: "One-click install. We respect your branch protection rules." },
  { icon: Workflow, title: "Open a PR", desc: "CodeSentinel picks it up the moment GitHub fires the webhook." },
  { icon: Sparkles, title: "AI reviews live", desc: "Streaming analysis with severity-ranked findings + suggested fixes." },
  { icon: CheckCircle2, title: "Merge with confidence", desc: "Merge-safety score gates risky changes before they reach main." },
];


const reviewModes = [
  { name: "Quick Scan", time: "~3s", desc: "Light pass for typos, lint, obvious bugs.", checks: ["Lint", "Types", "Basic safety"] },
  { name: "Deep Review", time: "~18s", desc: "Full semantic + architectural review.", checks: ["Logic", "Patterns", "Refactors", "Tests"], featured: true },
  { name: "Security Audit", time: "~30s", desc: "OWASP top 10 + secret scanning.", checks: ["Injection", "Secrets", "Auth", "CVE"] },
  { name: "Performance Review", time: "~22s", desc: "Hot paths, allocations, queries.", checks: ["N+1", "Bundle", "Memory", "Renders"] },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // Pre-reveal any framer-motion children inside the target section so the
  // content isn't stuck at opacity:0 when smooth-scroll lands on it.
  el.querySelectorAll<HTMLElement>('[style*="opacity: 0"]').forEach((node) => {
    node.style.opacity = "1";
    node.style.transform = "none";
  });
  const top = el.getBoundingClientRect().top + window.scrollY - 16;
  window.scrollTo({ top, behavior: "smooth" });
}

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 md:px-12 py-4 sm:py-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-primary/15 grid place-items-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight truncate">CodeSentinel</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToId("features"); }} className="hover:text-foreground transition">Features</a>
          <a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToId("workflow"); }} className="hover:text-foreground transition">How it works</a>
          <a href="#modes" onClick={(e) => { e.preventDefault(); scrollToId("modes"); }} className="hover:text-foreground transition">Review modes</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToId("pricing"); }} className="hover:text-foreground transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to="/login" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link
            to="/get-started"
            className="text-sm px-3 sm:px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            Get started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-[11px] font-mono text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Powered by Llama 3.3 70B · Groq
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              AI code review<br />
              that ships with <span className="text-primary">confidence.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Every pull request reviewed in seconds. Bugs, security holes, and
              performance traps surfaced — line by line — before they reach main.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 hover:opacity-90 transition glow-border"
              >
                <PlayCircle className="w-4 h-4" /> Watch AI review a real PR
              </Link>
              <Link
                to="/get-started"
                className="px-5 py-3 rounded-md border border-border bg-surface hover:bg-surface-2 text-sm inline-flex items-center gap-2 transition"
              >
                <Github className="w-4 h-4" /> Connect GitHub
              </Link>
            </div>
            <div className="mt-4 text-[11px] font-mono text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
                8 sample repos · 12 live PRs · no setup needed
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="relative min-w-0 w-full"
          >
            <LiveAIFeed />
          </motion.div>
        </div>
      </section>





      {/* FEATURES */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Capabilities</div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Everything you need to ship safely.
          </h2>
          <p className="mt-4 text-muted-foreground">
            One reviewer that thinks like a security engineer, a performance
            specialist, and a staff-level architect — at once.
          </p>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="group glass rounded-xl p-6 magnetic-hover relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition shimmer pointer-events-none" />
              <div className="w-10 h-10 rounded-lg bg-primary/15 grid place-items-center glow-border">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="mt-5 font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">How it works</div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            From webhook to merge in seconds.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-4 gap-4">
          {workflow.map((w, i) => (
            <motion.div
              key={w.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-xl p-6 relative magnetic-hover"
            >
              <div className="font-mono text-[10px] text-muted-foreground">
                STEP 0{i + 1}
              </div>
              <w.icon className="w-5 h-5 text-primary mt-3" />
              <div className="mt-3 font-semibold">{w.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{w.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* REVIEW MODES */}
      <section id="modes" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Review modes</div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Pick the depth. We pick the model.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviewModes.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`relative glass rounded-xl p-6 magnetic-hover ${
                m.featured ? "glow-border" : ""
              }`}
            >
              {m.featured && (
                <span className="absolute top-3 right-3 text-[10px] font-mono uppercase tracking-wider text-primary">
                  recommended
                </span>
              )}
              <Gauge className="w-5 h-5 text-primary" />
              <div className="mt-3 font-semibold text-lg">{m.name}</div>
              <div className="text-xs font-mono text-muted-foreground">{m.time}</div>
              <p className="mt-3 text-sm text-muted-foreground">{m.desc}</p>
              <ul className="mt-4 space-y-1.5 text-xs">
                {m.checks.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {c}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ENTERPRISE TRUST */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="glass-strong rounded-2xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 scan-beam opacity-50" />
          <div className="grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Enterprise-ready</div>
              <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Your code never leaves your perimeter.
              </h3>
              <p className="mt-4 text-muted-foreground">
                SOC 2 Type II in progress. EU-region inference. SSO/SAML, audit
                logs, and customer-managed encryption keys. Self-hosted option
                for regulated teams.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["SOC 2", "GDPR", "SSO / SAML", "Audit logs", "Self-hosted", "CMK encryption"].map((c) => (
                <div key={c} className="glass rounded-lg p-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / FINAL CTA */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Pricing</div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Simple, per-seat.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {[
            { name: "Hobby", price: "Free", desc: "For solo devs and OSS.", features: ["100 PR reviews / mo", "Public repos", "Quick Scan mode"] },
            { name: "Team", price: "$19", desc: "For shipping teams.", features: ["Unlimited PRs", "All review modes", "Slack integration", "Priority queue"], featured: true },
            { name: "Enterprise", price: "Custom", desc: "For regulated orgs.", features: ["Self-hosted", "SSO / SAML", "CMK encryption", "Dedicated support"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative glass rounded-2xl p-8 magnetic-hover ${
                p.featured ? "glow-border" : ""
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
                  most popular
                </span>
              )}
              <div className="font-semibold text-lg">{p.name}</div>
              <div className="mt-3 text-4xl font-semibold tracking-tight">
                {p.price}
                {p.price.startsWith("$") && (
                  <span className="text-sm text-muted-foreground font-normal"> /seat /mo</span>
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{p.desc}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/get-started"
                className={`mt-7 block text-center px-4 py-2.5 rounded-md text-sm font-medium ${
                  p.featured
                    ? "bg-primary text-primary-foreground"
                    : "glass hover:bg-surface-2"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CINEMATIC FINAL CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-12 md:p-20 text-center">
          <div className="gradient-mesh opacity-80" />
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter text-gradient">
              Ship like the top 1%.
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              Plug CodeSentinel into your repo in 60 seconds. Watch the first
              review stream in real time.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/get-started"
                className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium magnetic-hover inline-flex items-center gap-2"
              >
                Start reviewing free <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#workflow"
                onClick={(e) => { e.preventDefault(); scrollToId("workflow"); }}
                className="px-6 py-3 rounded-md glass hover:bg-surface-2 text-sm cursor-pointer"
              >
                Read the docs
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            © {new Date().getFullYear()} CodeSentinel AI — every PR, reviewed.
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Status</a>
            <a href="#" className="hover:text-foreground">Changelog</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
