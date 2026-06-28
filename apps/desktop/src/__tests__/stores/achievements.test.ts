import { describe, it, expect, beforeEach } from "vitest";
import { useAchievements } from "../../renderer/core/achievements.store";

describe("Achievement Store", () => {
  beforeEach(() => {
    useAchievements.getState().reset();
  });

  it("should start with all badges locked", () => {
    const all = useAchievements.getState().getAll();
    expect(all.length).toBe(7);
    expect(all.every(function(a) { return !a.unlocked; })).toBe(true);
  });

  it("should have 7 badge definitions", () => {
    const all = useAchievements.getState().getAll();
    expect(all.length).toBe(7);
    expect(all.map(function(a) { return a.id; })).toContain("first_correct");
    expect(all.map(function(a) { return a.id; })).toContain("perfect_experiment");
    expect(all.map(function(a) { return a.id; })).toContain("all_experiments");
  });

  it("should return empty unlocked list initially", () => {
    expect(useAchievements.getState().getUnlocked().length).toBe(0);
  });

  it("should reset all badges", () => {
    useAchievements.getState().check();
    useAchievements.getState().reset();
    expect(useAchievements.getState().getUnlocked().length).toBe(0);
  });
});