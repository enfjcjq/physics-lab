import { create } from "zustand";

export interface VisualizationToggles {
  showTrail: boolean;
  showVelocityArrow: boolean;
  showAccelArrow: boolean;
  showGravityArrow: boolean;
  showNetForce: boolean;
  showAxes: boolean;
  showGrid: boolean;
  showDataLabels: boolean;
  showTeachingLabels: boolean;
  showFormulas: boolean;
  showUnits: boolean;
}

interface VisState {
  toggles: VisualizationToggles;
  toggle: (key: keyof VisualizationToggles) => void;
  setAll: (value: boolean) => void;
}

export const useVisualization = create<VisState>((set) => ({
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
    const next: any = {};
    for (const k of Object.keys(s.toggles)) next[k] = value;
    return { toggles: next };
  }),
}));
