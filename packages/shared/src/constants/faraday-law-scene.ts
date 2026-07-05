import type { PhysicsScene } from "../types/physics-scene";

// Faraday Law of Induction: EMF = -dPhi/dt
// A magnet moves through a coil, inducing current
export const FARADAY_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Faraday Law",
    description: "Electromagnetic induction: EMF = -dPhi/dt. Changing magnetic flux induces EMF.",
    subject: "electromagnetism",
    topic: "faraday_law",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["electromagnetic", "induction", "faraday", "flux", "emf"],
  },
  entities: [
    {
      id: "magnet",
      type: "ball",
      name: "Bar Magnet",
      position: [-2, 2, 0],
      properties: { mass: 1, radius: 0.3 },
      initial_conditions: { velocity: [1, 0, 0] },
      visual: { color: "#ef4444", material: "metal", show_trail: true, trail_color: "#ef444444" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "magnetic_force", type: "applied_force", target_entity: "magnet", magnitude: "B * A * omega", direction: [0, 0, 0], description: "Lorentz force on moving charges" },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "approaching", label: "phase.approaching", icon: "v", timeRange: [0, 2], color: "#3b82f6", description: "Magnet approaches coil", cameraPresetId: "wide" },
      { id: "inside", label: "phase.inside", icon: "O", timeRange: [1.8, 4], color: "#f59e0b", description: "Magnet passes through coil", cameraPresetId: "wide" },
      { id: "leaving", label: "phase.leaving", icon: "v", timeRange: [3.8, 6], color: "#22c55e", description: "Magnet leaves coil", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [4, 6, 10], target: [2, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    { id: "faraday_eq", name: "Faraday Law", expression: "EMF = -N * dPhi/dt", type: "motion" as const, variables: { N: { symbol: "N", unit: "turns", description: "Coil turns" }, Phi: { symbol: "Phi", unit: "Wb", description: "Magnetic flux" } } },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_faraday", name: "Faraday Law", category: "electromagnetism", level: 2 },
    { id: "kp_lenz", name: "Lenz Law", category: "electromagnetism", level: 2 },
    { id: "kp_flux", name: "Magnetic Flux", category: "electromagnetism", level: 2 },
    { id: "kp_induction", name: "EM Induction", category: "electromagnetism", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.faraday.step1", descKey: "teacher.faraday.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.faraday.step2", descKey: "teacher.faraday.step2_desc", formulaKey: "teacher.faraday.formula1", timeStart: 1 },
    { id: "s3", order: 3, titleKey: "teacher.faraday.step3", descKey: "teacher.faraday.step3_desc", formulaKey: "teacher.faraday.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.faraday.step4", descKey: "teacher.faraday.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { B: 0.5, N: 100, A: 0.01, v: 1, omega: 2, coil_x: 1 },
    equations: {
      x: "-2 + v * t > 6 ? 6 : -2 + v * t",
      y: "2",
      z: "0",
      vx: "v",
      vy: "0",
      vz: "0",
      ax: "0",
      ay: "0",
      az: "0",
      ke: "0.5 * 1 * v * v",
      pe: "0",
      total_e: "0.5 * 1 * v * v",
      speed: "abs(vx)",
      // Induced EMF proportional to rate of flux change (max near coil edges)
      flux: "B * A * exp(-(x - coil_x) * (x - coil_x) / 0.5)",
      emf: "-N * B * A * v * (x - coil_x) * exp(-(x - coil_x) * (x - coil_x) / 0.5) / 0.25",
      distance_to_coil: "abs(x - coil_x)",
    },
    stopWhen: [{ formula: "5.5 - t", description: "End of demonstration" }],
  },
};
