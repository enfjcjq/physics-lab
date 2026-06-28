import { describe, it, expect } from "vitest";
import { useMastery } from "../../renderer/core/mastery.store";
import { pluginRegistry } from "../../renderer/core/plugin-registry";
import { freeFallPlugin } from "../../renderer/plugins/free-fall/free-fall.plugin";

describe("Mastery + Plugin Integration", () => {
  it("should track mastery for plugin knowledge points", () => {
    useMastery.getState().reset();
    if (!pluginRegistry.get("free-fall")) pluginRegistry.register(freeFallPlugin);

    const plugin = pluginRegistry.get("free-fall");
    const kps = plugin?.getKnowledgePoints() || [];

    kps.forEach(kp => useMastery.getState().markMastered(kp.id));

    kps.forEach(kp => {
      expect(useMastery.getState().isMastered(kp.id)).toBe(true);
    });

    expect(useMastery.getState().getOverallPercent()).toBe(100);
  });

  it("should track partial mastery", () => {
    useMastery.getState().reset();
    useMastery.getState().markMastered("kp1");
    useMastery.getState().markMastered("kp2");
    expect(useMastery.getState().isMastered("kp3")).toBe(false);
  });

  it("should return all mastery entries", () => {
    useMastery.getState().reset();
    useMastery.getState().markMastered("test_kp");
    const all = useMastery.getState().getAll();
    expect(all["test_kp"]).toBeDefined();
    expect(all["test_kp"].mastered).toBe(true);
    expect(all["test_kp"].score).toBe(100);
  });
});
