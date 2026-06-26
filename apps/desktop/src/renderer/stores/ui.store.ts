import { create } from "zustand";
import type { TimelinePhase } from "@physics-lab/shared";

// ExperimentPhase is now a generic string (phase IDs come from PhysicsScene)
export type ExperimentPhase = string;

// Legacy PHASES kept for backward compat (deprecated)
export const PHASES: TimelinePhase[] = [];

export type ChartTab = "position_time" | "velocity_time" | "acceleration_time" | "kinetic_energy" | "potential_energy" | "mechanical_energy";
export type AnalysisTab = "force" | "motion" | "derivation" | "knowledge" | "tips";
export type InputMethod = "text" | "ocr" | "image" | "pdf";

interface UIState {
  leftOpen: boolean;
  rightOpen: boolean;
  drawerOpen: boolean;
  drawerHeight: number;
  activeChartTab: ChartTab;
  activeAnalysisTab: AnalysisTab;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleDrawer: () => void;
  setDrawerHeight: (h: number) => void;
  setChartTab: (tab: ChartTab) => void;
  setAnalysisTab: (tab: AnalysisTab) => void;
}

export const useUIStore = create<UIState>((set) => ({
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
