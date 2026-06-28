import type { PhysicsScene } from "../types/physics-scene";

// ============================================================
// PhysicsScene v2.2 — Simulation Extension
// Adds a self-contained "simulation" block for formula-driven physics.
// ============================================================

export interface SimulationEquations {
  x?: string; y?: string; z?: string;
  vx?: string; vy?: string; vz?: string;
  ax?: string; ay?: string; az?: string;
  ke?: string; pe?: string; total_e?: string;
  [key: string]: string | undefined;
}

export interface StopCondition {
  formula: string;
  description?: string;
}

export interface SimulationDef {
  params: Record<string, number>;
  equations: SimulationEquations;
  stopWhen?: StopCondition[];
  entityMap?: Record<string, string>;
}

export interface PhysicsSceneV2 extends PhysicsScene {
  simulation: SimulationDef;
}

export interface FrameState {
  time: number;
  positions: Record<string, [number, number, number]>;
  velocities: Record<string, [number, number, number]>;
  accelerations: Record<string, [number, number, number]>;
  energies: { kinetic: number; potential: number; total: number };
  computed: Record<string, number>;
  stopped: boolean;
  stopReason?: string;
}
