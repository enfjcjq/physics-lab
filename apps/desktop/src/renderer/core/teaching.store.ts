import { create } from "zustand";

export type TeachingMode = "experiment" | "teaching" | "solving" | "explore";

export interface TeachingOverlayState {
  showKnowledge: boolean;
  showForces: boolean;
  showMotion: boolean;
  showDerivation: boolean;
  showTips: boolean;
  showAnswer: boolean;
  showFormulas: boolean;
}

interface TeachingState {
  mode: TeachingMode;
  overlay: TeachingOverlayState;
  setMode: (mode: TeachingMode) => void;
  toggleOverlay: (key: keyof TeachingOverlayState) => void;
  getVisibleOverlays: () => (keyof TeachingOverlayState)[];
}

const MODE_PRESETS: Record<TeachingMode, TeachingOverlayState> = {
  experiment: {
    showKnowledge: false, showForces: false, showMotion: false,
    showDerivation: false, showTips: false, showAnswer: false, showFormulas: false,
  },
  teaching: {
    showKnowledge: true, showForces: true, showMotion: true,
    showDerivation: false, showTips: true, showAnswer: false, showFormulas: false,
  },
  solving: {
    showKnowledge: false, showForces: true, showMotion: true,
    showDerivation: true, showTips: false, showAnswer: true, showFormulas: true,
  },
  explore: {
    showKnowledge: true, showForces: false, showMotion: false,
    showDerivation: false, showTips: true, showAnswer: false, showFormulas: true,
  },
};

export const useTeaching = create<TeachingState>((set, get) => ({
  mode: "teaching",
  overlay: { ...MODE_PRESETS.teaching },
  setMode: (mode) => set({ mode, overlay: { ...MODE_PRESETS[mode] } }),
  toggleOverlay: (key) => set((s) => ({ overlay: { ...s.overlay, [key]: !s.overlay[key] } })),
  getVisibleOverlays: () => {
    const o = get().overlay;
    return (Object.keys(o) as (keyof TeachingOverlayState)[]).filter((k) => o[k]);
  },
}));
