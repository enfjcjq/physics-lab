import { create } from "zustand";
// Legacy PHASES kept for backward compat (deprecated)
export const PHASES = [];
export const useUIStore = create((set) => ({
    leftOpen: true,
    rightOpen: true,
    drawerOpen: true,
    drawerHeight: 220,
    activeChartTab: "velocity_time",
    activeAnalysisTab: "force",
    toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
    toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
    toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
    setDrawerHeight: (h) => set({ drawerHeight: h }),
    setChartTab: (tab) => set({ activeChartTab: tab }),
    setAnalysisTab: (tab) => set({ activeAnalysisTab: tab }),
}));
//# sourceMappingURL=ui.store.js.map