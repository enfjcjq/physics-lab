import { create } from "zustand";

/** Internal app mode (S81: no longer exposed in the UI). */
export type AppMode = "learning" | "experiment" | "analysis";

/** Legacy teaching sub-mode (internal only). */
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

export type TeachingElementKey = "phaseCard" | "formulaStrip" | "forceCallout" | "eventPulse";

interface TeachingState {
  /** Internal app mode (kept for compatibility; not rendered in the UI) */
  mode: AppMode;
  /** Legacy teaching sub-mode (internal) */
  subMode: TeachingSubMode;
  overlay: TeachingOverlayState;
  /** Teaching Layer (PhaseCard / FormulaStrip) visibility */
  showPhaseCard: boolean;
  showFormulaStrip: boolean;
  /** Teaching Layer (ForceCallout / EventPulse) visibility */
  showForceCallout: boolean;
  showEventPulse: boolean;
  /** Master switch for the 2D teaching layer (low-perf / user fallback) */
  teachingLayerEnabled: boolean;
  /** Legacy center overlay (S83: default off; content duplicates TeacherPanel) */
  showLegacyOverlay: boolean;
  setLegacyOverlay: (v: boolean) => void;
  setMode: (mode: AppMode) => void;
  setSubMode: (subMode: TeachingSubMode) => void;
  toggleOverlay: (key: keyof TeachingOverlayState) => void;
  getVisibleOverlays: () => (keyof TeachingOverlayState)[];
  toggleTeachingElement: (key: TeachingElementKey) => void;
  setTeachingLayerEnabled: (v: boolean) => void;
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
  showPhaseCard: true,
  showFormulaStrip: true,
  showForceCallout: true,
  showEventPulse: true,
  teachingLayerEnabled: true,
  showLegacyOverlay: false,

  setLegacyOverlay: (v) => set({ showLegacyOverlay: v }),

  toggleTeachingElement: (key) =>
    set((s) => {
      switch (key) {
        case "phaseCard": return { showPhaseCard: !s.showPhaseCard };
        case "formulaStrip": return { showFormulaStrip: !s.showFormulaStrip };
        case "forceCallout": return { showForceCallout: !s.showForceCallout };
        case "eventPulse": return { showEventPulse: !s.showEventPulse };
        default: return {};
      }
    }),

  setTeachingLayerEnabled: (v) => set({ teachingLayerEnabled: v }),

  // S81: mode is internal state only (no panel auto-open, no UI surface).
  setMode: (mode) => {
    const subModeMap: Record<AppMode, TeachingSubMode> = {
      learning: "teaching",
      experiment: "experiment",
      analysis: "solving",
    };
    const sub = subModeMap[mode];
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
