import { describe, it, expect } from "vitest";
import { FREE_FALL_SCENE } from "@physics-lab/shared";
import type { PhysicsScene, OverlayHints } from "@physics-lab/shared";
import {
  mergeAiHints,
  extractAiHintsJson,
  polishTeachingScriptWithAI,
} from "../../renderer/lib/teaching-script-ai";
import {
  getPhaseCardData,
  getFormulaStripData,
  getForceCalloutData,
  getPulsableEvents,
  getEventPulseText,
} from "../../renderer/features/experiment/components/teaching/teaching-layer-data";
import { generateTeachingScript } from "@physics-lab/shared";

const scene = JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;
const ruleHints = generateTeachingScript(scene);

describe("mergeAiHints", () => {
  it("keeps rule groups when AI omits them", () => {
    const merged = mergeAiHints(ruleHints, { force_callouts: [] });
    expect(merged.phase_cards).toEqual(ruleHints.phase_cards);
    expect(merged.formula_strips).toEqual(ruleHints.formula_strips);
    expect(merged.force_callouts).toEqual([]);
  });

  it("never lets AI edit formula_strips (teaching red line)", () => {
    const ai = { formula_strips: [{ phase_id: "release", equation_id: "eq_velocity" }] } as OverlayHints;
    const merged = mergeAiHints(ruleHints, ai);
    expect(merged.formula_strips).toEqual(ruleHints.formula_strips);
  });

  it("returns rule hints on null AI input", () => {
    expect(mergeAiHints(ruleHints, null)).toEqual(ruleHints);
    expect(mergeAiHints(ruleHints, undefined)).toEqual(ruleHints);
  });
});

describe("extractAiHintsJson", () => {
  it("parses plain JSON and markdown fenced JSON", () => {
    const obj = extractAiHintsJson('{"force_callouts":[]}');
    expect(obj?.force_callouts).toEqual([]);
    const fenced = extractAiHintsJson('```json\n{"event_pulses":[]}\n```');
    expect(fenced?.event_pulses).toEqual([]);
  });

  it("returns null for garbage", () => {
    expect(extractAiHintsJson("")).toBeNull();
    expect(extractAiHintsJson("not json at all")).toBeNull();
    expect(extractAiHintsJson("{broken")).toBeNull();
  });
});

describe("polishTeachingScriptWithAI", () => {
  const mock = (gen: (p: string) => Promise<string | null>) => ({ generate: gen }) as never;

  it("falls back seamlessly when the model returns nothing (offline/timeout)", async () => {
    const input = JSON.parse(JSON.stringify(scene)) as PhysicsScene;
    input.overlay_hints = ruleHints;
    const out = await polishTeachingScriptWithAI(input, mock(async () => null));
    expect(out.overlay_hints).toEqual(ruleHints);
  });

  it("applies valid AI copy polish", async () => {
    const input = JSON.parse(JSON.stringify(scene)) as PhysicsScene;
    input.overlay_hints = ruleHints;
    const phaseId = ruleHints.phase_cards?.[0]?.phase_id;
    const aiJson = JSON.stringify({ phase_cards: [{ phase_id: phaseId, hint: "观察小球下落轨迹" }] });
    const out = await polishTeachingScriptWithAI(input, mock(async () => aiJson));
    expect(out.overlay_hints?.phase_cards?.[0]?.hint).toBe("观察小球下落轨迹");
  });

  it("falls back to rule version when AI output fails validation (dangling id)", async () => {
    const input = JSON.parse(JSON.stringify(scene)) as PhysicsScene;
    input.overlay_hints = ruleHints;
    const aiJson = JSON.stringify({ phase_cards: [{ phase_id: "does-not-exist", hint: "x" }] });
    const out = await polishTeachingScriptWithAI(input, mock(async () => aiJson));
    expect(out.overlay_hints).toEqual(ruleHints);
  });

  it("respects AI toggling a template off (empty force_callouts)", async () => {
    const input = JSON.parse(JSON.stringify(scene)) as PhysicsScene;
    input.overlay_hints = ruleHints;
    const out = await polishTeachingScriptWithAI(input, mock(async () => '{"force_callouts":[]}'));
    expect(out.overlay_hints?.force_callouts).toEqual([]);
  });

  it("falls back on garbage AI response", async () => {
    const input = JSON.parse(JSON.stringify(scene)) as PhysicsScene;
    input.overlay_hints = ruleHints;
    const out = await polishTeachingScriptWithAI(input, mock(async () => "I like physics"));
    expect(out.overlay_hints).toEqual(ruleHints);
  });
});

describe("empty-array template toggle (renderer data layer)", () => {
  const withHints = (h: OverlayHints): PhysicsScene => ({ ...scene, overlay_hints: h });

  it("phase_cards: [] disables the PhaseCard", () => {
    expect(getPhaseCardData(withHints({ phase_cards: [] }), 0.5)).toBeNull();
    expect(getPhaseCardData(scene, 0.5)).not.toBeNull(); // rule version still shows
  });

  it("formula_strips: [] disables the FormulaStrip", () => {
    expect(getFormulaStripData(withHints({ formula_strips: [] }), 0.5)).toBeNull();
  });

  it("force_callouts: [] shows no force annotations", () => {
    const { callouts, hidden } = getForceCalloutData(withHints({ force_callouts: [] }), 0.5);
    expect(callouts.length).toBe(0);
    expect(hidden).toBe(0);
  });

  it("event_pulses: [] disables pulses and event text", () => {
    const noPulses = withHints({ event_pulses: [] });
    expect(getPulsableEvents(noPulses).length).toBe(0);
    // FREE_FALL has a collision event at 1.43
    expect(getEventPulseText(noPulses, 1.5)).toBeNull();
  });
});
