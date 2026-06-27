import { create } from "zustand";
export const useVisualization = create((set) => ({
    toggles: {
        showTrail: true,
        showVelocityArrow: true,
        showAccelArrow: true,
        showGravityArrow: true,
        showNetForce: false,
        showAxes: true,
        showGrid: true,
        showDataLabels: true,
        showTeachingLabels: true,
        showFormulas: true,
        showUnits: true,
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