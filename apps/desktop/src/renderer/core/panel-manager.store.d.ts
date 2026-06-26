export type DockZone = "left" | "right" | "bottom" | "center" | "floating";
export interface PanelConfig {
    id: string;
    titleKey: string;
    defaultZone: DockZone;
    defaultOpen: boolean;
    minWidth?: number;
    minHeight?: number;
    order: number;
}
export interface PanelState {
    isOpen: boolean;
    zone: DockZone;
    floatingPosition?: {
        x: number;
        y: number;
    };
    floatingSize?: {
        width: number;
        height: number;
    };
}
interface PanelManagerState {
    panels: Record<string, PanelState>;
    panelDefs: PanelConfig[];
    toggle: (id: string) => void;
    open: (id: string) => void;
    close: (id: string) => void;
    moveTo: (id: string, zone: DockZone) => void;
    setFloatingPosition: (id: string, pos: {
        x: number;
        y: number;
    }) => void;
    setFloatingSize: (id: string, size: {
        width: number;
        height: number;
    }) => void;
    getPanelsInZone: (zone: DockZone) => PanelConfig[];
    resetLayout: () => void;
}
export declare const usePanelManager: import("zustand").UseBoundStore<import("zustand").StoreApi<PanelManagerState>>;
export {};
//# sourceMappingURL=panel-manager.store.d.ts.map