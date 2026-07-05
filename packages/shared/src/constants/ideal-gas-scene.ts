import type { PhysicsScene } from "../types/physics-scene";

// Ideal Gas Law: PV = nRT
// Piston compresses/expands gas, showing P-V relationship
export const IDEAL_GAS_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Ideal Gas Law",
    description: "PV = nRT. Piston compresses gas, pressure and volume change reciprocally.",
    subject: "thermodynamics",
    topic: "ideal_gas",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["gas", "thermodynamics", "pressure", "volume", "ideal"],
  },
  entities: [
    {
      id: "piston",
      type: "block",
      name: "Piston",
      position: [3, 1.5, 0],
      properties: { mass: 1, dimensions: [0.3, 1, 1], is_static: false },
      initial_conditions: { velocity: [-0.5, 0, 0] },
      visual: { color: "#f59e0b" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "pressure", type: "applied_force", target_entity: "piston", magnitude: "nRT / V", direction: [-1, 0, 0], description: "Gas pressure on piston" },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "compressing", label: "phase.compressing", icon: "v", timeRange: [0, 3], color: "#ef4444", description: "Piston compresses gas", cameraPresetId: "wide" },
      { id: "min_volume", label: "phase.min_volume", icon: "O", timeRange: [2.8, 3.3], color: "#f59e0b", description: "Minimum volume, maximum pressure", cameraPresetId: "wide" },
      { id: "expanding", label: "phase.expanding", icon: "v", timeRange: [3.2, 6], color: "#22c55e", description: "Piston expands, pressure drops", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [2, 3, 8], target: [2, 1.5, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    { id: "ideal_gas_law", name: "Ideal Gas Law", expression: "PV = nRT", type: "motion" as const, variables: { P: { symbol: "P", unit: "Pa", description: "Pressure" }, V: { symbol: "V", unit: "m3", description: "Volume" }, n: { symbol: "n", unit: "mol", description: "Moles" }, T: { symbol: "T", unit: "K", description: "Temperature" } } },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_ideal_gas", name: "Ideal Gas Law", category: "thermodynamics", level: 2 },
    { id: "kp_pressure", name: "Pressure", category: "thermodynamics", level: 1 },
    { id: "kp_boyle", name: "Boyle Law", category: "thermodynamics", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.gas.step1", descKey: "teacher.gas.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.gas.step2", descKey: "teacher.gas.step2_desc", formulaKey: "teacher.gas.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.gas.step3", descKey: "teacher.gas.step3_desc", formulaKey: "teacher.gas.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.gas.step4", descKey: "teacher.gas.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { n: 1, R: 8.314, T: 300, L0: 4, A_cross: 1, piston_m: 1 },
    equations: {
      // Piston x-position: oscillates to show compression/expansion
      x: "L0 + 1.5 * sin(0.8 * t)",
      y: "1.5",
      z: "0",
      vx: "1.5 * 0.8 * cos(0.8 * t)",
      vy: "0",
      vz: "0",
      ax: "-1.5 * 0.64 * sin(0.8 * t)",
      ay: "0",
      az: "0",
      ke: "0.5 * piston_m * vx * vx",
      pe: "0",
      total_e: "n * R * T",
      volume: "x * A_cross",
      pressure: "n * R * T / (x * A_cross)",
      speed: "abs(vx)",
    },
    stopWhen: [],
  },
};
