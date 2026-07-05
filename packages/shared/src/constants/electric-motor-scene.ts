import type { PhysicsScene } from "../types/physics-scene";

// Simple DC Motor: B-field exerts torque on current loop
// Torque = NIAB * sin(theta)
export const MOTOR_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Electric Motor",
    description: "DC motor: torque on current-carrying loop in magnetic field",
    subject: "electromagnetism",
    topic: "electric_motor",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["motor", "electromagnetic", "torque", "current", "rotation"],
  },
  entities: [
    {
      id: "rotor",
      type: "ball",
      name: "Rotor",
      position: [0, 2, 0],
      properties: { mass: 1, radius: 0.3 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#3b82f6", material: "metal", show_trail: true },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "lorentz", type: "applied_force", target_entity: "rotor", magnitude: "N * I * A * B", direction: [0, 0, 1], description: "Lorentz force creates torque" },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "startup", label: "phase.startup", icon: "o", timeRange: [0, 0.5], color: "#22c55e", description: "Current applied, torque begins", cameraPresetId: "wide" },
      { id: "spinning", label: "phase.spinning", icon: "v", timeRange: [0.3, 5.5], color: "#3b82f6", description: "Rotor accelerates to steady speed", cameraPresetId: "wide" },
      { id: "steady", label: "phase.steady", icon: "O", timeRange: [5.3, 6], color: "#f59e0b", description: "Steady rotation", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [5, 4, 8], target: [0, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    { id: "motor_eq", name: "Motor Torque", expression: "tau = N I A B sin(theta)", type: "force" as const, variables: { N: { symbol: "N", unit: "turns", description: "Coil turns" }, I: { symbol: "I", unit: "A", description: "Current" }, B: { symbol: "B", unit: "T", description: "Magnetic field" } } },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_motor", name: "Electric Motor", category: "electromagnetism", level: 2 },
    { id: "kp_torque", name: "Torque", category: "mechanics", level: 2 },
    { id: "kp_lorentz", name: "Lorentz Force", category: "electromagnetism", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.motor.step1", descKey: "teacher.motor.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.motor.step2", descKey: "teacher.motor.step2_desc", formulaKey: "teacher.motor.formula1", timeStart: 0.8 },
    { id: "s3", order: 3, titleKey: "teacher.motor.step3", descKey: "teacher.motor.step3_desc", formulaKey: "teacher.motor.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.motor.step4", descKey: "teacher.motor.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { N: 10, I: 2, A: 0.05, B: 1, omega0: 0, r: 2, friction: 0.3 },
    equations: {
      // Circular motion with angular acceleration
      x: "r * cos(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      y: "2",
      z: "r * sin(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      vx: "-r * (N * I * A * B * t / 1.5) * sin(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      vy: "0",
      vz: "r * (N * I * A * B * t / 1.5) * cos(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      ax: "-r * (N * I * A * B / 1.5) * sin(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5) - r * (N * I * A * B * t / 1.5) * (N * I * A * B * t / 1.5) * cos(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      ay: "0",
      az: "r * (N * I * A * B / 1.5) * cos(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5) - r * (N * I * A * B * t / 1.5) * (N * I * A * B * t / 1.5) * sin(omega0 * t + 0.5 * N * I * A * B * t * t / 1.5)",
      ke: "0.5 * 1 * (vx*vx + vz*vz)",
      pe: "0",
      total_e: "N * I * A * B * r * t / 1.5",
      speed: "sqrt(vx*vx + vz*vz)",
      angular_speed: "N * I * A * B * t / 1.5",
      torque: "N * I * A * B",
    },
    stopWhen: [],
  },
};
