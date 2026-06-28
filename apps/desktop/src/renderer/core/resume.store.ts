import { create } from "zustand";

const RESUME_KEY = "physics-lab:resume";

interface ResumeState {
  pluginId: string | null;
  params: Record<string, number>;
  currentTime: number;
}

function load(): ResumeState | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save(state: ResumeState): void {
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

interface ResumeStoreState {
  state: ResumeState | null;
  saveState: (pluginId: string, params: Record<string, number>, currentTime: number) => void;
  loadState: () => ResumeState | null;
  clearState: () => void;
}

export const useResume = create<ResumeStoreState>(() => ({
  state: load(),
  saveState: (pluginId, params, currentTime) => {
    const s: ResumeState = { pluginId, params, currentTime };
    save(s);
    return s;
  },
  loadState: () => load(),
  clearState: () => {
    localStorage.removeItem(RESUME_KEY);
  },
}));