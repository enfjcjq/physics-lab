import { create } from "zustand";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";

const RESUME_KEY = "physics-lab:resume";

interface ResumeState {
  pluginId: string | null;
  params: Record<string, number>;
  currentTime: number;
}

function load(): ResumeState | null {
  return loadJSON<ResumeState | null>(RESUME_KEY, null);
}

function save(state: ResumeState): void {
  saveJSON(RESUME_KEY, state);
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
    removeKey(RESUME_KEY);
  },
}));