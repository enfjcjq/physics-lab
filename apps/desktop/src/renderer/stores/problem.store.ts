import { create } from "zustand";
import type { InputMethod } from "./ui.store";
import { aiRegistry, ruleParser } from "@physics-lab/ai-parser";
import { createVirtualPlugin, hasSimulation } from "@physics-lab/shared";
import { pluginRegistry } from "../core/plugin-registry";
import { useSimulation } from "../features/experiment/experiment.store";
import { useAIProviderStore } from "./ai-provider.store";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";
import { polishTeachingScriptWithAI } from "../lib/teaching-script-ai";

const HISTORY_KEY = "physics-lab:history";

// Register the rule parser on first import
if (!aiRegistry.get("rule-based")) {
  aiRegistry.register(ruleParser);
  aiRegistry.setActive("rule-based");
}

interface HistoryItem {
  id: string;
  title: string;
  inputMethod: InputMethod;
  timestamp: number;
  sceneId?: string;
  text?: string;
}

interface ProblemState {
  inputMethod: InputMethod;
  inputText: string;
  isSubmitting: boolean;
  parseError: string | null;
  parseNotice: string | null;
  history: HistoryItem[];
  setInputMethod: (m: InputMethod) => void;
  setInputText: (t: string) => void;
  submit: () => Promise<import("@physics-lab/shared").PhysicsScene | null>;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export const useProblemStore = create<ProblemState>((set, get) => ({
  inputMethod: "text",
  inputText: "",
  isSubmitting: false,
  parseError: null,
  parseNotice: null,
  history: loadJSON<HistoryItem[]>(HISTORY_KEY, []),
  setInputMethod: (inputMethod) => set({ inputMethod }),
  setInputText: (inputText) => set({ inputText }),
  submit: async () => {
    const { inputText } = get();
    set({ isSubmitting: true, parseError: null, parseNotice: null });

    try {
      const result = await useAIProviderStore.getState().parseWithActive(inputText);
      const fallback = useAIProviderStore.getState().lastFallback;
      set({ isSubmitting: false, parseNotice: fallback ? "home.fallback." + fallback : null });

      if (result.success && result.scene) {
        // Add to history
        const title = result.scene.metadata.title || inputText.slice(0, 40);
        get().addToHistory({
          id: "h" + Date.now(),
          title,
          inputMethod: get().inputMethod,
          timestamp: Date.now(),
          text: inputText.slice(0, 500),
        });
        // S75: AI polish of the teaching script (seamless fallback to rule version)
        if (result.scene) await polishTeachingScriptWithAI(result.scene);
        // If scene has simulation block, register as virtual plugin
        if (hasSimulation(result.scene)) {
          const virtualPlugin = createVirtualPlugin(result.scene);
          const pluginId = result.scene.metadata.topic ?? "ai-generated";
          // Override the plugin id for registration
          (virtualPlugin as any).id = pluginId;
          pluginRegistry.register(virtualPlugin);
          // Switch to the generated experiment
          useSimulation.getState().setActivePlugin(pluginId);
        }
        return result.scene;
      } else {
        set({ parseError: result.error || "Failed to parse problem", parseNotice: null });
        return null;
      }
    } catch (e: any) {
      set({ isSubmitting: false, parseError: e?.message || "Parse error" });
      return null;
    }
  },
  addToHistory: (item) => set((s) => {
    const history = [item, ...s.history].slice(0, 50);
    saveJSON(HISTORY_KEY, history);
    return { history };
  }),
  clearHistory: () => {
    removeKey(HISTORY_KEY);
    set({ history: [] });
  },
}));

