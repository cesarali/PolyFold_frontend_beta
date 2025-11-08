import { create } from "zustand";

export type SessionState = {
  currentSourceId: string | null;
  setCurrentSourceId: (id: string | null) => void;
};

// Strongly typed store
export const useSession = create<SessionState>((set) => ({
  currentSourceId: null,
  setCurrentSourceId: (id) => set({ currentSourceId: id }),
}));
