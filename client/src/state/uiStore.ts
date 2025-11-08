import { create } from "zustand";

type UIState = {
  leftOpen: boolean;
  rightOpen: boolean;
  copilotCollapsed: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleCopilot: () => void;
};

export const useUI = create<UIState>((set)=> ({
  leftOpen: true,
  rightOpen: true,
  copilotCollapsed: false,
  toggleLeft:  ()=> set(s => ({ leftOpen: !s.leftOpen })),
  toggleRight: ()=> set(s => ({ rightOpen: !s.rightOpen })),
  toggleCopilot: ()=> set(s => ({ copilotCollapsed: !s.copilotCollapsed })),
}));
