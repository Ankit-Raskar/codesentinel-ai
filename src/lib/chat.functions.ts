import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { groqChat } from "./groq.server";

const SYSTEM = `You are CodeSentinel AI, a senior engineer helping a developer
understand a code review. Be concise, technical, and actionable. Use markdown
with fenced code blocks for code. If the user asks about a specific issue,
suggest a concrete refactor.`;

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reviewId: z.string().uuid().optional(),
        message: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // build context from review (if any)
    let contextBlock = "";
    if (data.reviewId) {
      const { data: review } = await supabase
        .from("ai_reviews")
        .select("summary, quality_score, security_score, performance_score")
        .eq("id", data.reviewId)
        .eq("user_id", userId)
        .maybeSingle();
      const { data: comments } = await supabase
        .from("review_comments")
        .select("file_path,line_number,severity,category,title,explanation,suggested_fix")
        .eq("review_id", data.reviewId)
        .limit(20);
      if (review) {
        contextBlock = `\n\n[REVIEW CONTEXT]\n${review.summary}\nQuality:${review.quality_score} Security:${review.security_score} Performance:${review.performance_score}\nIssues:\n${(comments ?? [])
          .map(
            (c) =>
              `- [${c.severity}/${c.category}] ${c.title} @ ${c.file_path}:${c.line_number ?? "?"} — ${c.explanation}`,
          )
          .join("\n")}\n[/REVIEW CONTEXT]`;
      }
    }

    const baseQ = supabase
      .from("chat_messages")
      .select("role,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);
    const { data: history } = await (data.reviewId
      ? baseQ.eq("review_id", data.reviewId)
      : baseQ.is("review_id", null));

    const transcript = (history ?? [])
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const userPrompt = `${transcript ? transcript + "\n\n" : ""}USER: ${data.message}${contextBlock}`;

    const reply = await groqChat({
      system: SYSTEM,
      user: userPrompt,
      temperature: 0.4,
      max_tokens: 1500,
    });

    await supabase.from("chat_messages").insert([
      { user_id: userId, review_id: data.reviewId ?? null, role: "user", content: data.message },
      { user_id: userId, review_id: data.reviewId ?? null, role: "assistant", content: reply },
    ]);

    return { reply };
  });

export const listChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ reviewId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);
    const { data: rows, error } = data.reviewId
      ? await q.eq("review_id", data.reviewId)
      : await q.is("review_id", null);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
