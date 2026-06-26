import { create } from "zustand";
import type { InputMethod } from "./ui.store";

interface HistoryItem {
  id: string;
  title: string;
  inputMethod: InputMethod;
  timestamp: number;
  sceneId?: string;
}

interface ProblemState {
  inputMethod: InputMethod;
  inputText: string;
  isSubmitting: boolean;
  history: HistoryItem[];
  setInputMethod: (m: InputMethod) => void;
  setInputText: (t: string) => void;
  submit: () => void;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: "h1", title: "Free Fall (10m)", inputMethod: "text", timestamp: Date.now() - 86400000 },
  { id: "h2", title: "Free Fall (20m)", inputMethod: "text", timestamp: Date.now() - 172800000 },
  { id: "h3", title: "Inclined Plane Problem", inputMethod: "image", timestamp: Date.now() - 259200000 },
];

export const useProblemStore = create<ProblemState>((set) => ({
  inputMethod: "text",
  inputText: "A 2kg ball is dropped from a height of 10m. Ignore air resistance, g=10m/s^2. Find: (1) impact time; (2) impact velocity.",
  isSubmitting: false,
  history: MOCK_HISTORY,
  setInputMethod: (inputMethod) => set({ inputMethod }),
  setInputText: (inputText) => set({ inputText }),
  submit: () => {
    set({ isSubmitting: true });
    setTimeout(() => set({ isSubmitting: false }), 800);
  },
  addToHistory: (item) => set((s) => ({ history: [item, ...s.history].slice(0, 50) })),
  clearHistory: () => set({ history: [] }),
}));
