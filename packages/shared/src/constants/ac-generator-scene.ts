import type { PhysicsScene } from "../types/physics-scene";

// AC Generator: a coil rotating uniformly in a B-field induces a sinusoidal EMF
// EMF = N * B * A * omega * sin(omega * t) — alternating current via slip rings
export const AC_GENERATOR_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "AC Generator",
    description: "Rotating coil in magnetic field: EMF = NBAw sin(wt). Slip rings output alternating current.",
    subject: "electromagnetism",
    topic: "ac_generator",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["generator", "electromagnetic", "induction", "alternating", "current", "ac"],
  },
  entities: [
    {
      id: "coil",
      type: "ball",
      name: "Rotating Coil",
      position: [2, 2, 0],
      properties: { mass: 1, radius: 0.3 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#f59e0b", material: "metal", show_trail: true },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "induced_emf", type: "applied_force", target_entity: "coil", magnitude: "N * B * A * omega * sin(omega * t)", direction: [0, 0, 0], description: "Induced EMF drives alternating current" },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "positive_half", label: "phase.positive_half", icon: "+", timeRange: [0, 1], color: "#22c55e", description: "EMF positive, current flows one way", cameraPresetId: "wide" },
      { id: "negative_half", label: "phase.negative_half", icon: "-", timeRange: [1, 2], color: "#ef4444", description: "EMF negative, current direction flips", cameraPresetId: "wide" },
      { id: "steady", label: "phase.steady", icon: "~", timeRange: [2, 6], color: "#3b82f6", description: "Continuous cycles of alternating current", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [5, 4, 8], target: [0, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    { id: "ac_emf", name: "AC Generator EMF", expression: "EMF = N B A w sin(wt)", type: "motion" as const, variables: { N: { symbol: "N", unit: "turns", description: "Coil turns" }, B: { symbol: "B", unit: "T", description: "Magnetic field" }, A: { symbol: "A", unit: "m2", description: "Coil area" }, w: { symbol: "w", unit: "rad/s", description: "Angular velocity" } } },
    { id: "flux_variation", name: "Flux Through Coil", expression: "Phi = B A cos(wt)", type: "motion" as const, variables: { Phi: { symbol: "Phi", unit: "Wb", description: "Magnetic flux" } } },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_generator", name: "AC Generator", category: "electromagnetism", level: 2 },
    { id: "kp_ac", name: "Alternating Current", category: "electromagnetism", level: 2 },
    { id: "kp_slip_rings", name: "Slip Rings", category: "electromagnetism", level: 2 },
    { id: "kp_em_induction", name: "EM Induction", category: "electromagnetism", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.generator.step1", descKey: "teacher.generator.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.generator.step2", descKey: "teacher.generator.step2_desc", formulaKey: "teacher.generator.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.generator.step3", descKey: "teacher.generator.step3_desc", formulaKey: "teacher.generator.formula2", timeStart: 1.5 },
    { id: "s4", order: 4, titleKey: "teacher.generator.step4", descKey: "teacher.generator.step4_desc", timeStart: 3 },
  ],
  simulation: {
    params: { N: 10, B: 1, A: 0.05, omega: 3.14159, r: 2 },
    equations: {
      // Uniform rotation driven by external mechanical work (waterfall, steam, hand crank)
      x: "r * cos(omega * t)",
      y: "2",
      z: "r * sin(omega * t)",
      vx: "-r * omega * sin(omega * t)",
      vy: "0",
      vz: "r * omega * cos(omega * t)",
      ax: "-r * omega * omega * cos(omega * t)",
      ay: "0",
      az: "-r * omega * omega * sin(omega * t)",
      ke: "0.5 * 1 * r * r * omega * omega",
      pe: "0",
      total_e: "0.5 * 1 * r * r * omega * omega",
      speed: "r * omega",
      // Induced EMF: sinusoidal alternating voltage
      emf: "N * B * A * omega * sin(omega * t)",
      flux: "B * A * cos(omega * t)",
    },
    stopWhen: [],
  },
};
