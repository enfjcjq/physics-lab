import { create } from "zustand";
export const useVisualization = create((set) => ({
    toggles: {
        showTrail: true,
        showVelocityArrow: false,
        showAccelArrow: false,
        showGravityArrow: true,
        showNetForce: false,
        showAxes: true,
        showGrid: true,
        showDataLabels: false,
        showTeachingLabels: false,
        showFormulas: false,
        showUnits: false,
    },
    toggle: (key) => set((s) => ({
        toggles: { ...s.toggles, [key]: !s.toggles[key] },
    })),
    setAll: (value) => set((s) => {
        const next = {};
        for (const k of Object.keys(s.toggles))
            next[k] = value;
        return { toggles: next };
    }),
}));
//# sourceMappingURL=visualization.store.js.map