import { create } from "zustand";

export type ExperimentPhase = "release" | "falling" | "impact" | "bounce";

interface PhaseInfo {
  id: ExperimentPhase;
  label: string;
  icon: string;
  timeRange: [number, number];
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const PHASES: PhaseInfo[] = [
  { id: "release", label: "Release",  icon: "o", timeRange: [0, 0.05],  cameraPos: [8, 6, 8], cameraTarget: [0, 5, 0] },
  { id: "falling", label: "Falling",  icon: "v", timeRange: [0.05, 1.4], cameraPos: [4, 5, 4], cameraTarget: [0, 4, 0] },
  { id: "impact",  label: "Impact",   icon: "O", timeRange: [1.35, 1.5], cameraPos: [2, 1.5, 2], cameraTarget: [0, 0.5, 0] },
  { id: "bounce",  label: "Bounce",   icon: "^", timeRange: [1.5, 4.0],  cameraPos: [6, 4, 6], cameraTarget: [0, 2, 0] },
];

export type ChartTab = "timeline" | "vt" | "st" | "energy";
export type AnalysisTab = "force" | "motion" | "derivation" | "knowledge" | "tips";
export type InputMethod = "text" | "ocr" | "image" | "pdf";

interface UIState {
  leftOpen: boolean;
  rightOpen: boolean;
  drawerOpen: boolean;
  drawerHeight: number;
  activePhase: ExperimentPhase;
  activeChartTab: ChartTab;
  activeAnalysisTab: AnalysisTab;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleDrawer: () => void;
  setDrawerHeight: (h: number) => void;
  setPhase: (phase: ExperimentPhase) => void;
  setChartTab: (tab: ChartTab) => void;
  setAnalysisTab: (tab: AnalysisTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
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
