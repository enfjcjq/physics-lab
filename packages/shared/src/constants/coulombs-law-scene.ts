import type { PhysicsScene } from "../types/physics-scene";

export const COULOMB_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Coulomb'\''s Law",
    description: "Electrostatic force between two point charges: F = k·q1·q2 / r²",
    subject: "electromagnetism",
    topic: "coulombs_law",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["electrostatics", "coulomb", "charge", "force", "inverse_square"],
  },
  entities: [
    {
      id: "charge_1",
      type: "ball",
      name: "Charge 1 (fixed)",
      position: [-2, 3, 0],
      properties: { mass: 1, radius: 0.25, charge: 5e-6 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#ef4444", material: "metal" },
    },
    {
      id: "charge_2",
      type: "ball",
      name: "Charge 2 (movable)",
      position: [2, 3, 0],
      properties: { mass: 0.01, radius: 0.2, charge: 5e-6 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#3b82f6", material: "metal", show_trail: true, trail_color: "#3b82f644" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    {
      id: "coulomb_force",
      type: "applied_force",
      target_entity: "charge_2",
      magnitude: "k * q1 * q2 / (d * d)",
      direction: [-1, 0, 0],
      description: "Electrostatic repulsion force",
      visual: { color: "#f59e0b", arrow_scale: 0.5, label: "F_e" },
    },
  ],
  timeline: {
    total_duration: 5,
    fps: 60,
    events: [],
    phases: [
      { id: "initial", label: "phase.initial", icon: "o", timeRange: [0, 0.3], color: "#22c55e", description: "Charges at initial separation", cameraPresetId: "wide" },
      { id: "repelling", label: "phase.repelling", icon: "v", timeRange: [0.2, 4.5], color: "#f59e0b", description: "Charges repel each other", cameraPresetId: "wide" },
      { id: "stable", label: "phase.stable", icon: "O", timeRange: [4.3, 5], color: "#3b82f6", description: "Force weakens with distance", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [0, 6, 12], target: [0, 3, 0], fov: 55 },
    { id: "close", time: 0, position: [0, 4, 6], target: [0, 3, 0], fov: 45 },
  ],
  constraints: [],
  equations: [
    {
      id: "coulomb_eq",
      name: "Coulomb'\''s Law",
      expression: "F = k * q1 * q2 / r^2",
      variables: {
        k: { symbol: "k", unit: "N·m²/C²", description: "Coulomb constant" },
        q1: { symbol: "q₁", unit: "C", description: "Charge 1" },
        q2: { symbol: "q₂", unit: "C", description: "Charge 2" },
        r: { symbol: "r", unit: "m", description: "Distance" },
      },
      type: "force" as const,
    },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_coulomb", name: "Coulomb'\''s Law", category: "electromagnetism", level: 2 },
    { id: "kp_coulomb_force", name: "Electrostatic Force", category: "electromagnetism", level: 2 },
    { id: "kp_coulomb_inv_sq", name: "Inverse Square Law", category: "electromagnetism", level: 2 },
    { id: "kp_coulomb_charge", name: "Electric Charge", category: "electromagnetism", level: 1 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.coulomb.step1", descKey: "teacher.coulomb.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.coulomb.step2", descKey: "teacher.coulomb.step2_desc", formulaKey: "teacher.coulomb.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.coulomb.step3", descKey: "teacher.coulomb.step3_desc", formulaKey: "teacher.coulomb.formula2", timeStart: 2 },
    { id: "s4", order: 4, titleKey: "teacher.coulomb.step4", descKey: "teacher.coulomb.step4_desc", timeStart: 3.5 },
  ],
  simulation: {
    params: { k: 8.99e9, q1: 5e-6, q2: 5e-6, m: 0.01, d0: 4, y0: 3 },
    equations: {
      // Charge 2 moves away from Charge 1 due to repulsion
      // F = k*q1*q2 / x²,  a = F/m,  v = ∫ a dt,  x = x0 + ∫ v dt
      // Simplified: x = sqrt(2*k*q1*q2*t/m + d0²)
      x: "sqrt(2 * k * q1 * q2 * t / m + d0 * d0) / 2 + 2",
      y: "y0",
      z: "0",
      vx: "k * q1 * q2 / (m * sqrt(2 * k * q1 * q2 * t / m + d0 * d0))",
      vy: "0",
      vz: "0",
      ax: "-k * q1 * q2 / (m * (2 * k * q1 * q2 * t / m + d0 * d0))",
      ay: "0",
      az: "0",
      ke: "0.5 * m * vx * vx",
      pe: "k * q1 * q2 / sqrt(2 * k * q1 * q2 * t / m + d0 * d0)",
      total_e: "k * q1 * q2 / d0",
      speed: "abs(vx)",
      force: "k * q1 * q2 / (2 * k * q1 * q2 * t / m + d0 * d0)",
      distance: "sqrt(2 * k * q1 * q2 * t / m + d0 * d0)",
    },
    stopWhen: [],
  },
};
