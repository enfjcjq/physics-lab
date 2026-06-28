import { create } from "zustand";
import { aiRegistry, ruleParser, OllamaProvider } from "@physics-lab/ai-parser";
import type { AIProvider } from "@physics-lab/ai-parser";

// Eagerly register rule parser
if (!aiRegistry.get("rule-based")) {
  aiRegistry.register(ruleParser);
  aiRegistry.setActive("rule-based");
}

// Lazily register Ollama on first access
let ollamaProvider: OllamaProvider | null = null;
function getOllamaProvider(): OllamaProvider {
  if (!ollamaProvider) {
    ollamaProvider = new OllamaProvider();
    if (!aiRegistry.get("ollama")) {
      aiRegistry.register(ollamaProvider);
    }
  }
  return ollamaProvider;
}

export type AIProviderId = "rule-based" | "ollama";

interface AIProviderState {
  activeId: AIProviderId;
  ollamaAvailable: boolean | null; // null = not checked yet
  isChecking: boolean;
  setActive: (id: AIProviderId) => void;
  checkOllama: () => Promise<void>;
  getProviders: () => Array<{ id: string; name: string; available: boolean | null }>;
  parseWithActive: (text: string) => Promise<import("@physics-lab/ai-parser").ParseResult>;
}

export const useAIProviderStore = create<AIProviderState>((set, get) => ({
  // Auto-detect Ollama on first access
  _init: (() => { setTimeout(() => get().checkOllama(), 2000); })(),
  activeId: "rule-based",
  ollamaAvailable: null,
  isChecking: false,

  setActive: (id) => {
    if (id === "ollama") {
      getOllamaProvider(); // Register if not already
    }
    aiRegistry.setActive(id);
    set({ activeId: id });
  },

  checkOllama: async () => {
    set({ isChecking: true });
    try {
      const provider = getOllamaProvider();
      const available = await provider.isAvailable();
      set({ ollamaAvailable: available, isChecking: false });
    } catch {
      set({ ollamaAvailable: false, isChecking: false });
    }
  },

  getProviders: () => {
    const providers = aiRegistry.list();
    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      available: p.id === "rule-based" ? true : get().ollamaAvailable,
    }));
  },

  parseWithActive: async (text) => {
    const provider = aiRegistry.getActive();
    if (!provider) {
      return { scene: null, success: false, error: "No AI provider selected", provider: "none", durationMs: 0 };
    }
    return provider.parseProblem(text);
  },
}));
