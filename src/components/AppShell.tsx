import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, GitPullRequest, GitBranch, Settings, Shield, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repos", label: "Repositories", icon: GitBranch },
  { to: "/reviews", label: "Reviews", icon: GitPullRequest },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const sidebarInner = (onNavigate?: () => void) => (
    <>
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-2 py-3">
        <div className="w-8 h-8 rounded-md bg-primary/15 grid place-items-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <span className="font-semibold tracking-tight">CodeSentinel</span>
      </Link>
      <nav className="mt-6 flex flex-col gap-1">
        {nav.map((n) => {
          const active = loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground truncate">
          <div className="w-7 h-7 rounded-full bg-primary/20 grid place-items-center text-primary text-[10px] font-semibold">
            {(user?.email ?? "?")[0].toUpperCase()}
          </div>
          <span className="truncate">{user?.email}</span>
        </div>
        <button
          onClick={() => { onNavigate?.(); signOut(); }}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-sidebar-accent"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">

      <aside className="hidden md:flex w-60 flex-col bg-sidebar border-r border-sidebar-border p-4">
        {sidebarInner()}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed z-50 top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col md:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 p-2 rounded-md hover:bg-sidebar-accent text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarInner(() => setOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-sidebar-accent text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight text-sm">CodeSentinel</span>
          </Link>
          <div className="w-9" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
