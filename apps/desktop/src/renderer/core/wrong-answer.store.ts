import { create } from "zustand";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";

export interface WrongAnswer {
  id: string;
  pluginId: string;
  questionKey: string;
  userAnswer: number;
  correctAnswer: number;
  timestamp: string;
  reviewed: boolean;
}

const WRONG_KEY = "physics-lab:wrong-answers";

function load(): WrongAnswer[] {
  return loadJSON<WrongAnswer[]>(WRONG_KEY, []);
}

function save(items: WrongAnswer[]): void {
  saveJSON(WRONG_KEY, items);
}

interface WrongAnswerState {
  items: WrongAnswer[];
  record: (pluginId: string, questionKey: string, userAnswer: number, correctAnswer: number) => void;
  markReviewed: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  getByPlugin: (pluginId: string) => WrongAnswer[];
  getUnreviewed: () => WrongAnswer[];
  getCount: () => number;
}

export const useWrongAnswers = create<WrongAnswerState>((set, get) => ({
  items: load(),

  record: (pluginId, questionKey, userAnswer, correctAnswer) => {
    const item: WrongAnswer = {
      id: "wa-" + Date.now(),
      pluginId,
      questionKey,
      userAnswer,
      correctAnswer,
      timestamp: new Date().toISOString(),
      reviewed: false,
    };
    const items = [item, ...get().items].slice(0, 200);
    save(items);
    set({ items });
  },

  markReviewed: (id) => set((s) => {
    const items = s.items.map(function(i) { return i.id === id ? { ...i, reviewed: true } : i; });
    save(items);
    return { items };
  }),

  remove: (id) => set((s) => {
    const items = s.items.filter(function(i) { return i.id !== id; });
    save(items);
    return { items };
  }),

  clearAll: () => {
    removeKey(WRONG_KEY);
    set({ items: [] });
  },

  getByPlugin: (pluginId) => get().items.filter(function(i) { return i.pluginId === pluginId; }),

  getUnreviewed: () => get().items.filter(function(i) { return !i.reviewed; }),

  getCount: () => get().items.length,
}));