import { create } from "zustand";

export type CopilotMsg = { role: "user" | "assistant"; content: string };

type CopilotState = {
  messages: CopilotMsg[];
  append: (m: CopilotMsg | CopilotMsg[]) => void;
  clear: () => void;
};

export const useCopilot = create<CopilotState>((set) => ({
  messages: [],
  append: (m) =>
    set((s) => ({
      messages: s.messages.concat(Array.isArray(m) ? m : [m]),
    })),
  clear: () => set({ messages: [] }),
}));
