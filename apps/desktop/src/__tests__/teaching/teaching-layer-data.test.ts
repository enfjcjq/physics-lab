import { describe, it, expect } from "vitest";
import type { PhysicsScene } from "@physics-lab/shared";
import {
  getPhaseCardData,
  getFormulaStripData,
  getActivePhase,
  substituteExpression,
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


