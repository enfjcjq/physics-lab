import { describe, it, expect } from "vitest";
import { OHMS_LAW_SCENE, FREE_FALL_SCENE } from "@physics-lab/shared";
import type { PhysicsScene, OverlayHints } from "@physics-lab/shared";
import { fixColloquialEntities } from "../../renderer/lib/teaching-script-ai";

const ohms = JSON.parse(JSON.stringify(OHMS_LAW_SCENE)) as PhysicsScene;
const freeFall = JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;

describe("fixColloquialEntities (S79 post-processing)", () => {
  it("replaces 小球 with the entity display name (Electron Flow -> 电子流)", () => {
    const hints: OverlayHints = {
      phase_cards: [{ phase_id: "circuit_on", hint: "观察电流通过小球时的变化" }],
      event_pulses: [{ event_id: "x", text_override: "小球经过终点" }],
    };
    const fixed = fixColloquialEntities(ohms, hints);
    expect(fixed.phase_cards?.[0].hint).toBe("观察电流通过电子流时的变化");
    expect(fixed.event_pulses?.[0].text_override).toBe("电子流经过终点");
  });

  it("keeps 小球 for genuine ball scenes (no-op)", () => {
    const hints: OverlayHints = { phase_cards: [{ phase_id: "release", hint: "观察小球静止" }] };
    const fixed = fixColloquialEntities(freeFall, hints);
    expect(fixed.phase_cards?.[0].hint).toBe("观察小球静止");
  });

  it("leaves hints without colloquial terms untouched", () => {
    const hints: OverlayHints = { phase_cards: [{ phase_id: "s", hint: "注意电压和阻值的关系" }] };
    const fixed = fixColloquialEntities(ohms, hints);
    expect(fixed.phase_cards?.[0].hint).toBe("注意电压和阻值的关系");
  });
});
