import type { PhysicsPlugin, PhysicsScene, PhysicsState } from "@physics-lab/shared";
import { createEngine } from "./generic-physics-engine";
import type { PhysicsSceneV2 } from "./simulation-types";

/**
 * Creates a virtual PhysicsPlugin from a PhysicsSceneV2 (with simulation block).
 * 
 * This allows AI-generated scenes to plug into the existing plugin architecture
 * without modifying experiment.store.ts or Scene3D.
 * 
 * The plugin's computeState delegates to the generic physics engine.
 */
export function createVirtualPlugin(scene: PhysicsSceneV2): PhysicsPlugin {
  const engine = createEngine(scene);
  const sim = scene.simulation;
  const primaryEntity = scene.entities[0]?.id ?? "entity";

  // Derive controls from simulation params
  const controls = Object.entries(sim.params).map(([key, defaultVal]) => ({
    id: key,
    label: "ctrl." + key,
    type: "slider" as const,
    defaultValue: defaultVal,
    min: defaultVal * 0.1,
    max: defaultVal * 5,
    step: defaultVal * 0.05,
    unit: "",
    group: "physics",
  }));

  return {
    id: scene.metadata.topic ?? "dynamic",
    name: "plugin." + (scene.metadata.topic ?? "dynamic") + ".name",
    version: scene.version,
    category: scene.metadata.subject,
    difficulty: scene.metadata.difficulty ?? "medium",

    getDefaultScene: () => scene,

    computeState: (t: number, _params: Record<string, number>): PhysicsState => {
      const frame = engine.computeFrame(t);
      return {
        time: frame.time,
        positions: frame.positions as Record<string, [number, number, number]>,
        velocities: frame.velocities as Record<string, [number, number, number]>,
        accelerations: frame.accelerations as Record<string, [number, number, number]>,
        energies: frame.energies,
      };
    },

    getControls: () => controls,

    getKnowledgePoints: () =>
      (scene.knowledge_tags ?? []).map((kt) => ({
        id: kt.id,
        name: kt.name,
        category: kt.category,
        mastered: false,
      })),

    getForceAnalysis: () =>
      (scene.forces ?? []).map((f) => ({
        name: f.type,
        symbol: f.id,
        direction: Array.isArray(f.direction) ? f.direction.join(",") : String(f.direction),
        magnitude: String(f.magnitude),
        description: f.description ?? "",
      })),

    getMotionAnalysis: () => [],

    getDerivation: () =>
      (scene.equations ?? []).map((eq, i) => ({
        step: i + 1,
        title: eq.name,
        formula: eq.expression,
        explanation: eq.derivation?.join("; ") ?? "",
      })),

    getPhases: () => scene.timeline.phases ?? [],

    getCameraPresets: () =>
      (scene.camera_script ?? []).map((cs) => ({
        id: cs.id,
        label: cs.id,
        position: cs.position,
        target: cs.target,
      })),
  };
}
