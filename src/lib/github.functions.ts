import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ghListRepos, ghListPulls, ghGetPull, ghGetPullFiles } from "./github.server";

async function requireToken(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.github_token) throw new Error("Connect your GitHub account in Settings first.");
  return data.github_token as string;
}

export const syncRepositories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const token = await requireToken(supabase, userId);
    const repos = await ghListRepos(token);

    const rows = repos.map((r) => ({
      user_id: userId,
      github_repo_id: r.id,
      full_name: r.full_name,
      name: r.name,
      description: r.description,
      default_branch: r.default_branch,
      language: r.language,
      private: r.private,
      html_url: r.html_url,
    }));

    if (rows.length) {
      const { error } = await supabase
        .from("repositories")
        .upsert(rows, { onConflict: "user_id,github_repo_id" });
      if (error) throw new Error(error.message);
    }
    return { count: rows.length };
  });

export const listRepositories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("repositories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const syncPullRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ repoId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const token = await requireToken(supabase, userId);

    const { data: repo, error: re } = await supabase
      .from("repositories")
      .select("*")
      .eq("id", data.repoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (re) throw new Error(re.message);
    if (!repo) throw new Error("Repository not found");

    const pulls = await ghListPulls(token, repo.full_name);

    const rows = pulls.map((p) => ({
      user_id: userId,
      repository_id: repo.id,
      github_pr_number: p.number,
      title: p.title,
      body: p.body,
      state: p.state,
      author: p.user?.login ?? null,
      author_avatar: p.user?.avatar_url ?? null,
      head_sha: p.head.sha,
      base_sha: p.base.sha,
      head_ref: p.head.ref,
      base_ref: p.base.ref,
      html_url: p.html_url,
      additions: p.additions ?? 0,
      deletions: p.deletions ?? 0,
      changed_files: p.changed_files ?? 0,
      github_created_at: p.created_at,
    }));

    if (rows.length) {
      const { error } = await supabase
        .from("pull_requests")
        .upsert(rows, { onConflict: "repository_id,github_pr_number" });
      if (error) throw new Error(error.message);
    }
    return { count: rows.length };
  });

export const listPullRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ repoId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("pull_requests")
      .select("*")
      .eq("repository_id", data.repoId)
      .eq("user_id", userId)
      .order("github_created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPullRequestDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ prId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: pr, error } = await supabase
      .from("pull_requests")
      .select("*, repositories(*)")
      .eq("id", data.prId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pr) throw new Error("PR not found");

    const token = await requireToken(supabase, userId);
    const files = await ghGetPullFiles(token, pr.repositories.full_name, pr.github_pr_number);
    const fresh = await ghGetPull(token, pr.repositories.full_name, pr.github_pr_number);

    return { pr, files, fresh };
  });
