// Server-only GitHub REST API helpers.

const GH = "https://api.github.com";

async function ghFetch(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      "User-Agent": "CodeSentinel-AI",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

export async function ghGetUser(token: string) {
  const r = await ghFetch(token, "/user");
  return r.json() as Promise<{
    login: string;
    avatar_url: string;
    name?: string;
  }>;
}

export type GHRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  stargazers_count: number;
};

export async function ghListRepos(token: string): Promise<GHRepo[]> {
  const r = await ghFetch(
    token,
    "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
  );
  return r.json();
}

export type GHPull = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  user: { login: string; avatar_url: string } | null;
  head: { sha: string; ref: string };
  base: { sha: string; ref: string };
  html_url: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  created_at: string;
};

export async function ghListPulls(token: string, fullName: string): Promise<GHPull[]> {
  const r = await ghFetch(
    token,
    `/repos/${fullName}/pulls?state=all&per_page=50&sort=updated&direction=desc`,
  );
  return r.json();
}

export async function ghGetPull(token: string, fullName: string, num: number): Promise<GHPull> {
  const r = await ghFetch(token, `/repos/${fullName}/pulls/${num}`);
  return r.json();
}

export type GHPullFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
};

export async function ghGetPullFiles(
  token: string,
  fullName: string,
  num: number,
): Promise<GHPullFile[]> {
  const r = await ghFetch(token, `/repos/${fullName}/pulls/${num}/files?per_page=100`);
  return r.json();
}

export type GHReviewComment = {
  path: string;
  line?: number;
  side?: "LEFT" | "RIGHT";
  body: string;
};

export type GHReviewEvent = "COMMENT" | "APPROVE" | "REQUEST_CHANGES";

export type GHReviewResponse = {
  id: number;
  html_url: string;
  state: string;
  body: string;
};

/**
 * Post a review (with optional inline comments) to a GitHub PR.
 * https://docs.github.com/en/rest/pulls/reviews#create-a-review-for-a-pull-request
 */
export async function ghPostReview(
  token: string,
  fullName: string,
  num: number,
  args: {
    commitId?: string;
    body: string;
    event: GHReviewEvent;
    comments: GHReviewComment[];
  },
): Promise<GHReviewResponse> {
  const r = await ghFetch(token, `/repos/${fullName}/pulls/${num}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commit_id: args.commitId,
      body: args.body,
      event: args.event,
      comments: args.comments.map((c) => ({
        path: c.path,
        line: c.line,
        side: c.side ?? "RIGHT",
        body: c.body,
      })),
    }),
  });
  return r.json();
}

