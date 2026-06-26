/** V1.0 mode system: 3 primary modes */
export type AppMode = "learning" | "experiment" | "analysis";
/** Legacy teaching sub-mode (used within the old teaching overlay) */
export type TeachingSubMode = "experiment" | "teaching" | "solving" | "explore";
export interface TeachingOverlayState {
    showKnowledge: boolean;
    showForces: boolean;
    showMotion: boolean;
    showDerivation: boolean;
    showTips: boolean;
    showAnswer: boolean;
    showFormulas: boolean;
}
interface TeachingState {
    /** Primary app mode (V1.0) */
    mode: AppMode;
    /** Legacy teaching sub-mode (for overlay behavior) */
    subMode: TeachingSubMode;
    overlay: TeachingOverlayState;
    setMode: (mode: AppMode) => void;
    setSubMode: (subMode: TeachingSubMode) => void;
    toggleOverlay: (key: keyof TeachingOverlayState) => void;
    getVisibleOverlays: () => (keyof TeachingOverlayState)[];
}
export declare const useTeaching: import("zustand").UseBoundStore<import("zustand").StoreApi<TeachingState>>;
export {};
//# sourceMappingURL=teaching.store.d.ts.map