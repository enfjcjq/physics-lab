import { describe, it, expect, beforeEach } from "vitest";
import { useAIProviderStore } from "../../renderer/stores/ai-provider.store";

describe("AI Provider Store", () => {
  beforeEach(() => {
    useAIProviderStore.setState({
      activeId: "rule-based",
      ollamaAvailable: null,
      isChecking: false,
    });
  });

  it("should start with rule-based as default", () => {
    expect(useAIProviderStore.getState().activeId).toBe("rule-based");
  });

  it("should switch providers", () => {
    useAIProviderStore.getState().setActive("ollama");
    expect(useAIProviderStore.getState().activeId).toBe("ollama");
    useAIProviderStore.getState().setActive("rule-based");
    expect(useAIProviderStore.getState().activeId).toBe("rule-based");
  });

  it("should list all providers", () => {
    const providers = useAIProviderStore.getState().getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(2);
    expect(providers.find(p => p.id === "rule-based")).toBeDefined();
    expect(providers.find(p => p.id === "ollama")).toBeDefined();
  });

  it("should parse free-fall problem", async () => {
    const result = await useAIProviderStore.getState().parseWithActive(
      "A 2kg ball falls from 10m. Find impact time."
    );
    expect(result.success).toBe(true);
    expect(result.scene).not.toBeNull();
    expect(result.scene?.metadata?.topic).toBeDefined();
  });

  it("should handle empty input", async () => {
    const result = await useAIProviderStore.getState().parseWithActive("");
    expect(result).toHaveProperty("success");
  });
});
