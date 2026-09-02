import { create } from "zustand";
import type { InputMethod } from "./ui.store";
import { aiRegistry, ruleParser } from "@physics-lab/ai-parser";
import { createVirtualPlugin, hasSimulation } from "@physics-lab/shared";
import { pluginRegistry } from "../core/plugin-registry";
import { ensurePlugin } from "../core/plugin-loader";
import { useSimulation } from "../features/experiment/experiment.store";
import { useAIProviderStore } from "./ai-provider.store";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";
import { polishTeachingScriptWithAI } from "../lib/teaching-script-ai";

const HISTORY_KEY = "physics-lab:history";

// Cloud scenes lack a simulation block; map topic -> closest loadable built-in plugin.
const TOPIC_TO_PLUGIN: Record<string, string> = {
  free_fall: "free-fall",
  projectile: "projectile-motion",
  inclined_plane: "inclined-plane",
  spring: "spring-mass",
  pendulum: "pendulum",
  circular_motion: "circular-motion",
  collision: "collision",
  buoyancy: "buoyancy",
  ohms_law: "ohms_law",
  coulombs_law: "coulombs_law",
  faraday_law: "faraday_law",
  electric_motor: "electric_motor",
  ac_generator: "ac_generator",
  ideal_gas: "ideal_gas",
  refraction: "refraction",
  lens_optics: "lens_optics",
  transverse_wave: "transverse_wave",
  doppler_effect: "doppler_effect",
  longitudinal_wave: "transverse_wave",
  wave: "transverse_wave",
  series: "ohms_law",
  parallel: "ohms_law",
  circuit: "ohms_law",
};

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
        if (hasSimulation(result.scene)) {
          try {
            const virtualPlugin = createVirtualPlugin(result.scene);
            const pluginId = result.scene.metadata.topic ?? "ai-generated";
            // Override the plugin id for registration
            (virtualPlugin as any).id = pluginId;
            pluginRegistry.register(virtualPlugin);
            // Switch to the generated experiment
            await useSimulation.getState().setActivePlugin(pluginId);
            const sim = useSimulation.getState();
            if (!sim.sceneLoaded || sim.phases.length === 0) {
              throw new Error("scene did not load after setActivePlugin: " + pluginId);
            }
          } catch (err) {
            console.error("[Physics Lab] rule scene load failed:", err);
            set({ parseError: "场景加载失败，请从实验库选择。" });
            return null;
          }
        } else {
          // Cloud scene lacks simulation: attach the closest built-in simulation block and load it as a virtual plugin.
          const builtinId = TOPIC_TO_PLUGIN[result.scene.metadata.topic ?? ""];
          if (!builtinId) {
            set({ parseError: "云端场景类型暂不支持，请从实验库选择。" });
            return null;
          }
          try {
            await ensurePlugin(builtinId);
            const builtin = pluginRegistry.get(builtinId);
            const builtinScene = builtin?.getDefaultScene();
            if (!builtinScene || !hasSimulation(builtinScene)) throw new Error("builtin scene lacks simulation: " + builtinId);
            const sceneWithSim = { ...result.scene, simulation: builtinScene.simulation };
            const virtualPlugin = createVirtualPlugin(sceneWithSim as any);
            const pluginId = result.scene.metadata.topic ?? "ai-generated";
            (virtualPlugin as any).id = pluginId;
            pluginRegistry.register(virtualPlugin);
            await useSimulation.getState().setActivePlugin(pluginId);
            const sim = useSimulation.getState();
            if (!sim.sceneLoaded || sim.phases.length === 0) {
              throw new Error("scene did not load after setActivePlugin");
            }
            set({ parseNotice: "home.fallback.no_simulation" });
          } catch (err) {
            console.error("[Physics Lab] cloud scene load failed:", err);
            set({ parseError: "云端场景加载失败，请从实验库选择。" });
            return null;
          }
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

