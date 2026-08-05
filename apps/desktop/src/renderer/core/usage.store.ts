import { create } from "zustand";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";

// ============================================================
// S77: lightweight usage telemetry (P2 second-step verification).
// Local-only (localStorage), no backend, no UI exposure.
//  - IconRail four drawer icons: click counts
//  - core path: home -> teaching animation plays (click count)
// Exportable from the MenuBar for walkthroughs (dev/owner only).
// ============================================================

const USAGE_KEY = "physics-lab:usage";

export interface UsageSnapshot {
  iconClicks: Record<string, number>;
  corePathClicks: number;
  updatedAt: number;
}

const EMPTY: UsageSnapshot = { iconClicks: {}, corePathClicks: 0, updatedAt: 0 };

interface UsageState {
  data: UsageSnapshot;
  incrementIcon: (id: string) => void;
  incrementCorePath: () => void;
  snapshot: () => UsageSnapshot;
  exportData: () => void;
  reset: () => void;
}

export const useUsage = create<UsageState>((set, get) => ({
  data: loadJSON<UsageSnapshot>(USAGE_KEY, EMPTY),

  incrementIcon: (id) => {
    const data: UsageSnapshot = {
      ...get().data,
      iconClicks: { ...get().data.iconClicks, [id]: (get().data.iconClicks[id] ?? 0) + 1 },
      updatedAt: Date.now(),
    };
    saveJSON(USAGE_KEY, data);
    set({ data });
  },

  incrementCorePath: () => {
    const data: UsageSnapshot = {
      ...get().data,
      corePathClicks: get().data.corePathClicks + 1,
      updatedAt: Date.now(),
    };
    saveJSON(USAGE_KEY, data);
    set({ data });
  },

  snapshot: () => get().data,

  exportData: () => {
    const payload = JSON.stringify({ ...get().data, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "physics-lab-usage.json";
    a.click();
    URL.revokeObjectURL(url);
  },

  reset: () => {
    removeKey(USAGE_KEY);
    set({ data: { ...EMPTY } });
  },
}));
