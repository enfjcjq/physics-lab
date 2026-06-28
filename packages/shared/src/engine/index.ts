export { evaluate, evaluateAll, type FormulaContext } from "./formula-evaluator";
export { createEngine, createFreeFallScene, type PhysicsEngine } from "./generic-physics-engine";
export { createSceneRunner, hasSimulation, type SceneRunner, type ComputeStateFn } from "./scene-runner";
export { createVirtualPlugin } from "./virtual-plugin";
export type { SimulationDef, SimulationEquations, StopCondition, FrameState, PhysicsSceneV2 } from "./simulation-types";
