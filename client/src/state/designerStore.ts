import { create } from "zustand";

export interface DesignerStoreState {
  result: any;
  selectedCandidateIndex: number | null;
  setResult: (result: any) => void;
  setSelectedCandidateIndex: (index: number | null) => void;
}

const findDefaultCandidateIndex = (result: any): number | null => {
  if (!result || !Array.isArray(result.candidates) || result.candidates.length === 0) {
    return null;
  }

  const firstWithProperties = result.candidates.findIndex(
    (candidate: any) => candidate && candidate.properties
  );

  if (firstWithProperties >= 0) {
    return firstWithProperties;
  }

  return 0;
};

export const useDesigner = create<DesignerStoreState>((set) => ({
  result: null,
  selectedCandidateIndex: null,
  setResult: (result) =>
    set({
      result,
      selectedCandidateIndex: findDefaultCandidateIndex(result),
    }),
  setSelectedCandidateIndex: (index) => set({ selectedCandidateIndex: index }),
}));
