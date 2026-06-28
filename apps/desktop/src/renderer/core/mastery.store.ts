import { create } from "zustand";

const MASTERY_KEY = "physics-lab:mastery-v2";

export interface MasteryEntry {
  mastered: boolean;
  attempts: number;
  correct: number;
  lastAttempted: string | null;
  lastMastered: string | null;
  score: number;
}

interface MasteryState {
  entries: Record<string, MasteryEntry>;
  markAttempt: (kpId: string, correct: boolean) => void;
  markMastered: (kpId: string) => void;
  isMastered: (kpId: string) => boolean;
  getEntry: (kpId: string) => MasteryEntry | undefined;
  getOverallPercent: () => number;
  getByPlugin: (kpIds: string[]) => { total: number; mastered: number; percent: number };
  getRecentActivity: (limit?: number) => Array<{ kpId: string; entry: MasteryEntry }>;
  getAll: () => Record<string, MasteryEntry>;
  reset: () => void;
}

function load(): Record<string, MasteryEntry> {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Migrate from v1 (boolean values)
    const migrated: Record<string, MasteryEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") {
        migrated[k] = { mastered: v, attempts: v ? 1 : 0, correct: v ? 1 : 0, lastAttempted: null, lastMastered: null, score: v ? 100 : 0 };
      } else {
        migrated[k] = v as MasteryEntry;
      }
    }
    return migrated;
  } catch { return {}; }
}

function save(m: Record<string, MasteryEntry>): void {
  try { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); } catch { /* quota */ }
}

export const useMastery = create<MasteryState>((set, get) => ({
  entries: load(),

  markAttempt: (kpId, correct) => set((s) => {
    const prev = s.entries[kpId] ?? { mastered: false, attempts: 0, correct: 0, lastAttempted: null, lastMastered: null, score: 0 };
    const now = new Date().toISOString();
    const next: MasteryEntry = {
      mastered: correct || prev.mastered,
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      lastAttempted: now,
      lastMastered: correct || prev.mastered ? now : prev.lastMastered,
      score: Math.round(((prev.correct + (correct ? 1 : 0)) / (prev.attempts + 1)) * 100),
    };
    const entries = { ...s.entries, [kpId]: next };
    save(entries);
    return { entries };
  }),

  markMastered: (kpId) => get().markAttempt(kpId, true),

  isMastered: (kpId) => get().entries[kpId]?.mastered === true,

  getEntry: (kpId) => get().entries[kpId],

  getOverallPercent: () => {
    const e = get().entries;
    const ids = Object.keys(e);
    return ids.length > 0 ? Math.round((ids.filter((id) => e[id].mastered).length / ids.length) * 100) : 0;
  },

  getByPlugin: (kpIds) => {
    const e = get().entries;
    const total = kpIds.length;
    const mastered = kpIds.filter((id) => e[id]?.mastered).length;
    return { total, mastered, percent: total > 0 ? Math.round((mastered / total) * 100) : 0 };
  },

  getRecentActivity: (limit = 10) => {
    return Object.entries(get().entries)
      .filter(([, v]) => v.lastAttempted)
      .sort((a, b) => new Date(b[1].lastAttempted!).getTime() - new Date(a[1].lastAttempted!).getTime())
      .slice(0, limit)
      .map(([kpId, entry]) => ({ kpId, entry }));
  },

  getAll: () => get().entries,

  reset: () => { localStorage.removeItem(MASTERY_KEY); set({ entries: {} }); },
}));
