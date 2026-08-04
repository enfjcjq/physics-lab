import { describe, it, expect } from "vitest";
import {
  generateTeachingScript,
  validateTeachingScript,
  ensureTeachingScript,
  FREE_FALL_SCENE,
  PROJECTILE_MOTION_SCENE,
  INCLINED_PLANE_SCENE,
  COLLISION_SCENE,
  SPRING_MASS_SCENE,
  PENDULUM_SCENE,
  CIRCULAR_MOTION_SCENE,
  BUOYANCY_SCENE,
  OHMS_LAW_SCENE,
  WAVE_SCENE,
  COULOMB_SCENE,
  REFRACTION_SCENE,
  DOPPLER_SCENE,
  FARADAY_SCENE,
  MOTOR_SCENE,
  IDEAL_GAS_SCENE,
  LENS_OPTICS_SCENE,
  AC_GENERATOR_SCENE,
} from "@physics-lab/shared";
import type { PhysicsScene } from "@physics-lab/shared";
import { ruleParser } from "@physics-lab/ai-parser";

const ALL_SCENES = [
  FREE_FALL_SCENE, PROJECTILE_MOTION_SCENE, INCLINED_PLANE_SCENE, COLLISION_SCENE,
  SPRING_MASS_SCENE, PENDULUM_SCENE, CIRCULAR_MOTION_SCENE, BUOYANCY_SCENE,
  OHMS_LAW_SCENE, WAVE_SCENE, COULOMB_SCENE, REFRACTION_SCENE, DOPPLER_SCENE,
  FARADAY_SCENE, MOTOR_SCENE, IDEAL_GAS_SCENE, LENS_OPTICS_SCENE, AC_GENERATOR_SCENE,
] as unknown as PhysicsScene[];

describe("TeachingScript generator — determinism", () => {
  it("produces identical output for identical input", () => {
    for (const scene of ALL_SCENES) {
      const a = generateTeachingScript(scene);
      const b = generateTeachingScript(scene);
      expect(a).toEqual(b);
    }
  });
});

describe("TeachingScript generator — 18 built-in scenes invariants", () => {
  it("covers every phase with a phase card and no dangling refs", () => {
    for (const scene of ALL_SCENES) {
      const hints = generateTeachingScript(scene);
      const phaseIds = new Set((scene.timeline?.phases ?? []).map((p) => p.id));
      const eqIds = new Set((scene.equations ?? []).map((e) => e.id));
      const forceIds = new Set((scene.forces ?? []).map((f) => f.id));
      const eventIds = new Set((scene.timeline?.events ?? []).map((e) => e.id));

      for (const c of hints.phase_cards ?? []) expect(phaseIds.has(c.phase_id)).toBe(true);
      for (const s of hints.formula_strips ?? []) {
        expect(phaseIds.has(s.phase_id)).toBe(true);
        expect(eqIds.has(s.equation_id)).toBe(true);
      }
      for (const f of hints.force_callouts ?? []) expect(forceIds.has(f.force_id)).toBe(true);
      for (const e of hints.event_pulses ?? []) expect(eventIds.has(e.event_id)).toBe(true);

      // every phase has exactly one card
      expect((hints.phase_cards ?? []).length).toBe(phaseIds.size);
    }
  });

  it("keeps at most one formula strip per phase and ≤2 event pulses per phase", () => {
    for (const scene of ALL_SCENES) {
      const hints = generateTeachingScript(scene);
      const phases = scene.timeline?.phases ?? [];
      for (const p of phases) {
        const strips = (hints.formula_strips ?? []).filter((s) => s.phase_id === p.id);
        expect(strips.length).toBeLessThanOrEqual(1);
        const pulses = (hints.event_pulses ?? []).filter((e) => {
          const ev = scene.timeline?.events?.find((x) => x.id === e.event_id);
          return ev && ev.time >= p.timeRange[0] && ev.time < p.timeRange[1];
        });
        expect(pulses.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("maps the solution equation (if any) to the last phase", () => {
    for (const scene of ALL_SCENES) {
      const hints = generateTeachingScript(scene);
      const phases = scene.timeline?.phases ?? [];
      const lastId = phases[phases.length - 1]?.id;
      const solutions = (scene.equations ?? []).filter((e) => e.is_solution);
      for (const sol of solutions) {
        const mapped = (hints.formula_strips ?? []).find((s) => s.equation_id === sol.id);
        if (mapped) expect(mapped.phase_id).toBe(lastId);
      }
    }
  });
});

describe("TeachingScript validator", () => {
  const base = generateTeachingScript(FREE_FALL_SCENE);

  it("drops entries with dangling references", () => {
    const dirty = {
      phase_cards: [{ phase_id: "nope" }, { phase_id: base.phase_cards?.[0]?.phase_id ?? "x" }],
      formula_strips: [{ phase_id: "nope", equation_id: "nope" }],
      force_callouts: [{ force_id: "nope" }],
      event_pulses: [{ event_id: "nope" }],
    };
    const clean = validateTeachingScript(FREE_FALL_SCENE, dirty);
    expect(clean.phase_cards?.length).toBe(1);
    expect(clean.formula_strips?.length).toBe(0);
    expect(clean.force_callouts?.length).toBe(0);
    expect(clean.event_pulses?.length).toBe(0);
  });

  it("drops over-long hints but keeps the entry", () => {
    const long = "这是一段非常非常非常非常非常非常非常非常非常非常非常长的提示文字超过了三十个字";
    const dirty = { phase_cards: [{ phase_id: base.phase_cards?.[0]?.phase_id ?? "x", hint: long }] };
    const clean = validateTeachingScript(FREE_FALL_SCENE, dirty);
    expect(clean.phase_cards?.[0]).toEqual({ phase_id: base.phase_cards?.[0]?.phase_id });
  });

  it("dedups formula strips per phase (first wins)", () => {
    const phaseId = base.phase_cards?.[0]?.phase_id ?? "release";
    const eqIds = FREE_FALL_SCENE.equations.slice(0, 2).map((e) => e.id);
    const dirty = {
      formula_strips: [
        { phase_id: phaseId, equation_id: eqIds[0] },
        { phase_id: phaseId, equation_id: eqIds[1] },
      ],
    };
    const clean = validateTeachingScript(FREE_FALL_SCENE, dirty);
    expect(clean.formula_strips?.length).toBe(1);
    expect(clean.formula_strips?.[0].equation_id).toBe(eqIds[0]);
  });

  it("caps event pulses at 2 per phase", () => {
    const evIds = FREE_FALL_SCENE.timeline.events.map((e) => e.id);
    const dirty = { event_pulses: evIds.map((id) => ({ event_id: id })) };
    const clean = validateTeachingScript(FREE_FALL_SCENE, dirty);
    expect((clean.event_pulses ?? []).length).toBeLessThanOrEqual(2);
  });

  it("never throws on garbage input", () => {
    expect(() => validateTeachingScript(FREE_FALL_SCENE, null)).not.toThrow();
    expect(() => validateTeachingScript(FREE_FALL_SCENE, undefined)).not.toThrow();
    expect(() => validateTeachingScript(FREE_FALL_SCENE, { phase_cards: "bad" } as never)).not.toThrow();
    expect(validateTeachingScript(FREE_FALL_SCENE, null)).toEqual({});
  });
});

describe("TeachingScript generator — pipeline integration", () => {
  it("rule parser attaches generated hints to parsed scenes", async () => {
    const res = await ruleParser.parseProblem("一个小球从20米高处自由下落，g=10m/s²。");
    expect(res.success).toBe(true);
    expect(res.scene?.overlay_hints).toBeDefined();
    expect((res.scene?.overlay_hints?.phase_cards ?? []).length).toBeGreaterThan(0);
  });

  it("ensureTeachingScript keeps explicit hints and validates them", () => {
    const scene = JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;
    scene.overlay_hints = { event_pulses: [{ event_id: "does-not-exist" }] };
    const out = ensureTeachingScript(scene);
    expect(out.overlay_hints?.event_pulses).toEqual([]);
  });
});

