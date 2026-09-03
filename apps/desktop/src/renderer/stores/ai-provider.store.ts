import { create } from "zustand";
import { aiRegistry, ruleParser, OllamaProvider, CloudProvider } from "@physics-lab/ai-parser";
import type { AIProvider, ParseResult } from "@physics-lab/ai-parser";
import { loadJSON, saveJSON } from "../lib/storage";

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
    if (!aiRegistry.get("ollama")) aiRegistry.register(ollamaProvider);
  }
  return ollamaProvider;
}

// Cloud provider (S85, DD-002): configurable OpenAI-compatible endpoint
const CLOUD_KEY = "physics-lab:cloud-ai";
export interface CloudConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}
const CLOUD_DEFAULTS: CloudConfig = { baseUrl: "https://api.openai.com/v1", apiKey: "", model: "deepseek-chat" };
const savedCloud = loadJSON<CloudConfig | null>(CLOUD_KEY, null);

let cloudProvider: CloudProvider | null = null;
function getCloudProvider(): CloudProvider {
  if (!cloudProvider) {
    const cfg = savedCloud ?? CLOUD_DEFAULTS;
    cloudProvider = new CloudProvider(cfg);
    if (!aiRegistry.get("cloud")) aiRegistry.register(cloudProvider);
  }
  return cloudProvider;
}

export type ProviderPreference = "auto" | "cloud" | "local";
export type AICloudState = "checking" | "online" | "offline" | "unconfigured";

interface AIProviderState {
  activeId: string;
  ollamaAvailable: boolean | null;
  cloudAvailable: AICloudState;
  isChecking: boolean;
  preference: ProviderPreference;
  cloudConfig: CloudConfig;
  lastResult: ParseResult | null;
  lastFallback: "cloud" | "local" | null;
  lastCloudError: string | null;
  setActive: (id: string) => void;
  checkOllama: () => Promise<void>;
  checkCloud: () => Promise<void>;
  setCloudConfig: (cfg: CloudConfig) => void;
  hydrateCloudSettings: () => Promise<void>;
  setPreference: (p: ProviderPreference) => void;
  getProviders: () => Array<{ id: string; name: string; available: boolean | null }>;
  parseWithActive: (text: string) => Promise<ParseResult>;
}

function resolveProvider(s: AIProviderState): AIProvider {
  // preference: cloud -> cloud if available; local -> ollama if available else rule; auto -> cloud > ollama > rule
  const preferCloud = s.preference === "cloud" || (s.preference === "auto" && s.cloudAvailable === "online");
  if (preferCloud) {
    const c = aiRegistry.get("cloud");
    if (c) return c;
  }
  const preferLocal = s.preference === "local" || (s.preference === "auto" && s.cloudAvailable !== "online");
  if (preferLocal && s.ollamaAvailable) {
    const o = aiRegistry.get("ollama");
    if (o) return o;
  }
  return aiRegistry.get("rule-based") ?? ruleParser;
}

export const useAIProviderStore = create<AIProviderState>((set, get) => ({
  _init: (() => { setTimeout(() => { get().checkOllama(); get().checkCloud(); get().hydrateCloudSettings(); }, 1500); })(),
  activeId: "rule-based",
  ollamaAvailable: null,
  cloudAvailable: savedCloud?.apiKey ? ("checking" as AICloudState) : ("unconfigured" as AICloudState),
  isChecking: false,
  preference: "auto",
  cloudConfig: savedCloud ?? CLOUD_DEFAULTS,
  lastResult: null,
  lastFallback: null,
  lastCloudError: null,

  setActive: (id) => {
    if (id === "ollama") getOllamaProvider();
    if (id === "cloud") getCloudProvider();
    aiRegistry.setActive(id);
    set({ activeId: id });
  },

  checkOllama: async () => {
    const provider = getOllamaProvider();
    const available = await provider.isAvailable();
    if (available) provider.warmUp().catch(() => {});
    set({ ollamaAvailable: available });
  },

  checkCloud: async () => {
    const cfg = get().cloudConfig;
    if (!cfg.apiKey) { set({ cloudAvailable: "unconfigured" }); return; }
    set({ cloudAvailable: "checking" });
    const provider = getCloudProvider();
    const ok = await provider.isAvailable();
    set({ cloudAvailable: ok ? "online" : "offline" });
  },

  setCloudConfig: (cfg) => {
    const next = { ...CLOUD_DEFAULTS, ...cfg };
    saveJSON(CLOUD_KEY, next);
    // P1-C follow-up: persist through the main process file too (survives localStorage flush loss on force-kill).
    (window as any).physicsLab?.settings?.write(next).catch(() => {});
    cloudProvider = new CloudProvider(next);
    if (!aiRegistry.get("cloud")) aiRegistry.register(cloudProvider);
    set({ cloudConfig: next, cloudAvailable: next.apiKey ? "checking" : "unconfigured" });
    get().checkCloud();
  },

  setPreference: (preference) => set({ preference }),

  getProviders: () => {
    const providers = aiRegistry.list();
    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      available: p.id === "rule-based" ? true : p.id === "ollama" ? get().ollamaAvailable : get().cloudAvailable === "online",
    }));
  },

  hydrateCloudSettings: async () => {
    try {
      const saved = await (window as any).physicsLab?.settings?.read();
      if (saved && typeof saved === "object" && (saved as any).apiKey) {
        const cfg = { ...CLOUD_DEFAULTS, ...(saved as CloudConfig) };
        cloudProvider = new CloudProvider(cfg);
        if (!aiRegistry.get("cloud")) aiRegistry.register(cloudProvider);
        saveJSON(CLOUD_KEY, cfg);
        set({ cloudConfig: cfg, cloudAvailable: "checking" });
        get().checkCloud();
      }
    } catch {
      // settings.json not available yet (dev/browser fallback)
    }
  },

  parseWithActive: async (text) => {
    const preferred = resolveProvider(get());
    let result = await preferred.parseProblem(text);
    let lastFallback: "cloud" | "local" | null = null;
    let lastCloudError: string | null = null;
    // Preserve the remote failure reason before the rule fallback overwrites it.
    if (!result.success && preferred.id === "cloud") {
      lastCloudError = result.error ?? "unknown";
      console.warn("[CloudProvider] parse failed:", lastCloudError);
    }
    // Honest fallback: if a remote provider had a TECHNICAL failure, switch to the rule parser.
    // A content rejection (rejected=true) is the correct answer and must NOT be overridden.
    if (!result.success && preferred.id !== "rule-based" && !result.rejected) {
      const rule = aiRegistry.get("rule-based") ?? ruleParser;
      const ruleResult = await rule.parseProblem(text);
      if (ruleResult.success) {
        lastFallback = preferred.id === "cloud" ? "cloud" : "local";
        result = ruleResult;
      } else {
        result = ruleResult;
      }
    }
    set({ lastResult: result, activeId: result.provider, lastFallback, lastCloudError });
    return result;
  },
}));
