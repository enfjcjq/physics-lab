import { create } from "zustand";
const SUB_MODE_PRESETS = {
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
export const useTeaching = create((set, get) => ({
    mode: "learning",
    subMode: "teaching",
    overlay: { ...SUB_MODE_PRESETS.teaching },
    setMode: (mode) => {
        // When switching to learning/experiment/analysis, adjust sub-mode
        const subModeMap = {
            learning: "teaching",
            experiment: "experiment",
            analysis: "solving",
        };
        const sub = subModeMap[mode];
        set({ mode, subMode: sub, overlay: { ...SUB_MODE_PRESETS[sub] } });
    },
    setSubMode: (subMode) => set({ subMode, overlay: { ...SUB_MODE_PRESETS[subMode] } }),
    toggleOverlay: (key) => set((s) => ({ overlay: { ...s.overlay, [key]: !s.overlay[key] } })),
    getVisibleOverlays: () => {
        const o = get().overlay;
        return Object.keys(o).filter((k) => o[k]);
    },
}));
//# sourceMappingURL=teaching.store.js.map