import { create } from "zustand";

export interface DesignerStoreState {
  result: any;
  setResult: (result: any) => void;
}

export const useDesigner = create<DesignerStoreState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}));