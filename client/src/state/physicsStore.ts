import { create } from "zustand";

export interface PhysicsStoreState {
  template: string | null;
  porogen: string | null;
  monomer: string | null;
  workers: string[];
  lastRun: any;
  setTemplate: (value: string | null) => void;
  setPorogen: (value: string | null) => void;
  setMonomer: (value: string | null) => void;
  setWorkers: (value: string[]) => void;
  setLastRun: (value: any) => void;
}

export const usePhysics = create<PhysicsStoreState>((set) => ({
  template: null,
  porogen: null,
  monomer: null,
  workers: ["chem.mol/etkdg-mmff@v1", "fast_structure/pack_pose_xyz@v1"],
  lastRun: null,
  setTemplate: (value) => set({ template: value }),
  setPorogen: (value) => set({ porogen: value }),
  setMonomer: (value) => set({ monomer: value }),
  setWorkers: (value) => set({ workers: value }),
  setLastRun: (value) => set({ lastRun: value }),
}));