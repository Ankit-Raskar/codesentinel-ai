import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Loader2, GitPullRequest, ArrowLeft } from "lucide-react";
import { listPullRequests, syncPullRequests } from "@/lib/github.functions";

export const Route = createFileRoute("/_authenticated/repos_/$repoId")({ component: RepoPRs });

function RepoPRs() {
  const { repoId } = Route.useParams();
  const qc = useQueryClient();
  const listFn = useServerFn(listPullRequests);
  const syncFn = useServerFn(syncPullRequests);
  const { data, isLoading } = useQuery({
    queryKey: ["prs", repoId],
    queryFn: () => listFn({ data: { repoId } }),
  });
  const sync = useMutation({
    mutationFn: () => syncFn({ data: { repoId } }),
    onSuccess: (r) => { toast.success(`Synced ${r.count} PRs`); qc.invalidateQueries({ queryKey: ["prs", repoId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Link to="/repos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All repositories
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pull Requests</h1>
        <button onClick={() => sync.mutate()} disabled={sync.isPending}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
          {sync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync PRs
        </button>
      </div>

      {isLoading ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <div className="glass rounded-xl p-10 text-center text-sm text-muted-foreground">
          No PRs found. Click <strong>Sync PRs</strong>.
        </div>
      ) : (
        <div className="glass rounded-xl divide-y divide-border overflow-hidden">
          {data.map(pr => (
            <Link key={pr.id} to="/pr/$prId" params={{ prId: pr.id }}
              className="flex items-center gap-4 p-4 hover:bg-surface-2 transition">
              <GitPullRequest className={`w-4 h-4 ${pr.state === "open" ? "text-emerald-400" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{pr.title}</div>
                <div className="text-xs text-muted-foreground">
                  #{pr.github_pr_number} · {pr.author} · {pr.state} · +{pr.additions} −{pr.deletions}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
