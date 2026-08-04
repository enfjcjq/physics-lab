import { describe, it, expect } from "vitest";
import type { PhysicsScene } from "@physics-lab/shared";
import {
  getPhaseCardData,
  getFormulaStripData,
  getActivePhase,
  substituteExpression,
  getForceCalloutData,
  getEventPulseText,
  getPulsableEvents,
} from "../../renderer/features/experiment/components/teaching/teaching-layer-data";

// Minimal deterministic fixture: 2 phases, 2 equations, sim params
const fixture: PhysicsScene = {
  $schema: "test",
  version: "2.0",
  metadata: { title: "Fixture", subject: "mechanics", topic: "free_fall" },
  entities: [],
  environment: [],
  forces: [],
  constraints: [],
  equations: [
    { id: "eq_motion", name: "Motion", expression: "y(t) = h0 - (1/2) * g * t^2", variables: { h0: { symbol: "h0", unit: "m", description: "height" }, g: { symbol: "g", unit: "m/s2", description: "gravity" }, t: { symbol: "t", unit: "s", description: "time" } }, type: "motion" },
    { id: "eq_velocity", name: "Velocity", expression: "v = sqrt(2 * g * h0)", variables: { g: { symbol: "g", unit: "m/s2", description: "gravity" }, h0: { symbol: "h0", unit: "m", description: "height" } }, type: "target", is_solution: true },
  ],
  timeline: {
    total_duration: 4,
    events: [],
    phases: [
      { id: "release", label: "phase.release", icon: "o", timeRange: [0, 1], description: "At rest" },
      { id: "falling", label: "phase.falling", icon: "v", timeRange: [1, 4], description: "Falling under gravity" },
    ],
  },
  camera_script: [],
  ui_controls: [],
  knowledge_tags: [],
  teacher_steps: [],
  charts: [],
};
// Simulation params drive the deterministic substitution tests
;(fixture as unknown as { simulation: Record<string, unknown> }).simulation = { params: { h0: 10, g: 9.8, m: 2 } };

describe("teaching-layer-data", () => {
  it("returns the active phase for the current time", () => {
    expect(getActivePhase(fixture, 0.5)?.id).toBe("release");
    expect(getActivePhase(fixture, 2.5)?.id).toBe("falling");
    expect(getActivePhase(fixture, 99)).toBeNull();
  });

  it("derives PhaseCard data (index/total, hint fallback)", () => {
    const card = getPhaseCardData(fixture, 2.5);
    expect(card).not.toBeNull();
    expect(card?.id).toBe("falling");
    expect(card?.index).toBe(2);
    expect(card?.total).toBe(2);
    expect(card?.labelKey).toBe("phase.falling");
    expect(card?.hint).toBe("Falling under gravity");
  });

  it("maps formula stages deterministically by phase progress", () => {
    // Default mapping by phase index: release -> eq_motion, falling -> eq_velocity
    // progress < 0.5 -> original formula
    const s1 = getFormulaStripData(fixture, 0.4); // release, progress 0.4 -> formula
    expect(s1?.stage).toBe("formula");
    expect(s1?.expression).toContain("y(t)");
    // 0.5 <= progress < 0.8 -> substituted
    const s2 = getFormulaStripData(fixture, 2.5); // falling, (2.5-1)/3 = 0.5
    expect(s2?.stage).toBe("substituted");
    expect(s2?.substituted).toContain("10");
    expect(s2?.substituted).toContain("9.8");
    // progress >= 0.8 -> result evaluated (v = sqrt(2*9.8*10) = 14)
    const s3 = getFormulaStripData(fixture, 3.5); // falling, (3.5-1)/3 = 0.833
    expect(s3?.stage).toBe("result");
    expect(s3?.result).not.toBeNull();
    expect(s3?.result).toBeCloseTo(14, 6);
  });

  it("uses overlay_hints mapping for formula strips", () => {
    const withHints: PhysicsScene = {
      ...fixture,
      overlay_hints: {
        formula_strips: [{ phase_id: "release", equation_id: "eq_velocity" }],
      },
    };
    const data = getFormulaStripData(withHints, 0.5);
    expect(data?.equationId).toBe("eq_velocity");
  });

  it("auto-hides FormulaStrip when the phase has no equation", () => {
    const sparse: PhysicsScene = {
      ...fixture,
      equations: [],
    };
    expect(getFormulaStripData(sparse, 0.5)).toBeNull();
  });

  it("substitutes variables and time into expressions", () => {
    const eq = fixture.equations[0];
    const out = substituteExpression(eq.expression, eq, { h0: 10, g: 9.8 }, 1);
    expect(out).toBe("y(t) = 10 - (1/2) * 9.8 * 1^2");
  });
});



// ---- S72 fixtures & tests ----

const forceEventFixture: PhysicsScene = {
  $schema: "test",
  version: "2.0",
  metadata: { title: "F", subject: "mechanics", topic: "collision" },
  entities: [],
  environment: [],
  constraints: [],
  equations: [],
  camera_script: [],
  ui_controls: [],
  knowledge_tags: [],
  teacher_steps: [],
  charts: [],
  forces: [
    { id: "f_gravity", type: "gravity", target_entity: "ball_a", magnitude: "mass * g", direction: [0, -1, 0], description: "Gravity G", visual: { label: "Gravity G" } },
    { id: "f_normal", type: "normal", target_entity: "ball_a", magnitude: 9.8, direction: [0, 1, 0], description: "Normal" },
    { id: "f_small", type: "friction", target_entity: "ball_a", magnitude: 0.5, direction: [1, 0, 0], description: "Friction" },
    { id: "f_fourth", type: "drag_force", target_entity: "ball_a", magnitude: 2, direction: [-1, 0, 0], description: "Drag" },
  ],
  timeline: {
    total_duration: 4,
    events: [
      { id: "ev_impact", time: 1.5, type: "collision", data: {}, description: "Balls collide" },
      { id: "ev_separate", time: 1.6, type: "state_change", data: {}, description: "Balls separate" },
    ],
    phases: [
      { id: "approach", label: "phase.approach", icon: "><", timeRange: [0, 1.5], description: "Approaching" },
      { id: "collision", label: "phase.collision", icon: "O", timeRange: [1.5, 1.6], description: "Impact" },
      { id: "separate", label: "phase.separate", icon: "<>", timeRange: [1.6, 4], description: "Separating" },
    ],
  },
};

describe("force callouts", () => {
  it("caps at max and reports hidden count", () => {
    const { callouts, hidden } = getForceCalloutData(forceEventFixture, 0, 3);
    expect(callouts.length).toBe(3);
    expect(hidden).toBe(1);
  });

  it("sorts by numeric magnitude desc", () => {
    const { callouts } = getForceCalloutData(forceEventFixture, 0, 4);
    // f_normal (9.8) first, f_fourth (2) second, f_small (0.5) third; string magnitude last
    expect(callouts[0].forceId).toBe("f_normal");
    expect(callouts[3].forceId).toBe("f_gravity");
  });

  it("uses force label and magnitude formula", () => {
    const { callouts } = getForceCalloutData(forceEventFixture, 0, 1);
    expect(callouts[0].forceId).toBe("f_normal");
    expect(callouts[0].label).toBe("Normal");
    expect(callouts[0].formula).toBe("9.8");
    const all = getForceCalloutData(forceEventFixture, 0, 4).callouts;
    const gravity = all.find((c) => c.forceId === "f_gravity");
    expect(gravity?.label).toBe("Gravity G");
    expect(gravity?.formula).toBe("mass * g");
  });
  it("respects overlay_hints force_callouts restriction", () => {
    const withHints: PhysicsScene = {
      ...forceEventFixture,
      overlay_hints: {
        force_callouts: [{ force_id: "f_gravity", formula_override: "G = mg" }],
      },
    };
    const { callouts } = getForceCalloutData(withHints, 0, 3);
    expect(callouts.length).toBe(1);
    expect(callouts[0].formula).toBe("G = mg");
  });
});

describe("event pulse data", () => {
  it("shows explanation text only within the 2s window (deterministic)", () => {
    expect(getEventPulseText(forceEventFixture, 1.0)).toBeNull();
    const t = getEventPulseText(forceEventFixture, 1.6);
    expect(t?.eventId).toBe("ev_impact");
    expect(t?.text).toBe("Balls collide");
    expect(getEventPulseText(forceEventFixture, 3.61)).toBeNull();
    expect(getEventPulseText(forceEventFixture, 1.6 + 2.001)).toBeNull();
  });

  it("derives pulsable events: collision always + first other per phase", () => {
    const pulses = getPulsableEvents(forceEventFixture);
    const ids = pulses.map((p) => p.eventId);
    // approach phase: no events; collision phase: ev_impact (collision); separate phase: ev_separate (first other)
    expect(ids).toContain("ev_impact");
    expect(ids).toContain("ev_separate");
  });

  it("overlay_hints event_pulses overrides candidates", () => {
    const withHints: PhysicsScene = {
      ...forceEventFixture,
      overlay_hints: { event_pulses: [{ event_id: "ev_separate" }] },
    };
    const pulses = getPulsableEvents(withHints);
    expect(pulses.map((p) => p.eventId)).toEqual(["ev_separate"]);
  });
});


