import { create } from "zustand";

export type AssistantContext = {
  repoId?: string;
  prId?: string;
  reviewId?: string;
  repoName?: string;
  prTitle?: string;
  prNumber?: number | null;
};

type State = {
  open: boolean;
  /** When set, the panel mounts and immediately submits this prompt. */
  pending?: string;
  context: AssistantContext;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  setContext: (ctx: AssistantContext) => void;
  /** Open the panel and queue a prompt to send. */
  ask: (prompt: string, ctx?: AssistantContext) => void;
  consumePending: () => string | undefined;
};

export const useAssistant = create<State>((set, get) => ({
  open: false,
  context: {},
  setOpen: (v) => set({ open: v }),
  toggle: () => set({ open: !get().open }),
  setContext: (ctx) => set({ context: { ...get().context, ...ctx } }),
  ask: (prompt, ctx) =>
    set((s) => ({
      open: true,
      pending: prompt,
      context: ctx ? { ...s.context, ...ctx } : s.context,
    })),
  consumePending: () => {
    const p = get().pending;
    if (p) set({ pending: undefined });
    return p;
  },
}));
