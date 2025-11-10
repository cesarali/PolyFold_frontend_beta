import { create } from "zustand";

type UIState = {
  leftOpen: boolean;
  rightOpen: boolean;
  copilotCollapsed: boolean;
  rightSidebarWidth: number;
  controlsPaneHeight: number;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleCopilot: () => void;
  setRightSidebarWidth: (width: number) => void;
  setControlsPaneHeight: (height: number) => void;
};

export const useUI = create<UIState>((set)=> ({
  leftOpen: true,
  rightOpen: true,
  copilotCollapsed: false,
  rightSidebarWidth: 360,
  controlsPaneHeight: 220,
  toggleLeft:  ()=> set(s => ({ leftOpen: !s.leftOpen })),
  toggleRight: ()=> set(s => ({ rightOpen: !s.rightOpen })),
  toggleCopilot: ()=> set(s => ({ copilotCollapsed: !s.copilotCollapsed })),
  setRightSidebarWidth: (width) => set(() => ({ rightSidebarWidth: width })),
  setControlsPaneHeight: (height) => set(() => ({ controlsPaneHeight: height })),
}));
