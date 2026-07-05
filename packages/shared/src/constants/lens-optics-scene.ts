import type { PhysicsScene } from "../types/physics-scene";

// Lens Optics: 1/f = 1/u + 1/v
// Light rays converge through a convex lens to form an image
export const LENS_OPTICS_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Lens Optics",
    description: "Convex lens: 1/f = 1/u + 1/v. Light rays refract through lens to form image.",
    subject: "optics",
    topic: "lens_optics",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["optics", "lens", "refraction", "image", "focal"],
  },
  entities: [
    {
      id: "object_point",
      type: "ball",
      name: "Object Point",
      position: [-3, 2, 0],
      properties: { mass: 0.001, radius: 0.1 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#fbbf24", material: "glass" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [],
  timeline: {
    total_duration: 5,
    fps: 60,
    events: [],
    phases: [
      { id: "rays_from_object", label: "phase.rays", icon: "v", timeRange: [0, 2], color: "#fbbf24", description: "Rays from object to lens", cameraPresetId: "wide" },
      { id: "through_lens", label: "phase.lens", icon: "O", timeRange: [1.8, 2.5], color: "#f59e0b", description: "Rays refract through lens", cameraPresetId: "wide" },
      { id: "to_image", label: "phase.image", icon: "v", timeRange: [2.2, 5], color: "#22c55e", description: "Rays converge to image", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [3, 5, 10], target: [0, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    { id: "lens_eq", name: "Lens Equation", expression: "1/f = 1/u + 1/v", type: "motion" as const, variables: { f: { symbol: "f", unit: "m", description: "Focal length" }, u: { symbol: "u", unit: "m", description: "Object distance" }, v: { symbol: "v", unit: "m", description: "Image distance" } } },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_lens", name: "Lens Optics", category: "optics", level: 2 },
    { id: "kp_focal", name: "Focal Length", category: "optics", level: 2 },
    { id: "kp_image", name: "Image Formation", category: "optics", level: 2 },
    { id: "kp_magnification", name: "Magnification", category: "optics", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.lens.step1", descKey: "teacher.lens.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.lens.step2", descKey: "teacher.lens.step2_desc", formulaKey: "teacher.lens.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.lens.step3", descKey: "teacher.lens.step3_desc", formulaKey: "teacher.lens.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.lens.step4", descKey: "teacher.lens.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { f: 2, u: 4, v: 4, lens_x: 0, obj_y: 2 },
    equations: {
      // Light ray from object to lens
      x: "-u + (u + lens_x) * t / 2 > lens_x ? lens_x : -u + (u + lens_x) * t / 2",
      y: "obj_y",
      z: "0",
      vx: "t < 2 ? (u + lens_x) / 2 : (v - lens_x) / 3",
      vy: "0",
      vz: "0",
      ax: "0",
      ay: "0",
      az: "0",
      ke: "0.0005 * vx * vx",
      pe: "0",
      total_e: "0.0005 * ((u + lens_x) / 2) * ((u + lens_x) / 2)",
      speed: "abs(vx)",
      magnification: "v / u",
      image_distance: "1 / (1/f - 1/u)",
    },
    stopWhen: [{ formula: "4.5 - t", description: "End of ray trace" }],
  },
};
