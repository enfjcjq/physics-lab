import { create } from "zustand";

export type DockZone = "left" | "right" | "bottom" | "center" | "floating";

export interface PanelConfig {
  id: string;
  titleKey: string;           // i18n key
  defaultZone: DockZone;
  defaultOpen: boolean;
  minWidth?: number;
  minHeight?: number;
  order: number;
}

export interface PanelState {
  isOpen: boolean;
  zone: DockZone;
  floatingPosition?: { x: number; y: number };
  floatingSize?: { width: number; height: number };
}

// ===== Panel Registry =====
const PANEL_DEFS: PanelConfig[] = [
  { id: "problem",   titleKey: "panel.problem",    defaultZone: "left",     defaultOpen: true,  order: 0 },
  { id: "history",   titleKey: "panel.history",    defaultZone: "left",     defaultOpen: true,  order: 1 },
  { id: "parameters",titleKey: "panel.parameters", defaultZone: "left",     defaultOpen: true,  order: 2 },
  { id: "timeline",  titleKey: "panel.timeline",   defaultZone: "bottom",   defaultOpen: true,  order: 0 },
  { id: "charts",    titleKey: "panel.charts",     defaultZone: "bottom",   defaultOpen: true,  order: 1 },
  { id: "analysis",  titleKey: "panel.analysis",   defaultZone: "right",    defaultOpen: true,  order: 0 },
  { id: "teaching",  titleKey: "panel.teaching",   defaultZone: "right",    defaultOpen: false, order: 1 },
  { id: "toolbox",   titleKey: "panel.toolbox",    defaultZone: "floating", defaultOpen: false, order: 0 },
  { id: "properties",titleKey: "panel.properties", defaultZone: "right",    defaultOpen: false, order: 2 },
];

// ===== Store =====
interface PanelManagerState {
  panels: Record<string, PanelState>;
  panelDefs: PanelConfig[];

  toggle: (id: string) => void;
  open: (id: string) => void;
  close: (id: string) => void;
  moveTo: (id: string, zone: DockZone) => void;
  setFloatingPosition: (id: string, pos: { x: number; y: number }) => void;
  setFloatingSize: (id: string, size: { width: number; height: number }) => void;
  getPanelsInZone: (zone: DockZone) => PanelConfig[];
  resetLayout: () => void;
}

function loadLayout(): Record<string, PanelState> | null {
  try {
    const saved = localStorage.getItem("physics-lab-layout");
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveLayout(panels: Record<string, PanelState>): void {
  localStorage.setItem("physics-lab-layout", JSON.stringify(panels));
}

function getDefaultState(): Record<string, PanelState> {
  const state: Record<string, PanelState> = {};
  for (const def of PANEL_DEFS) {
    state[def.id] = {
      isOpen: def.defaultOpen,
      zone: def.defaultZone,
    };
  }
  return state;
}

const saved = loadLayout();
const initialState = saved ?? getDefaultState();

export const usePanelManager = create<PanelManagerState>((set, get) => ({
  panels: initialState,
  panelDefs: PANEL_DEFS,

  toggle: (id) => set((s) => {
    const next = { ...s.panels, [id]: { ...s.panels[id], isOpen: !s.panels[id].isOpen } };
    saveLayout(next);
    return { panels: next };
  }),

  open: (id) => set((s) => {
    const next = { ...s.panels, [id]: { ...s.panels[id], isOpen: true } };
    saveLayout(next);
    return { panels: next };
  }),

  close: (id) => set((s) => {
    const next = { ...s.panels, [id]: { ...s.panels[id], isOpen: false } };
    saveLayout(next);
    return { panels: next };
  }),

  moveTo: (id, zone) => set((s) => {
    const next = { ...s.panels, [id]: { ...s.panels[id], zone } };
    saveLayout(next);
    return { panels: next };
  }),

  setFloatingPosition: (id, pos) => set((s) => ({
    panels: { ...s.panels, [id]: { ...s.panels[id], floatingPosition: pos } },
  })),

  setFloatingSize: (id, size) => set((s) => ({
    panels: { ...s.panels, [id]: { ...s.panels[id], floatingSize: size } },
  })),

  getPanelsInZone: (zone) => {
    const { panels, panelDefs } = get();
    return panelDefs
      .filter((d) => panels[d.id]?.zone === zone && panels[d.id]?.isOpen)
      .sort((a, b) => a.order - b.order);
  },

  resetLayout: () => {
    const def = getDefaultState();
    set({ panels: def });
    saveLayout(def);
  },
}));
