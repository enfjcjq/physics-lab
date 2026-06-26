import type { PhysicsPlugin } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";

export const freeFallPlugin: PhysicsPlugin = {
  id: "free-fall",
  name: "plugin.free-fall.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "easy",

  getDefaultScene: () => FREE_FALL_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const { g, h0, mass } = params;
    const y = h0 - 0.5 * g * t * t;
    const vy = -g * t;
    const groundY = 0.2;
    if (y <= groundY && vy < 0) {
      const reboundVy = -vy * 0.6;
      return {
        time: t,
        positions: { ball: [0, groundY, 0] },
        velocities: { ball: [0, reboundVy, 0] },
        accelerations: { ball: [0, -g, 0] },
        energies: {
          kinetic: 0.5 * mass * reboundVy * reboundVy,
          potential: mass * g * groundY,
          total: 0.5 * mass * reboundVy * reboundVy + mass * g * groundY,
        },
      };
    }
    const speed = Math.abs(vy);
    return {
      time: t,
      positions: { ball: [0, Math.max(y, groundY), 0] },
      velocities: { ball: [0, vy, 0] },
      accelerations: { ball: [0, -g, 0] },
      energies: {
        kinetic: 0.5 * mass * speed * speed,
        potential: mass * g * Math.max(y, 0),
        total: 0.5 * mass * speed * speed + mass * g * Math.max(y, 0),
      },
    };
  },

  getControls: () => [
    { id: "h0", label: "ctrl.height", type: "slider", defaultValue: 10, min: 1, max: 50, step: 0.5, unit: "m", group: "initial" },
    { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 30, step: 0.1, unit: "m/s2", group: "physics" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 2, min: 0.1, max: 10, step: 0.1, unit: "kg", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp1", name: "Free Fall", category: "Kinematics", mastered: true },
    { id: "kp2", name: "Constant Acceleration", category: "Kinematics", mastered: true },
    { id: "kp3", name: "Newton 2nd Law", category: "Dynamics", mastered: false },
    { id: "kp4", name: "Energy Conservation", category: "Energy", mastered: false },
  ],

  getForceAnalysis: () => [
    {
      name: "Gravity",
      symbol: "G",
      direction: "Downward",
      magnitude: "G = mg",
      description: "Only gravity acts on the object in ideal free fall.",
    },
  ],

  getMotionAnalysis: () => [
    { title: "Motion Type", content: "Constant acceleration motion. Initial velocity is zero.", formula: "a = g (downward)" },
    { title: "Displacement", content: "From release point, displacement follows quadratic law.", formula: "h = 1/2 * g * t^2" },
    { title: "Velocity", content: "Velocity increases linearly with time.", formula: "v = g * t" },
    { title: "Impact", content: "Impact occurs when h equals initial height.", formula: "t_impact = sqrt(2h0/g)" },
  ],

  getDerivation: () => [
    { step: 1, title: "Given", formula: "h0, g, v0 = 0", explanation: "Known physical quantities." },
    { step: 2, title: "Kinematic equation", formula: "v^2 = 2g(h0 - h)", explanation: "Velocity-displacement relation." },
    { step: 3, title: "At impact (h = 0)", formula: "v = sqrt(2*g*h0)", explanation: "Substitute h = 0." },
    { step: 4, title: "Result", formula: "v = sqrt(2*9.8*10) = 14 m/s", explanation: "Final answer." },
  ],

  getPhases: () => [
    { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.05] },
    { id: "falling", label: "phase.falling", icon: "v", timeRange: [0.05, 1.4] },
    { id: "impact", label: "phase.impact", icon: "O", timeRange: [1.35, 1.5] },
    { id: "bounce", label: "phase.bounce", icon: "^", timeRange: [1.5, 4.0] },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [8, 6, 8], target: [0, 5, 0], fov: 60 },
    { id: "closeup", label: "Close-up", position: [3, 4, 3], target: [0, 4, 0], fov: 45 },
    { id: "impact", label: "Impact", position: [2, 1, 2], target: [0, 0.5, 0], fov: 35 },
  ],
};
