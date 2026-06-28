import type { PhysicsPlugin } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";

export const freeFallPlugin: PhysicsPlugin = {
  id: "free-fall",
  name: "plugin.free-fall.name",
  version: "1.1.0",
  category: "mechanics",
  difficulty: "easy",

  getDefaultScene: () => FREE_FALL_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const { g, h0, mass } = params;
    // Ideal free-fall kinematics: ball falls, stops at ground (no bounce)
    const impactTime = Math.sqrt(2 * h0 / g);
    const groundY = 0.2;

    if (t >= impactTime) {
      // Ball has landed — hold at rest on ground
      return {
        time: t,
        positions: { ball: [0, groundY, 0] },
        velocities: { ball: [0, 0, 0] },
        accelerations: { ball: [0, 0, 0] },
        energies: {
          kinetic: 0,
          potential: mass * g * groundY,
          total: mass * g * groundY,
        },
      };
    }

    const y = h0 - 0.5 * g * t * t;
    const vy = -g * t;
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
    { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 30, step: 0.1, unit: "m/s²", group: "physics" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 2, min: 0.1, max: 10, step: 0.1, unit: "kg", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp1", name: "Free Fall", category: "Kinematics", mastered: true },
    { id: "kp2", name: "Constant Acceleration", category: "Kinematics", mastered: true },
    { id: "kp3", name: "Newton''s 2nd Law", category: "Dynamics", mastered: false },
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
    { title: "Displacement", content: "From release point, displacement follows quadratic law.", formula: "h = ½gt²" },
    { title: "Velocity", content: "Velocity increases linearly with time.", formula: "v = gt" },
    { title: "Impact Time", content: "Time to reach ground from height h₀.", formula: "t = √(2h₀/g)" },
    { title: "Impact Velocity", content: "Maximum velocity at ground.", formula: "vₘₐₓ = √(2gh₀)" },
  ],

  getDerivation: () => [
    { step: 1, title: "Known Quantities", formula: "h₀, g, v₀ = 0", explanation: "Initial height, gravity, initial velocity." },
    { step: 2, title: "Kinematic Equation", formula: "v² = 2g(h₀ − h)", explanation: "Velocity-displacement relation from constant acceleration." },
    { step: 3, title: "At Impact (h = 0)", formula: "v = √(2gh₀)", explanation: "Substitute h = 0 to find impact velocity." },
    { step: 4, title: "Numerical Result", formula: "v = √(2 × 9.8 × 10) ≈ 14 m/s", explanation: "Plug in typical values." },
  ],

  getPhases: () => [
    { id: "release", label: "phase.release", icon: "●", timeRange: [0, 0.05], color: "#22c55e", description: "Initial state: ball is held at rest" },
    { id: "falling", label: "phase.falling", icon: "↓", timeRange: [0.05, 1.4], color: "#3b82f6", description: "Ball accelerates downward under gravity" },
    { id: "impact", label: "phase.impact", icon: "▼", timeRange: [1.3, 1.6], color: "#f59e0b", description: "Ball reaches ground, experiment complete" },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [8, 6, 8], target: [0, 5, 0], fov: 60 },
    { id: "closeup", label: "Close-up", position: [3, 4, 3], target: [0, 4, 0], fov: 45 },
    { id: "impact", label: "Impact", position: [2, 1, 2], target: [0, 0.5, 0], fov: 35 },
  ],
};
