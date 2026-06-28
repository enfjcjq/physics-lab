import type { PhysicsPlugin } from "@physics-lab/shared";

const CIRCULAR_MOTION_SCENE = {
  version: "2.0" as const,
  metadata: {
    title: "Circular Motion",
    description: "Uniform circular motion with centripetal force",
    subject: "mechanics" as const,
    topic: "circular_motion" as const,
    difficulty: "medium" as const,
    grade: "senior_high" as const,
    tags: ["circular", "centripetal", "angular"],
  },
  entities: [
    {
      id: "ball_1",
      type: "ball" as const,
      name: "Orbiting Ball",
      position: [2, 3, 0] as [number, number, number],
      properties: { mass: 1, radius: 0.2 },
      initial_conditions: { velocity: [0, 0, 2] as [number, number, number] },
    },
  ],
  environment: [
    { type: "gravity_field" as const, properties: { acceleration: 0, direction: [0, -1, 0] as [number, number, number] } },
  ],
  forces: [
    { id: "centripetal", type: "centripetal" as const, target_entity: "ball_1", magnitude: "mv^2/r", direction: [0, 0, 0] as [number, number, number] },
  ],
  timeline: {
    total_duration: 6,
    fps: 60,
    phases: [
      { id: "start", label: "Start", timeRange: [0, 0.5] as [number, number] },
      { id: "orbiting", label: "Uniform Circular Motion", timeRange: [0.5, 5.5] as [number, number] },
      { id: "complete", label: "Full Circle", timeRange: [5.5, 6] as [number, number] },
    ],
  },
  equations: [],
  knowledge_tags: [
    { id: "kp_circ_ucm", name: "Uniform Circular Motion", prerequisites: [] },
    { id: "kp_circ_centripetal", name: "Centripetal Acceleration", prerequisites: ["kp_circ_ucm"] },
    { id: "kp_circ_force", name: "Centripetal Force", prerequisites: ["kp_circ_centripetal"] },
    { id: "kp_circ_period", name: "Period & Frequency", prerequisites: ["kp_circ_ucm"] },
  ],
  teacher_steps: [
    { order: 0, timeStart: 0, timeEnd: 0.5, titleKey: "teacher.circ.step0", descKey: "teacher.circ.step0_desc" },
    { order: 1, timeStart: 0.5, timeEnd: 2, titleKey: "teacher.circ.step1", descKey: "teacher.circ.step1_desc", formulaKey: "teacher.circ.formula1" },
    { order: 2, timeStart: 2, timeEnd: 3.5, titleKey: "teacher.circ.step2", descKey: "teacher.circ.step2_desc", formulaKey: "teacher.circ.formula2" },
    { order: 3, timeStart: 3.5, timeEnd: 5, titleKey: "teacher.circ.step3", descKey: "teacher.circ.step3_desc", formulaKey: "teacher.circ.formula3" },
    { order: 4, timeStart: 5, timeEnd: 6, titleKey: "teacher.circ.step4", descKey: "teacher.circ.step4_desc" },
  ],
};

export const circularMotionPlugin: PhysicsPlugin = {
  id: "circular-motion",
  name: "plugin.circular-motion.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => CIRCULAR_MOTION_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const r = params.r ?? 2;
    const omega = params.omega ?? Math.PI;
    const mass = params.mass ?? 1;
    const y = params.y0 ?? 3;

    const x = r * Math.cos(omega * t);
    const z = r * Math.sin(omega * t);
    const vx = -r * omega * Math.sin(omega * t);
    const vz = r * omega * Math.cos(omega * t);
    const ax = -r * omega * omega * Math.cos(omega * t);
    const az = -r * omega * omega * Math.sin(omega * t);
    const speed = Math.abs(r * omega);

    return {
      time: t,
      positions: { ball_1: [x, y, z] },
      velocities: { ball_1: [vx, 0, vz] },
      accelerations: { ball_1: [ax, 0, az] },
      energies: {
        kinetic: 0.5 * mass * speed * speed,
        potential: 0,
        total: 0.5 * mass * speed * speed,
      },
    };
  },

  getControls: () => [
    { id: "r", label: "ctrl.radius", type: "slider", defaultValue: 2, min: 0.5, max: 6, step: 0.1, unit: "m", group: "geometry" },
    { id: "omega", label: "ctrl.angular_velocity", type: "slider", defaultValue: Math.PI, min: 0.5, max: 10, step: 0.1, unit: "rad/s", group: "motion" },
    { id: "y0", label: "ctrl.height", type: "slider", defaultValue: 3, min: 0.5, max: 10, step: 0.5, unit: "m", group: "geometry" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 1, min: 0.1, max: 10, step: 0.1, unit: "kg", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp_circ_ucm", name: "Uniform Circular Motion", category: "mechanics", mastered: false },
    { id: "kp_circ_centripetal", name: "Centripetal Acceleration", category: "mechanics", mastered: false },
    { id: "kp_circ_force", name: "Centripetal Force", category: "mechanics", mastered: false },
    { id: "kp_circ_period", name: "Period & Frequency", category: "mechanics", mastered: false },
  ],

  getForceAnalysis: () => [
    { name: "Centripetal Force", symbol: "F\u1D9C", direction: "Toward center", magnitude: "mv\u00B2/r = mr\u03C9\u00B2", description: "The net force directed toward the center of the circle, causing centripetal acceleration." },
  ],

  getMotionAnalysis: () => [
    { title: "Motion Type", content: "Uniform circular motion: constant speed, continuously changing direction.", formula: "v = r\u03C9" },
    { title: "Centripetal Acceleration", content: "Always directed toward the center, perpendicular to velocity.", formula: "a\u1D9C = v\u00B2/r = r\u03C9\u00B2" },
    { title: "Period", content: "Time for one complete revolution.", formula: "T = 2\u03C0/\u03C9 = 2\u03C0r/v" },
    { title: "Frequency", content: "Revolutions per second.", formula: "f = 1/T = \u03C9/2\u03C0" },
    { title: "Velocity Direction", content: "Always tangent to the circle, perpendicular to radius.", formula: "" },
  ],

  getDerivation: () => [
    { step: 1, title: "Position Vector", formula: "r\u20D7 = r\u00B7(cos\u03B8 \u00EE + sin\u03B8 \u0135)", explanation: "Position in polar coordinates, \u03B8 = \u03C9t" },
    { step: 2, title: "Velocity", formula: "v\u20D7 = dr\u20D7/dt = r\u03C9\u00B7(-\u200Bsin\u03B8 \u00EE + cos\u03B8 \u0135)", explanation: "Derivative of position. |v\u20D7| = r\u03C9" },
    { step: 3, title: "Acceleration", formula: "a\u20D7 = dv\u20D7/dt = -r\u03C9\u00B2\u00B7(cos\u03B8 \u00EE + sin\u03B8 \u0135)", explanation: "Magnitude a = r\u03C9\u00B2 = v\u00B2/r, directed inward" },
    { step: 4, title: "Centripetal Force", formula: "F\u1D9C = ma\u1D9C = mv\u00B2/r = mr\u03C9\u00B2", explanation: "From Newton's 2nd Law. Always toward center." },
  ],

  getPhases: () => [
    { id: "start", label: "Start", icon: "\u25B6", timeRange: [0, 0.5], cameraPresetId: "overview" },
    { id: "orbiting", label: "Uniform Circular Motion", icon: "\uD83D\uDD04", timeRange: [0.5, 5.5], cameraPresetId: "side" },
    { id: "complete", label: "Full Circle", icon: "\u2705", timeRange: [5.5, 6], cameraPresetId: "overview" },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [8, 8, 8], target: [0, 3, 0] },
    { id: "side", label: "Side View", position: [10, 3, 0], target: [0, 3, 0] },
  ],
};