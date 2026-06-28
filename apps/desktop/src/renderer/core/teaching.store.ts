import { create } from "zustand";

/** V1.0 mode system: 3 primary modes */
export type AppMode = "learning" | "experiment" | "analysis";

/** Legacy teaching sub-mode (used within the old teaching overlay) */
export type TeachingSubMode = "experiment" | "teaching" | "solving" | "explore";

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
  /** Primary app mode (V1.0) */
  mode: AppMode;
  /** Legacy teaching sub-mode (for overlay behavior) */
  subMode: TeachingSubMode;
  overlay: TeachingOverlayState;
  setMode: (mode: AppMode) => void;
  setSubMode: (subMode: TeachingSubMode) => void;
  toggleOverlay: (key: keyof TeachingOverlayState) => void;
  getVisibleOverlays: () => (keyof TeachingOverlayState)[];
}

const SUB_MODE_PRESETS: Record<TeachingSubMode, TeachingOverlayState> = {
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
  mode: "learning",
  subMode: "teaching",
  overlay: { ...SUB_MODE_PRESETS.teaching },

  setMode: (mode) => {
    const subModeMap: Record<AppMode, TeachingSubMode> = {
      learning: "teaching",
      experiment: "experiment",
      analysis: "solving",
    };
    const sub = subModeMap[mode];
    
    // Open appropriate panels per mode via dynamic import
    (async () => {
      const { usePanelManager } = await import("./panel-manager.store");
      const mgr = usePanelManager.getState();
      if (mode === "learning") {
        mgr.open("problem"); mgr.open("teaching");
        mgr.close("analysis"); mgr.close("parameters");
      } else if (mode === "experiment") {
        mgr.open("problem"); mgr.open("parameters"); mgr.open("analysis");
        mgr.close("teaching");
      } else if (mode === "analysis") {
        mgr.open("problem"); mgr.open("analysis"); mgr.open("teaching"); mgr.open("parameters");
      }
    })();

    set({ mode, subMode: sub, overlay: { ...SUB_MODE_PRESETS[sub] } });
  },

  setSubMode: (subMode) =>
    set({ subMode, overlay: { ...SUB_MODE_PRESETS[subMode] } }),

  toggleOverlay: (key) =>
    set((s) => ({ overlay: { ...s.overlay, [key]: !s.overlay[key] } })),

  getVisibleOverlays: () => {
    const o = get().overlay;
    return (Object.keys(o) as (keyof TeachingOverlayState)[]).filter((k) => o[k]);
  },
}));
