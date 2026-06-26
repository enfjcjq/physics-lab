import type { PhysicsPlugin } from "@physics-lab/shared";
import { INCLINED_PLANE_SCENE } from "@physics-lab/shared";

export const inclinedPlanePlugin: PhysicsPlugin = {
  id: "inclined-plane",
  name: "plugin.inclined-plane.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => INCLINED_PLANE_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const { g, angle, friction, mass } = params;
    const theta = (angle * Math.PI) / 180;
    const mu = friction ?? 0.3;

    // Net acceleration along incline
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const a = g * (sinT - mu * cosT);

    // If friction is strong enough, block doesn't move
    const effA = a > 0 ? a : 0;

    // Position along incline
    const L = 8; // incline length
    const s = 0.5 * effA * t * t;
    const clampedS = Math.min(s, L);

    // Velocity along incline
    const v = effA * t;
    const clampedV = clampedS >= L ? 0 : v;

    // World position: along the incline
    const worldX = clampedS * cosT;
    const worldY = 5 - clampedS * sinT; // Starting height at top

    // Height for PE calculation
    const h = Math.max(0, 5 - clampedS * sinT);

    return {
      time: t,
      positions: { ball: [worldX, worldY, 0] },
      velocities: { ball: [clampedV * cosT, -clampedV * sinT, 0] },
      accelerations: { ball: [effA * cosT, -effA * sinT, 0] },
      energies: {
        kinetic: clampedS >= L ? 0 : 0.5 * mass * clampedV * clampedV,
        potential: mass * g * h,
        total: mass * g * 5, // Conservation: initial PE
      },
    };
  },

  getControls: () => [
    { id: "angle", label: "ctrl.incline_angle", type: "slider", defaultValue: 30, min: 10, max: 60, step: 1, unit: "deg", group: "incline" },
    { id: "friction", label: "ctrl.friction", type: "slider", defaultValue: 0.3, min: 0, max: 0.8, step: 0.05, unit: "", group: "incline" },
    { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 30, step: 0.1, unit: "m/s2", group: "physics" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 2, min: 0.5, max: 10, step: 0.5, unit: "kg", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp1", name: "Force Decomposition", category: "Forces", mastered: true },
    { id: "kp2", name: "Normal Force", category: "Forces", mastered: false },
    { id: "kp3", name: "Friction", category: "Forces", mastered: false },
    { id: "kp4", name: "Inclined Plane Motion", category: "Kinematics", mastered: false },
  ],

  getForceAnalysis: () => [
    { name: "Gravity", symbol: "G", direction: "Vertically downward", magnitude: "G = mg", description: "Decompose into parallel and perpendicular components." },
    { name: "Normal Force", symbol: "N", direction: "Perpendicular to incline surface", magnitude: "N = mg*cos(theta)", description: "Balances the perpendicular component of gravity." },
    { name: "Friction", symbol: "f", direction: "Up the incline (opposing motion)", magnitude: "f = mu*mg*cos(theta)", description: "Kinetic friction opposes motion along the surface." },
  ],

  getMotionAnalysis: () => [
    { title: "Net Force", content: "Along the incline: F_net = mg*sin(theta) - mu*mg*cos(theta)", formula: "F_net = mg*(sin(theta) - mu*cos(theta))" },
    { title: "Acceleration", content: "a = g*(sin(theta) - mu*cos(theta)). Constant if net force is positive.", formula: "a = g*(sin(theta) - mu*cos(theta))" },
    { title: "Critical Angle", content: "If mu > tan(theta), the block stays still (static friction wins).", formula: "mu_critical = tan(theta)" },
  ],

  getDerivation: () => [
    { step: 1, title: "Decompose gravity", formula: "G_parallel = mg*sin(theta)", explanation: "Component of gravity along the incline." },
    { step: 2, title: "Normal force", formula: "N = mg*cos(theta)", explanation: "Perpendicular component. No acceleration in this direction." },
    { step: 3, title: "Friction", formula: "f = mu*N = mu*mg*cos(theta)", explanation: "Kinetic friction opposes motion." },
    { step: 4, title: "Newton 2nd Law", formula: "F_net = mg*sin(theta) - mu*mg*cos(theta) = ma", explanation: "Net force equals mass times acceleration." },
    { step: 5, title: "Result", formula: "a = g*(sin(theta) - mu*cos(theta))", explanation: "Constant acceleration down the incline." },
  ],

  getPhases: () => [
    { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.05] },
    { id: "sliding", label: "phase.sliding", icon: "/", timeRange: [0.05, 1.45] },
    { id: "reaching_bottom", label: "phase.reaching_bottom", icon: ">", timeRange: [1.4, 1.6] },
    { id: "ground_slide", label: "phase.ground_slide", icon: "_", timeRange: [1.6, 3.0] },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [6, 4, 10], target: [2, 3, 0], fov: 55 },
    { id: "bottom", label: "Bottom", position: [5, 1, 6], target: [5, 1, 0], fov: 50 },
  ],
};
