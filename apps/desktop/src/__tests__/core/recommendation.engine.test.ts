import { describe, it, expect } from "vitest";
import { generateRecommendations, type PluginProgress } from "../../renderer/core/recommendation.engine";

const mkPlugin = (id: string, percent: number, difficulty = "easy", kpIds: string[] = []): PluginProgress =>
  ({ id, percent, difficulty, kpIds });

describe("recommendation engine (rule-based)", () => {
  it("brand-new student gets the easiest untouched experiment", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 0,
      plugins: [mkPlugin("pendulum", 0, "medium"), mkPlugin("free-fall", 0, "easy")],
    });
    expect(recs[0].type).toBe("new_start");
    expect(recs[0].pluginId).toBe("free-fall");
  });

  it("unreviewed wrong answers outrank everything", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 3,
      plugins: [mkPlugin("free-fall", 40)],
    });
    expect(recs[0].type).toBe("review_wrong");
    expect(recs[0].priority).toBeLessThan(recs[1]?.priority ?? Infinity);
  });

  it("continue rule picks the experiment closest to completion", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 0,
      plugins: [mkPlugin("a", 40), mkPlugin("b", 70)],
    });
    const cont = recs.find((r) => r.type === "continue");
    expect(cont?.pluginId).toBe("b");
  });

  it("strengthen rule targets the repeatedly-failed knowledge point", () => {
    const recs = generateRecommendations({
      entries: { kp_x: { attempts: 3, score: 30, mastered: false } },
      unreviewedWrong: 0,
      plugins: [mkPlugin("a", 0, "easy", ["kp_x"])],
    });
    const s = recs.find((r) => r.type === "strengthen");
    expect(s?.pluginId).toBe("a");
    expect(s?.weakKpId).toBe("kp_x");
  });

  it("compare-pair rule: studied motor -> recommend comparing with generator", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 0,
      plugins: [mkPlugin("electric_motor", 100), mkPlugin("ac_generator", 0)],
    });
    const pair = recs.find((r) => r.type === "compare_pair");
    expect(pair?.pluginId).toBe("ac_generator");
    expect(pair?.pairWith).toBe("electric_motor");
    // pair recommendation outranks plain new-start for the same companion
    const ns = recs.find((r) => r.type === "new_start");
    expect(pair!.priority).toBeLessThan(ns!.priority);
  });

  it("no compare-pair when companion is already studied too", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 0,
      plugins: [mkPlugin("electric_motor", 100), mkPlugin("ac_generator", 80)],
    });
    expect(recs.find((r) => r.type === "compare_pair")).toBeUndefined();
  });

  it("full mastery -> all_done celebration", () => {
    const recs = generateRecommendations({
      entries: {},
      unreviewedWrong: 0,
      plugins: [mkPlugin("free-fall", 100), mkPlugin("pendulum", 100)],
    });
    expect(recs[0].type).toBe("all_done");
  });
});
