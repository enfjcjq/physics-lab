import type { PhysicsScene } from "../types/physics-scene";

export const CIRCULAR_MOTION_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Circular Motion",
    description: "Uniform circular motion with centripetal force",
    subject: "mechanics",
    topic: "circular_motion",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["circular", "centripetal", "angular"],
  },
  entities: [
    {
      id: "ball",
      type: "ball",
      name: "Orbiting Ball",
      position: [2, 3, 0],
      properties: { mass: 1, radius: 0.2 },
      initial_conditions: { velocity: [0, 0, 2] },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "centripetal", type: "centripetal_force", target_entity: "ball", magnitude: "m * r * omega * omega", direction: [0, 0, 0], description: "Centripetal force toward center" },
  ],
  timeline: {
    total_duration: 6.28,
    fps: 60,
    events: [],
    phases: [
      { id: "start", label: "Start", icon: "?", timeRange: [0, 0.5], cameraPresetId: "overview" },
      { id: "orbiting", label: "Uniform Circular Motion", icon: "??", timeRange: [0.5, 5.8], cameraPresetId: "overview" },
      { id: "complete", label: "Full Circle", icon: "?", timeRange: [5.8, 6.28], cameraPresetId: "overview" },
    ],
  },
  camera_script: [
    { id: "overview", time: 0, position: [8, 8, 8], target: [0, 3, 0] },
    { id: "side", time: 0, position: [10, 3, 0], target: [0, 3, 0] },
  ],
  constraints: [],
  equations: [],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_circ_ucm", name: "Uniform Circular Motion", category: "mechanics", level: 1 },
    { id: "kp_circ_centripetal", name: "Centripetal Acceleration", category: "mechanics", level: 2 },
    { id: "kp_circ_force", name: "Centripetal Force", category: "mechanics", level: 2 },
    { id: "kp_circ_period", name: "Period & Frequency", category: "mechanics", level: 2 },
  ],
  teacher_steps: [
    { id: "s0", order: 0, timeStart: 0, titleKey: "teacher.circ.step0", descKey: "teacher.circ.step0_desc" },
    { id: "s1", order: 1, timeStart: 0.5, titleKey: "teacher.circ.step1", descKey: "teacher.circ.step1_desc", formulaKey: "teacher.circ.formula1" },
    { id: "s2", order: 2, timeStart: 2, titleKey: "teacher.circ.step2", descKey: "teacher.circ.step2_desc", formulaKey: "teacher.circ.formula2" },
    { id: "s3", order: 3, timeStart: 3.5, titleKey: "teacher.circ.step3", descKey: "teacher.circ.step3_desc", formulaKey: "teacher.circ.formula3" },
    { id: "s4", order: 4, timeStart: 5, titleKey: "teacher.circ.step4", descKey: "teacher.circ.step4_desc" },
  ],
  simulation: {
    params: { r: 2, omega: 3.14, y0: 3, m: 1 },
    equations: {
      x: "r * cos(omega * t)",
      y: "y0",
      z: "r * sin(omega * t)",
      vx: "-r * omega * sin(omega * t)",
      vy: "0",
      vz: "r * omega * cos(omega * t)",
      ax: "-r * omega * omega * cos(omega * t)",
      ay: "0",
      az: "-r * omega * omega * sin(omega * t)",
      ke: "0.5 * m * r * r * omega * omega",
      pe: "0",
      total_e: "0.5 * m * r * r * omega * omega",
      speed: "abs(r * omega)",
    },
    stopWhen: [],
  },
};

