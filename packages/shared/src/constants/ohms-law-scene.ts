import type { PhysicsScene } from "../types/physics-scene";

export const OHMS_LAW_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Ohm's Law",
    description: "Electric circuit: V = IR relationship",
    subject: "electromagnetism",
    topic: "ohms_law",
    difficulty: "easy",
    grade: "junior_high",
    tags: ["electricity", "circuit", "ohm", "voltage", "current"],
  },
  entities: [
    {
      id: "electron",
      type: "ball",
      name: "Electron Flow",
      position: [0, 2, 0],
      properties: { mass: 1, radius: 0.15 },
      initial_conditions: { velocity: [1, 0, 0] },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "electric_force", type: "applied_force", target_entity: "electron", magnitude: "V / L", direction: [1, 0, 0], description: "Electric field drives electron flow" },
    { id: "resistance", type: "drag_force", target_entity: "electron", magnitude: "R * I", direction: [-1, 0, 0], description: "Resistance opposes current" },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "circuit_on", label: "Circuit On", icon: "\u26A1", timeRange: [0, 1], cameraPresetId: "overview" },
      { id: "steady_current", label: "Steady Current", icon: "\uD83D\uDD0C", timeRange: [1, 5.5], cameraPresetId: "overview" },
      { id: "complete", label: "Complete", icon: "\u2705", timeRange: [5.5, 6], cameraPresetId: "overview" },
    ],
  },
  camera_script: [
    { id: "overview", time: 0, position: [6, 4, 8], target: [2, 2, 0] },
  ],
  constraints: [],
  equations: [
    { id: "ohm", name: "Ohm's Law", expression: "I = V / R", variables: { V: { symbol: "V", unit: "V", description: "Voltage" }, R: { symbol: "R", unit: "\u03A9", description: "Resistance" }, I: { symbol: "I", unit: "A", description: "Current" } }, type: "force" as const },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_ohm_law", name: "Ohm's Law", category: "electromagnetism", level: 1 },
    { id: "kp_ohm_voltage", name: "Voltage", category: "electromagnetism", level: 1 },
    { id: "kp_ohm_current", name: "Electric Current", category: "electromagnetism", level: 1 },
    { id: "kp_ohm_resistance", name: "Resistance", category: "electromagnetism", level: 1 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.ohm.step1", descKey: "teacher.ohm.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.ohm.step2", descKey: "teacher.ohm.step2_desc", formulaKey: "teacher.ohm.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.ohm.step3", descKey: "teacher.ohm.step3_desc", formulaKey: "teacher.ohm.formula2", timeStart: 2 },
    { id: "s4", order: 4, titleKey: "teacher.ohm.step4", descKey: "teacher.ohm.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { V: 12, R: 4, L: 4 },
    equations: {
      x: "V / R * t > 4 ? 4 : V / R * t",
      y: "2",
      z: "0",
      vx: "V / R",
      vy: "0",
      vz: "0",
      ax: "0",
      ay: "0",
      az: "0",
      ke: "0.5 * 1 * (V / R) * (V / R)",
      pe: "0",
      total_e: "0.5 * 1 * (V / R) * (V / R)",
      speed: "V / R",
      current: "V / R",
    },
    stopWhen: [],
  },
};
