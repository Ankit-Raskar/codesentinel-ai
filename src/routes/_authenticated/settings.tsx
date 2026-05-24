import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Github, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { getProfile, saveGithubToken, disconnectGithub } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const qc = useQueryClient();
  const getFn = useServerFn(getProfile);
  const saveFn = useServerFn(saveGithubToken);
  const disFn = useServerFn(disconnectGithub);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });
  const [token, setToken] = useState("");

  const save = useMutation({
    mutationFn: (t: string) => saveFn({ data: { token: t } }),
    onSuccess: (r) => { toast.success(`Connected as @${r.username}`); setToken(""); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const disconnect = useMutation({
    mutationFn: () => disFn(),
    onSuccess: () => { toast.success("Disconnected"); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Connect your accounts and manage your profile.</p>
      </div>

      <section className="glass rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Github className="w-5 h-5" />
          <h2 className="font-semibold">GitHub integration</h2>
          {profile?.github_username && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> @{profile.github_username}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Paste a GitHub personal access token (classic or fine-grained) with <code>repo</code> read access.
          We'll use it to fetch your repositories, PRs, and diffs.
        </p>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=CodeSentinel%20AI"
          target="_blank" rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Create a token on GitHub <ExternalLink className="w-3 h-3" />
        </a>

        {profile?.github_token ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => disconnect.mutate()}
              className="px-4 py-2 rounded-md glass hover:bg-surface-2 text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (token) save.mutate(token); }}
            className="mt-4 flex gap-2"
          >
            <input
              type="password" value={token} onChange={e => setToken(e.target.value)}
              placeholder="ghp_..." className="flex-1 glass rounded-md px-3 py-2 text-sm font-mono outline-none"
            />
            <button
              disabled={save.isPending || !token}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
            >
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
