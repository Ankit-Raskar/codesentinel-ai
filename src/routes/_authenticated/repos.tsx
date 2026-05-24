import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { RefreshCw, GitBranch, Lock, Loader2 } from "lucide-react";
import { listRepositories, syncRepositories } from "@/lib/github.functions";

export const Route = createFileRoute("/_authenticated/repos")({ component: Repos });

function Repos() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRepositories);
  const syncFn = useServerFn(syncRepositories);
  const { data, isLoading } = useQuery({ queryKey: ["repos"], queryFn: () => listFn() });
  const sync = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (r) => { toast.success(`Synced ${r.count} repositories`); qc.invalidateQueries({ queryKey: ["repos"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground text-sm mt-1">Synced from your GitHub account.</p>
        </div>
        <button
          onClick={() => sync.mutate()} disabled={sync.isPending}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
        >
          {sync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync from GitHub
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">
          No repositories yet. Click <strong>Sync from GitHub</strong> to import.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link
                to="/repos/$repoId" params={{ repoId: r.id }}
                className="glass rounded-xl p-5 block hover:glow-border transition"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="truncate">{r.full_name}</span>
                  {r.private && <Lock className="w-3 h-3 ml-auto" />}
                </div>
                <div className="mt-2 font-semibold truncate">{r.name}</div>
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[2em]">
                  {r.description || "No description"}
                </div>
                <div className="mt-3 text-[11px] text-primary">{r.language || "—"}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
