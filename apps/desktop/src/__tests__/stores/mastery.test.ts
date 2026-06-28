import { describe, it, expect, beforeEach } from "vitest";
import { useMastery } from "../../renderer/core/mastery.store";

describe("Mastery Store", () => {
  beforeEach(() => {
    useMastery.getState().reset();
  });

  it("should start with empty mastery", () => {
    expect(useMastery.getState().getOverallPercent()).toBe(0);
  });

  it("should mark knowledge point as mastered", () => {
    useMastery.getState().markMastered("kp_free_fall");
    expect(useMastery.getState().isMastered("kp_free_fall")).toBe(true);
    expect(useMastery.getState().getEntry("kp_free_fall")?.mastered).toBe(true);
    expect(useMastery.getState().getEntry("kp_free_fall")?.score).toBe(100);
  });

  it("should calculate mastery percentage", () => {
    const { markMastered, getOverallPercent } = useMastery.getState();
    markMastered("kp1");
    markMastered("kp2");
    markMastered("kp3");
    expect(getOverallPercent()).toBe(100);
  });

  it("should track attempts correctly", () => {
    useMastery.getState().markAttempt("kp1", false);
    useMastery.getState().markAttempt("kp1", false);
    useMastery.getState().markAttempt("kp1", true);
    const entry = useMastery.getState().getEntry("kp1");
    expect(entry?.attempts).toBe(3);
    expect(entry?.correct).toBe(1);
    expect(entry?.score).toBe(33);
    expect(entry?.mastered).toBe(true);
  });

  it("should not mark unknown points as mastered", () => {
    expect(useMastery.getState().isMastered("nonexistent")).toBe(false);
  });

  it("should reset all mastery", () => {
    useMastery.getState().markMastered("kp1");
    useMastery.getState().markMastered("kp2");
    useMastery.getState().reset();
    expect(useMastery.getState().getOverallPercent()).toBe(0);
  });

  it("should return recent activity sorted by time", () => {
    useMastery.getState().markMastered("kp_old");
    useMastery.getState().markMastered("kp_new");
    const recent = useMastery.getState().getRecentActivity(10);
    expect(recent.length).toBeGreaterThanOrEqual(2);
    expect(recent[0].entry.lastAttempted).toBeTruthy();
  });
});
