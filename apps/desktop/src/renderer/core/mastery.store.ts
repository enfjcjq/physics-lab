import { create } from "zustand";

const MASTERY_KEY = "physics-lab:mastery";

function loadMastery(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMastery(m: Record<string, boolean>): void {
  try { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

interface MasteryState {
  mastery: Record<string, boolean>;
  markMastered: (kpId: string) => void;
  isMastered: (kpId: string) => boolean;
  getPercent: () => number;
  getAll: () => Record<string, boolean>;
  reset: () => void;
}

export const useMastery = create<MasteryState>((set, get) => ({
  mastery: loadMastery(),
  markMastered: (kpId) => set((s) => {
    const next = { ...s.mastery, [kpId]: true };
    saveMastery(next);
    return { mastery: next };
  }),
  isMastered: (kpId) => get().mastery[kpId] === true,
  getPercent: () => {
    const m = get().mastery;
    const vals = Object.values(m);
    return vals.length > 0 ? (vals.filter(Boolean).length / vals.length) * 100 : 0;
  },
  getAll: () => get().mastery,
  reset: () => { localStorage.removeItem(MASTERY_KEY); set({ mastery: {} }); },
}));
