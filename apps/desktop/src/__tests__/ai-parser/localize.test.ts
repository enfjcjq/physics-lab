import { describe, it, expect } from "vitest";
import { isChinese, localizeScene } from "@physics-lab/ai-parser";
import { ruleParser } from "@physics-lab/ai-parser";
import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";

describe("teaching text localization (S77 方案 a)", () => {
  it("detects Chinese input", () => {
    expect(isChinese("一个小球从高处下落")).toBe(true);
    expect(isChinese("A ball falls from a height")).toBe(false);
  });

  it("translates known phase/event descriptions in place", () => {
    const scene = JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;
    localizeScene(scene);
    const descs = (scene.timeline?.phases ?? []).map((p) => p.description);
    expect(descs).toContain("初始状态：小球静止");
    expect(descs).toContain("重力作用下的匀加速运动");
    expect(descs).toContain("小球落地，实验结束");
  });

  it("parser emits Chinese teaching hints for Chinese problems and English for English", async () => {
    const zh = await ruleParser.parseProblem("一个小球从20米高处自由下落，g=10m/s²，求落地速度。");
    const zhHints = (zh.scene?.overlay_hints?.phase_cards ?? []).map((c) => c.hint ?? "");
    expect(zhHints.some((h) => /[\u4e00-\u9fff]/.test(h))).toBe(true);

    const en = await ruleParser.parseProblem("A ball is dropped from 20 m, g=10. Find the impact velocity.");
    const enHints = (en.scene?.overlay_hints?.phase_cards ?? []).map((c) => c.hint ?? "");
    expect(enHints.some((h) => /[\u4e00-\u9fff]/.test(h))).toBe(false);
  });
});
