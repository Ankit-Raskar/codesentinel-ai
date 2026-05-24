// Server-only Groq client (OpenAI-compatible API).
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function groqChat(opts: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens ?? 4096,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return json.choices[0]?.message?.content ?? "";
}

/**
 * Streaming Groq chat. Returns a ReadableStream of UTF-8 token text.
 * onComplete fires once with the full accumulated text after the upstream ends.
 */
export async function groqChatStream(opts: {
  messages: ChatMsg[];
  temperature?: number;
  max_tokens?: number;
  onComplete?: (full: string) => Promise<void> | void;
}): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured");

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 2000,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    throw new Error(`Groq stream error ${upstream.status}: ${text.slice(0, 400)}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  const onComplete = opts.onComplete;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line || !line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                full += token;
                controller.enqueue(encoder.encode(token));
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }
        if (onComplete) await onComplete(full);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
