import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ghGetUser } from "./github.server";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveGithubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ token: z.string().min(20).max(255) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // verify token by hitting GitHub
    const user = await ghGetUser(data.token);
    const { error } = await supabase
      .from("profiles")
      .update({
        github_token: data.token,
        github_username: user.login,
        avatar_url: user.avatar_url,
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, username: user.login };
  });

export const disconnectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ github_token: null, github_username: null })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
