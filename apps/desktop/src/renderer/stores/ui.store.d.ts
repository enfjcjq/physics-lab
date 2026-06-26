export type ExperimentPhase = "release" | "falling" | "impact" | "bounce";
interface PhaseInfo {
    id: ExperimentPhase;
    label: string;
    icon: string;
    timeRange: [number, number];
    cameraPos: [number, number, number];
    cameraTarget: [number, number, number];
}
export declare const PHASES: PhaseInfo[];
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
export declare const useUIStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UIState>>;
export {};
//# sourceMappingURL=ui.store.d.ts.map