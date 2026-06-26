import { create } from "zustand";
export const PHASES = [
    { id: "release", label: "Release", icon: "o", timeRange: [0, 0.05], cameraPos: [8, 6, 8], cameraTarget: [0, 5, 0] },
    { id: "falling", label: "Falling", icon: "v", timeRange: [0.05, 1.4], cameraPos: [4, 5, 4], cameraTarget: [0, 4, 0] },
    { id: "impact", label: "Impact", icon: "O", timeRange: [1.35, 1.5], cameraPos: [2, 1.5, 2], cameraTarget: [0, 0.5, 0] },
    { id: "bounce", label: "Bounce", icon: "^", timeRange: [1.5, 4.0], cameraPos: [6, 4, 6], cameraTarget: [0, 2, 0] },
];
export const useUIStore = create((set) => ({
    leftOpen: true,
    rightOpen: true,
    drawerOpen: true,
    drawerHeight: 220,
    activePhase: "release",
    activeChartTab: "vt",
    activeAnalysisTab: "force",
    toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
    toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
    toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
    setDrawerHeight: (h) => set({ drawerHeight: h }),
    setPhase: (phase) => set({ activePhase: phase }),
    setChartTab: (tab) => set({ activeChartTab: tab }),
    setAnalysisTab: (tab) => set({ activeAnalysisTab: tab }),
}));
//# sourceMappingURL=ui.store.js.map