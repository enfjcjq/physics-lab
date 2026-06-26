import type { PhysicsPlugin } from "@physics-lab/shared";
import { SPRING_MASS_SCENE } from "@physics-lab/shared";

export const springMassPlugin: PhysicsPlugin = {
  id: "spring-mass",
  name: "plugin.spring-mass.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => SPRING_MASS_SCENE,

  computeState: (t: number, params: Record<string, number>) => {
    const { k, mass, amplitude } = params;
    const m = mass ?? 1;
    const K = k ?? 10;
    const A = amplitude ?? 2;
    const omega = Math.sqrt(K / m);
    const eqY = 3; // equilibrium Y position
    const y = eqY + A * Math.cos(omega * t);
    const vy = -A * omega * Math.sin(omega * t);
    const ke = 0.5 * m * vy * vy;
    const displacement = y - eqY;
    const pe = 0.5 * K * displacement * displacement;

    return {
      time: t,
      positions: { ball: [0, y, 0] },
      velocities: { ball: [0, vy, 0] },
      accelerations: { ball: [0, -omega * omega * displacement, 0] },
      energies: { kinetic: ke, potential: pe, total: ke + pe },
    };
  },

  getControls: () => [
    { id: "k", label: "ctrl.spring_constant", type: "slider", defaultValue: 10, min: 2, max: 30, step: 0.5, unit: "N/m", group: "spring" },
    { id: "amplitude", label: "ctrl.amplitude", type: "slider", defaultValue: 2, min: 0.5, max: 4, step: 0.1, unit: "m", group: "initial" },
    { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 1, min: 0.2, max: 5, step: 0.1, unit: "kg", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp_s1", name: "Hooke Law", category: "Forces", mastered: false },
    { id: "kp_s2", name: "Simple Harmonic Motion", category: "Kinematics", mastered: false },
    { id: "kp_s3", name: "Oscillation Period", category: "Kinematics", mastered: false },
  ],

  getForceAnalysis: () => [
    { name: "Spring Force", symbol: "F_s", direction: "Toward equilibrium", magnitude: "F = -k*x", description: "Restoring force proportional to displacement. Always points to equilibrium." },
  ],

  getMotionAnalysis: () => [
    { title: "SHM", content: "Acceleration is proportional to negative displacement: a = -omega^2 * x.", formula: "x(t) = A*cos(omega*t)" },
    { title: "Period", content: "T = 2*pi*sqrt(m/k). Independent of amplitude.", formula: "T = 2*pi*sqrt(m/k)" },
    { title: "Energy", content: "KE + PE = constant. Energy continuously converts between kinetic and potential.", formula: "E = 1/2*k*A^2" },
  ],

  getDerivation: () => [
    { step: 1, title: "Hooke Law", formula: "F = -k*x", explanation: "Spring force is proportional to displacement." },
    { step: 2, title: "Newton 2nd Law", formula: "m*a = -k*x", explanation: "Apply F=ma." },
    { step: 3, title: "Differential equation", formula: "d^2x/dt^2 + (k/m)*x = 0", explanation: "This defines simple harmonic motion." },
    { step: 4, title: "Solution", formula: "x(t) = A*cos(omega*t)", explanation: "where omega = sqrt(k/m)." },
    { step: 5, title: "Period", formula: "T = 2*pi/omega = 2*pi*sqrt(m/k)", explanation: "One complete oscillation." },
  ],

  getPhases: () => [
    { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.05] },
    { id: "oscillating", label: "phase.oscillating", icon: "~", timeRange: [0.05, 5.0] },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [6, 3, 8], target: [0, 3, 0], fov: 55 },
  ],
};
