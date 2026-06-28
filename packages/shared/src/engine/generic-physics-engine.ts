import { evaluate, evaluateAll, type FormulaContext } from "./formula-evaluator";
import type { SimulationDef, FrameState, PhysicsSceneV2 } from "./simulation-types";

export interface PhysicsEngine {
  computeFrame(t: number): FrameState;
  precomputeAll(): FrameState[];
  getScene(): PhysicsSceneV2;
  isStoppedAt(t: number): boolean;
  reset(): void;
}

export function createEngine(scene: PhysicsSceneV2): PhysicsEngine {
  const sim = scene.simulation;
  const params = { ...sim.params };
  const entityIds = scene.entities.map(e => e.id);
  const primaryEntity = entityIds[0] ?? "entity";

  function makeContext(t: number, extra: Record<string, number> = {}): FormulaContext {
    return { ...params, t, ...extra };
  }

  function checkStop(ctx: FormulaContext): { stopped: boolean; reason?: string } {
    if (!sim.stopWhen || sim.stopWhen.length === 0) return { stopped: false };
    for (const cond of sim.stopWhen) {
      if (evaluate(cond.formula, ctx) <= 0) {
        return { stopped: true, reason: cond.description ?? cond.formula };
      }
    }
    return { stopped: false };
  }

  function computeFrame(t: number): FrameState {
    const ctx = makeContext(t);

    // Pass 1: position, velocity, acceleration (don't depend on each other)
    const motionVals = evaluateAll({
      x: sim.equations.x ?? "0", y: sim.equations.y ?? "0", z: sim.equations.z ?? "0",
      vx: sim.equations.vx ?? "0", vy: sim.equations.vy ?? "0", vz: sim.equations.vz ?? "0",
      ax: sim.equations.ax ?? "0", ay: sim.equations.ay ?? "0", az: sim.equations.az ?? "0",
    }, ctx);

    // Pass 2: energy + derived values (can reference motion values)
    const fullCtx = makeContext(t, motionVals);
    const energyVals = evaluateAll({
      ke: sim.equations.ke ?? "0", pe: sim.equations.pe ?? "0", total_e: sim.equations.total_e ?? "0",
    }, fullCtx);

    const vals = { ...motionVals, ...energyVals };

    const stopCtx = makeContext(t, vals);
    const { stopped, reason } = checkStop(stopCtx);

    const pos: Record<string, [number, number, number]> = {};
    const vel: Record<string, [number, number, number]> = {};
    const acc: Record<string, [number, number, number]> = {};
    pos[primaryEntity] = [vals.x, vals.y, vals.z];
    vel[primaryEntity] = [vals.vx, vals.vy, vals.vz];
    acc[primaryEntity] = [vals.ax, vals.ay, vals.az];

    const computed: Record<string, number> = {};
    for (const [key, expr] of Object.entries(sim.equations)) {
      if (!["x","y","z","vx","vy","vz","ax","ay","az","ke","pe","total_e"].includes(key)) {
        computed[key] = evaluate(expr ?? "0", fullCtx);
      }
    }

    return {
      time: t,
      positions: pos, velocities: vel, accelerations: acc,
      energies: { kinetic: vals.ke, potential: vals.pe, total: vals.total_e },
      computed, stopped, stopReason: reason,
    };
  }

  let frameCache: FrameState[] | null = null;

  function precomputeAll(): FrameState[] {
    if (frameCache) return frameCache;
    const fps = scene.timeline.fps ?? 60;
    const duration = scene.timeline.total_duration;
    const totalFrames = Math.ceil(duration * fps);
    const frames: FrameState[] = [];
    for (let i = 0; i <= totalFrames; i++) {
      const frame = computeFrame(i / fps);
      frames.push(frame);
      if (frame.stopped && i > 0) break;
    }
    frameCache = frames;
    return frames;
  }

  function isStoppedAt(t: number): boolean { return computeFrame(t).stopped; }
  function reset(): void { frameCache = null; }

  return { computeFrame, precomputeAll, getScene: () => scene, isStoppedAt, reset };
}

// ============================================================
// Built-in scene factory: free-fall
// ============================================================
export function createFreeFallScene(h0: number = 10, g: number = 9.8, mass: number = 2): PhysicsSceneV2 {
  const impactTime = Math.sqrt(2 * h0 / g);
  return {
    "$schema": "physics-scene-v2",
    version: "2.0",
    metadata: {
      title: "Free Fall", description: "Auto-generated free-fall simulation",
      subject: "mechanics", topic: "free_fall", difficulty: "easy",
      grade: "senior_high", tags: ["free-fall","gravity"],
    },
    entities: [{
      id: "ball", type: "ball", name: "Ball",
      position: [0, h0, 0], properties: { mass, radius: 0.2 },
      initial_conditions: { velocity: [0, 0, 0] },
    }],
    environment: [{
      type: "gravity_field", properties: { acceleration: g, direction: [0, -1, 0] },
    }],
    forces: [{
      id: "gravity", type: "gravity", target_entity: "ball",
      magnitude: "m * g", direction: [0, -1, 0],
    }],
    timeline: {
      total_duration: impactTime + 0.3, fps: 60, events: [],
      phases: [
        { id: "release", label: "Release", icon: "\u25B6", timeRange: [0, 0.2] },
        { id: "falling", label: "Falling", icon: "\u2B07\uFE0F", timeRange: [0.2, impactTime] },
        { id: "landed", label: "Landed", icon: "\u23F9", timeRange: [impactTime, impactTime + 0.3] },
      ],
    },
    camera_script: [
      { id: "overview", time: 0, position: [6, 6, 8], target: [0, h0 / 2, 0] },
    ],
    constraints: [], equations: [], ui_controls: [], knowledge_tags: [], teacher_steps: [],
    simulation: {
      params: { h0, g, m: mass },
      equations: {
        x: "0",
        y: "h0 - 0.5 * g * t * t > 0.2 ? h0 - 0.5 * g * t * t : 0.2",
        z: "0",
        vx: "0",
        vy: "t < " + impactTime + " ? -g * t : 0",
        vz: "0",
        ax: "0",
        ay: "t < " + impactTime + " ? -g : 0",
        az: "0",
        ke: "0.5 * m * vy * vy",
        pe: "m * g * (h0 - 0.5 * g * t * t > 0.2 ? h0 - 0.5 * g * t * t : 0.2)",
        total_e: "m * g * h0",
        speed: "abs(vy)",
      },
      stopWhen: [
        { formula: "(h0 - 0.5 * g * t * t) - 0.2", description: "Ball reaches ground" },
      ],
    },
  };
}
