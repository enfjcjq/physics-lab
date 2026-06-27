import type { PhysicsPlugin } from "@physics-lab/shared";
import { PENDULUM_SCENE } from "@physics-lab/shared";

export const pendulumPlugin: PhysicsPlugin = {
  id: "pendulum",
  name: "plugin.pendulum.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => PENDULUM_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const L = params.L ?? 4.5;
    const g = params.g ?? 9.8;
    const theta0Deg = params.theta0 ?? 20;
    const theta0 = (theta0Deg * Math.PI) / 180;
    const mass = params.mass ?? 1;

    const omega = Math.sqrt(g / L);
    const theta = theta0 * Math.cos(omega * t);
    const omega_t = -theta0 * omega * Math.sin(omega * t);

    // Convert to Cartesian: pivot at (0, 6), string length L
    const pivotX = 0, pivotY = 6;
    const x = pivotX + L * Math.sin(theta);
    const y = pivotY - L * Math.cos(theta);

    // Velocity magnitude = L * |angular velocity|
    const v_mag = L * Math.abs(omega_t);
    const vx = L * omega_t * Math.cos(theta);
    const vy = L * omega_t * Math.sin(theta);

    // Acceleration: centripetal + tangential
    const ax = -L * omega * omega * Math.sin(theta);
    const ay = L * omega * omega * Math.cos(theta);

    const ke = 0.5 * mass * v_mag * v_mag;
    const pe = mass * g * (pivotY - L * Math.cos(theta0) - (pivotY - L * Math.cos(theta)));
    // Simplified PE: relative to lowest point

    return {
      time: t,
      positions: { ball: [x, y, 0] },
      velocities: { ball: [vx, vy, 0] },
      accelerations: { ball: [ax, ay, 0] },
      energies: { kinetic: ke, potential: pe, total: ke + pe },
    };
  },

  getControls: () => [
    { id: "L", label: "ctrl.string_length", type: "slider", defaultValue: 4.5, min: 1, max: 8, step: 0.1, unit: "m", group: "setup" },
    { id: "theta0", label: "ctrl.initial_angle", type: "slider", defaultValue: 20, min: 5, max: 45, step: 1, unit: "deg", group: "initial" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 1, min: 0.2, max: 5, step: 0.1, unit: "kg", group: "physics" },
    { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 20, step: 0.5, unit: "m/s^2", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp_shm", name: "Simple Harmonic Motion", category: "mechanics", mastered: false },
    { id: "kp_pendulum", name: "Simple Pendulum", category: "mechanics", mastered: false },
    { id: "kp_period_formula", name: "Period Formula", category: "mechanics", mastered: false },
  ],

  getForceAnalysis: () => [
    { name: "Gravity", symbol: "G", direction: "Downward", magnitude: "G = mg", description: "Constant downward force" },
    { name: "Tension", symbol: "T", direction: "Toward pivot", magnitude: "T = mg*cos(theta) + m*v^2/L", description: "String tension varies with position" },
  ],

  getMotionAnalysis: () => [
    { title: "Angular SHM", content: "For small angles (theta < 15deg), motion is simple harmonic.", formula: "theta(t) = theta0 * cos(omega*t)" },
    { title: "Period", content: "Period is independent of amplitude and mass.", formula: "T = 2*pi*sqrt(L/g)" },
    { title: "Energy Conversion", content: "KE <-> PE conversion. At lowest point, all PE converted to KE.", formula: "v_max = sqrt(2gL(1-cos theta0))" },
  ],

  getDerivation: () => [
    { step: 1, title: "Forces", formula: "Tangential: -mg*sin(theta)", explanation: "Only tangential component of gravity causes motion." },
    { step: 2, title: "Newton 2nd Law", formula: "m*L*d^2theta/dt^2 = -mg*sin(theta)", explanation: "Apply F=ma for rotational motion." },
    { step: 3, title: "Small angle approx", formula: "sin(theta) ~ theta", explanation: "For theta < 15deg, sin(theta) approximates theta." },
    { step: 4, title: "SHM equation", formula: "d^2theta/dt^2 + (g/L)*theta = 0", explanation: "This is the SHM differential equation." },
    { step: 5, title: "Solution", formula: "theta(t) = theta0 * cos(omega*t)", explanation: "where omega = sqrt(g/L)." },
    { step: 6, title: "Period", formula: "T = 2*pi/omega = 2*pi*sqrt(L/g)", explanation: "Period depends only on L and g." },
  ],

  getPhases: () => [
    { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.1] },
    { id: "swinging", label: "phase.oscillating", icon: "~", timeRange: [0.05, 4.5] },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Front View", position: [4, 3, 8], target: [1, 3, 0], fov: 55 },
    { id: "side", label: "Side View", position: [8, 3, 0], target: [1, 3, 0], fov: 50 },
  ],
};
