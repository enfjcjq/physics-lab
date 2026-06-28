import type { PhysicsScene } from "../types/physics-scene";

export const BUOYANCY_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Buoyancy",
    description: "Archimedes principle ? buoyant force in fluid",
    subject: "mechanics",
    topic: "buoyancy",
    difficulty: "medium",
    grade: "junior_high",
    tags: ["buoyancy", "archimedes", "fluid", "density"],
  },
  entities: [
    {
      id: "block",
      type: "block",
      name: "Object",
      position: [0, 2, 0],
      properties: { mass: 0.8, dimensions: [0.5, 0.5, 0.5] },
      initial_conditions: { velocity: [0, 0, 0] },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 9.8, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "buoyancy", type: "buoyancy", target_entity: "block", magnitude: "rho_fluid * V * g", direction: [0, 1, 0], description: "Buoyant force upward" },
    { id: "gravity_force", type: "gravity", target_entity: "block", magnitude: "rho_obj * V * g", direction: [0, -1, 0], description: "Weight downward" },
  ],
  timeline: {
    total_duration: 8,
    fps: 60,
    events: [],
    phases: [
      { id: "release", label: "Release", icon: "?", timeRange: [0, 0.3] },
      { id: "moving", label: "Buoyancy Motion", icon: "????", timeRange: [0.3, 7] },
      { id: "equilibrium", label: "Equilibrium", icon: "??", timeRange: [7, 8] },
    ],
  },
  camera_script: [
    { id: "overview", time: 0, position: [6, 5, 8], target: [0, 2.5, 0] },
    { id: "side", time: 0, position: [8, 2.5, 0], target: [0, 2.5, 0] },
  ],
  constraints: [],
  equations: [],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_buoy_archimedes", name: "Archimedes Principle", category: "mechanics", level: 1 },
    { id: "kp_buoy_force", name: "Buoyant Force", category: "mechanics", level: 2 },
    { id: "kp_buoy_density", name: "Density & Floating", category: "mechanics", level: 2 },
    { id: "kp_buoy_net_force", name: "Net Force in Fluid", category: "mechanics", level: 2 },
  ],
  teacher_steps: [
    { id: "s0", order: 0, timeStart: 0, titleKey: "teacher.buoy.step0", descKey: "teacher.buoy.step0_desc" },
    { id: "s1", order: 1, timeStart: 0.3, titleKey: "teacher.buoy.step1", descKey: "teacher.buoy.step1_desc", formulaKey: "teacher.buoy.formula1" },
    { id: "s2", order: 2, timeStart: 3, titleKey: "teacher.buoy.step2", descKey: "teacher.buoy.step2_desc", formulaKey: "teacher.buoy.formula2" },
    { id: "s3", order: 3, timeStart: 5, titleKey: "teacher.buoy.step3", descKey: "teacher.buoy.step3_desc", formulaKey: "teacher.buoy.formula3" },
    { id: "s4", order: 4, timeStart: 7, titleKey: "teacher.buoy.step4", descKey: "teacher.buoy.step4_desc" },
  ],
  simulation: {
    params: { rho_obj: 800, rho_fluid: 1000, V: 0.001, y0: 2, g: 9.8, drag: 5 },
    equations: {
      x: "0",
      y: "y0 + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag) * t + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag * drag) * (exp(-drag * t) - 1) > 4 ? 4 : (y0 + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag) * t + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag * drag) * (exp(-drag * t) - 1) < 0.3 ? 0.3 : y0 + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag) * t + (rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag * drag) * (exp(-drag * t) - 1))",
      z: "0",
      vx: "0",
      vy: "(rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V * drag) * (1 - exp(-drag * t))",
      vz: "0",
      ax: "0",
      ay: "(rho_fluid * V * g - rho_obj * V * g) / (rho_obj * V) * exp(-drag * t)",
      az: "0",
      ke: "0.5 * rho_obj * V * vy * vy",
      pe: "rho_obj * V * g * y",
      total_e: "rho_obj * V * g * y0",
      speed: "abs(vy)",
    },
    stopWhen: [],
  },
};
