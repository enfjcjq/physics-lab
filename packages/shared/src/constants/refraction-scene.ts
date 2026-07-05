import type { PhysicsScene } from "../types/physics-scene";

// Refraction: light bends at boundary between two media (Snell'\''s law)
// n1*sin(θ1) = n2*sin(θ2)
export const REFRACTION_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Refraction",
    description: "Light ray bending at medium boundary: n1·sin(θ1) = n2·sin(θ2)",
    subject: "optics",
    topic: "refraction",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["optics", "refraction", "snells_law", "refractive_index", "light"],
  },
  entities: [
    {
      id: "light_ray",
      type: "ball",
      name: "Photon",
      position: [0, 3, 0],
      properties: { mass: 0.001, radius: 0.08 },
      initial_conditions: { velocity: [1, -1, 0] },
      visual: { color: "#fbbf24", material: "glass", show_trail: true, trail_color: "#fbbf2444" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "incident", label: "phase.incident", icon: "v", timeRange: [0, 2], color: "#fbbf24", description: "Light in medium 1 (n1)", cameraPresetId: "wide" },
      { id: "boundary", label: "phase.boundary", icon: "O", timeRange: [1.8, 2.5], color: "#f59e0b", description: "Light hits boundary", cameraPresetId: "wide" },
      { id: "refracted", label: "phase.refracted", icon: "v", timeRange: [2.2, 6], color: "#3b82f6", description: "Light in medium 2 (n2)", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [3, 4, 10], target: [3, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    {
      id: "snells_law",
      name: "Snell'\''s Law",
      expression: "n1 * sinθ1 = n2 * sinθ2",
      variables: {
        n1: { symbol: "n₁", unit: "", description: "Refractive index (medium 1)" },
        n2: { symbol: "n₂", unit: "", description: "Refractive index (medium 2)" },
        "θ1": { symbol: "θ₁", unit: "°", description: "Incident angle" },
        "θ2": { symbol: "θ₂", unit: "°", description: "Refracted angle" },
      },
      type: "motion" as const,
    },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_refraction", name: "Refraction", category: "optics", level: 2 },
    { id: "kp_snells_law", name: "Snell'\''s Law", category: "optics", level: 2 },
    { id: "kp_refractive_index", name: "Refractive Index", category: "optics", level: 2 },
    { id: "kp_light_speed", name: "Speed of Light in Media", category: "optics", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.refraction.step1", descKey: "teacher.refraction.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.refraction.step2", descKey: "teacher.refraction.step2_desc", formulaKey: "teacher.refraction.formula1", timeStart: 0.8 },
    { id: "s3", order: 3, titleKey: "teacher.refraction.step3", descKey: "teacher.refraction.step3_desc", formulaKey: "teacher.refraction.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.refraction.step4", descKey: "teacher.refraction.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { n1: 1.0, n2: 1.5, theta1_deg: 45, y_boundary: 1, v_light: 3 },
    equations: {
      // Light ray: above boundary follows incident angle, below follows refracted angle
      // tan = dx/dy → x = startX + tan(θ) * (startY - y)
      // Refracted angle: sin(θ2) = (n1/n2) * sin(θ1)
      x: "y > y_boundary ? v_light * t * sin(theta1_deg * PI / 180) : 3 - (y_boundary - y) * (n2 / n1) * sin(theta1_deg * PI / 180) / cos(asin(n1 / n2 * sin(theta1_deg * PI / 180)))",
      y: "3 - v_light * t * cos(theta1_deg * PI / 180) > y_boundary ? 3 - v_light * t * cos(theta1_deg * PI / 180) : (3 - v_light * t * cos(theta1_deg * PI / 180) < 0.1 ? 0.1 : 3 - v_light * t * cos(theta1_deg * PI / 180))",
      z: "0",
      vx: "y > y_boundary ? v_light * sin(theta1_deg * PI / 180) : v_light * (n1 / n2) * sin(theta1_deg * PI / 180)",
      vy: "y > y_boundary ? -v_light * cos(theta1_deg * PI / 180) : -v_light * sqrt(1 - (n1 / n2) * (n1 / n2) * sin(theta1_deg * PI / 180) * sin(theta1_deg * PI / 180))",
      vz: "0",
      ax: "0",
      ay: "0",
      az: "0",
      ke: "0.0005 * (vx*vx + vy*vy)",
      pe: "0",
      total_e: "0.0005 * (vx*vx + vy*vy)",
      theta2_deg: "asin(n1 / n2 * sin(theta1_deg * PI / 180)) * 180 / PI",
      speed: "v_light / (y > y_boundary ? n1 : n2)",
    },
    stopWhen: [
      { formula: "3 - v_light * t * cos(theta1_deg * PI / 180) - 0.1", description: "Light exits view" },
    ],
  },
};
