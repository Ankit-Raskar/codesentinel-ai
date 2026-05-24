import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created. Welcome aboard.");
        nav({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary/20 grid place-items-center glow-border">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight">CodeSentinel AI</span>
        </div>
        <h1 className="text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "signin" ? "Sign in to start reviewing PRs." : "Get started in seconds."}
        </p>

        <div className="mt-6" />


        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <div className="mt-1 flex items-center glass rounded-md px-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full py-2 px-2 text-sm outline-none"
                placeholder="you@company.com"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Password</span>
            <div className="mt-1 flex items-center glass rounded-md px-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full py-2 px-2 text-sm outline-none"
                placeholder="••••••••"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}
