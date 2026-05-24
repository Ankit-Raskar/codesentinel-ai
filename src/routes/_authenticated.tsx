import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { AIAssistantFab } from "@/components/ai/AIAssistantFab";
import { useAssistant } from "@/stores/assistant";

export const Route = createFileRoute("/_authenticated")({ component: Gate });

function Gate() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const toggle = useAssistant((s) => s.toggle);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <AppShell>
      <Outlet />
      <AIAssistantFab />
      <AIAssistantPanel />
    </AppShell>
  );
}
