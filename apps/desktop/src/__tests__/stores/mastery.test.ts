import { describe, it, expect, beforeEach } from "vitest";
import { useMastery } from "../../renderer/core/mastery.store";

describe("Mastery Store", () => {
  beforeEach(() => {
    useMastery.getState().reset();
  });

  it("should start with empty mastery", () => {
    expect(useMastery.getState().getPercent()).toBe(0);
  });

  it("should mark knowledge point as mastered", () => {
    useMastery.getState().markMastered("kp_free_fall");
    expect(useMastery.getState().isMastered("kp_free_fall")).toBe(true);
  });

  it("should calculate mastery percentage", () => {
    const { markMastered, getPercent } = useMastery.getState();
    markMastered("kp1");
    markMastered("kp2");
    markMastered("kp3");
    expect(getPercent()).toBe(100);
  });

  it("should not mark unknown points as mastered", () => {
    expect(useMastery.getState().isMastered("nonexistent")).toBe(false);
  });

  it("should reset all mastery", () => {
    useMastery.getState().markMastered("kp1");
    useMastery.getState().markMastered("kp2");
    useMastery.getState().reset();
    expect(useMastery.getState().getPercent()).toBe(0);
  });
});
