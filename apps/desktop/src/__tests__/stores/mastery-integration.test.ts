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

    // Mark all as mastered
    kps.forEach(kp => useMastery.getState().markMastered(kp.id));

    // Verify all marked
    kps.forEach(kp => {
      expect(useMastery.getState().isMastered(kp.id)).toBe(true);
    });

    // Verify percentage
    expect(useMastery.getState().getPercent()).toBe(100);
  });

  it("should track partial mastery", () => {
    useMastery.getState().reset();
    useMastery.getState().markMastered("kp1");
    useMastery.getState().markMastered("kp2");
    // kp3 not mastered
    expect(useMastery.getState().isMastered("kp3")).toBe(false);
  });

  it("should return all mastery entries", () => {
    useMastery.getState().reset();
    useMastery.getState().markMastered("test_kp");
    const all = useMastery.getState().getAll();
    expect(all["test_kp"]).toBe(true);
  });
});
