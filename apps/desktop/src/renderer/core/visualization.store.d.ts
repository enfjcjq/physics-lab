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
export declare const useVisualization: import("zustand").UseBoundStore<import("zustand").StoreApi<VisState>>;
export {};
//# sourceMappingURL=visualization.store.d.ts.map