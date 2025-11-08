import { create } from "zustand";

type DesignerState = {
  result: any;
  setResult: (result: any) => void;
};

export const useDesigner = create<DesignerState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
}));
