import { createEngine, type PhysicsEngine } from "./generic-physics-engine";
import type { PhysicsSceneV2, FrameState } from "./simulation-types";
import type { PhysicsScene } from "../types/physics-scene";

/**
 * Bridge: converts a PhysicsScene (potentially with simulation block)
 * into a runnable engine. Falls back to plugin computeState when no simulation.
 */

export interface ComputeStateFn {
  (t: number, params: Record<string, number>): {
    time: number;
    positions: Record<string, [number, number, number]>;
    velocities: Record<string, [number, number, number]>;
    accelerations: Record<string, [number, number, number]>;
    energies: { kinetic: number; potential: number; total: number };
  };
}

export interface SceneRunner {
  /** Compute state at time t (used by animation loop + Timeline scrubbing) */
  computeFrame: ComputeStateFn;
  /** Precompute all frames for fast Timeline scrubbing */
  precomputeAll: () => FrameState[];
  /** Check if scene is simulation-driven */
  isSimulationDriven: boolean;
  /** Get raw engine (if simulation-driven) */
  engine: PhysicsEngine | null;
}

/**
 * Create a SceneRunner from a PhysicsScene.
 * If the scene has a simulation block, uses the generic engine.
 * Otherwise, returns null (caller should use plugin computeState).
 */
export function createSceneRunner(scene: PhysicsScene): SceneRunner | null {
  const simScene = scene as PhysicsSceneV2;
  if (!simScene.simulation?.equations) return null;

  const engine = createEngine(simScene);

  const computeFrame: ComputeStateFn = (t: number, _params: Record<string, number>) => {
    const frame = engine.computeFrame(t);
    return {
      time: frame.time,
      positions: frame.positions,
      velocities: frame.velocities,
      accelerations: frame.accelerations,
      energies: frame.energies,
    };
  };

  return {
    computeFrame,
    precomputeAll: () => engine.precomputeAll(),
    isSimulationDriven: true,
    engine,
  };
}

/**
 * Check if a PhysicsScene has a simulation block.
 */
export function hasSimulation(scene: PhysicsScene): scene is PhysicsScene & PhysicsSceneV2 {
  return !!(scene as PhysicsSceneV2).simulation?.equations;
}
