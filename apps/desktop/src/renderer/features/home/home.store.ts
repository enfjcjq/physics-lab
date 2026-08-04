import { create } from "zustand";

/** Top-level app view: problem-input homepage (P0) vs learning scene page. */
export type AppView = "home" | "scene";

interface HomeState {
  view: AppView;
  setView: (view: AppView) => void;
}

export const useHome = create<HomeState>((set) => ({
  view: "home",
  setView: (view) => set({ view }),
}));
