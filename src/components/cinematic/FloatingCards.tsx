import { motion } from "framer-motion";
import { GitPullRequest, Shield, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

export function FloatingPRCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: -20 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="glass-strong rounded-xl p-4 w-[280px] float-y"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center gap-2 text-xs">
        <GitPullRequest className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono text-muted-foreground">PR #418</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px]">
          ready
        </span>
      </div>
      <div className="mt-2 text-sm font-medium leading-tight">
        feat: stripe billing portal
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-suggestion" /> 9.1
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-warning" /> 7.4
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-optimization" /> safe
        </span>
      </div>
    </motion.div>
  );
}

export function FloatingRepoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: 20 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: 0.8, duration: 0.8 }}
      className="glass-strong rounded-xl p-4 w-[260px] float-y"
      style={{ animationDelay: "1.2s" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">acme/payments-api</div>
        <span className="text-[10px] font-mono text-muted-foreground">main</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-primary">94</div>
          <div className="text-[10px] text-muted-foreground">health</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-warning">3</div>
          <div className="text-[10px] text-muted-foreground">risks</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-400">28</div>
          <div className="text-[10px] text-muted-foreground">PRs</div>
        </div>
      </div>
    </motion.div>
  );
}

export function FloatingAlertCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.8 }}
      className="glass-strong rounded-xl p-3 w-[240px] float-y"
      style={{ animationDelay: "2s" }}
    >
      <div className="flex items-center gap-2 text-xs text-critical">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="font-semibold">SQL Injection</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">0.97</span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground line-clamp-2">
        users.ts:42 — raw input concatenated into SELECT
      </div>
    </motion.div>
  );
}