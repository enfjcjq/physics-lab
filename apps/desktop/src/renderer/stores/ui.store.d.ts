import type { TimelinePhase } from "@physics-lab/shared";
export type ExperimentPhase = string;
export declare const PHASES: TimelinePhase[];
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
export declare const useUIStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UIState>>;
export {};
//# sourceMappingURL=ui.store.d.ts.map