import { create } from "zustand";
import type { InputMethod } from "./ui.store";
import { aiRegistry, ruleParser } from "@physics-lab/ai-parser";

// Register the rule parser on first import
if (!aiRegistry.get("rule-parser")) {
  aiRegistry.register(ruleParser);
  aiRegistry.setActive("rule-parser");
}

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
  parseError: string | null;
  history: HistoryItem[];
  setInputMethod: (m: InputMethod) => void;
  setInputText: (t: string) => void;
  submit: () => Promise<import("@physics-lab/shared").PhysicsScene | null>;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: "h1", title: "Free Fall (10m)", inputMethod: "text", timestamp: Date.now() - 86400000 },
  { id: "h2", title: "Free Fall (20m)", inputMethod: "text", timestamp: Date.now() - 172800000 },
];

export const useProblemStore = create<ProblemState>((set, get) => ({
  inputMethod: "text",
  inputText: "A 2kg ball is dropped from a height of 10m. Ignore air resistance, g=10m/s^2. Find impact time and velocity.",
  isSubmitting: false,
  parseError: null,
  history: MOCK_HISTORY,
  setInputMethod: (inputMethod) => set({ inputMethod }),
  setInputText: (inputText) => set({ inputText }),
  submit: async () => {
    const { inputText } = get();
    set({ isSubmitting: true, parseError: null });

    const provider = aiRegistry.getActive();
    if (!provider) {
      set({ isSubmitting: false, parseError: "No AI provider available" });
      return null;
    }

    try {
      const result = await provider.parseProblem(inputText);
      set({ isSubmitting: false });

      if (result.success && result.scene) {
        // Add to history
        const title = result.scene.metadata.title || inputText.slice(0, 40);
        get().addToHistory({
          id: "h" + Date.now(),
          title,
          inputMethod: "text",
          timestamp: Date.now(),
        });
        return result.scene;
      } else {
        set({ parseError: result.error || "Failed to parse problem" });
        return null;
      }
    } catch (e: any) {
      set({ isSubmitting: false, parseError: e?.message || "Parse error" });
      return null;
    }
  },
  addToHistory: (item) => set((s) => ({ history: [item, ...s.history].slice(0, 50) })),
  clearHistory: () => set({ history: [] }),
}));
