﻿import type { PhysicsPlugin, PhysicsScene } from "@physics-lab/shared";
import { CIRCULAR_MOTION_SCENE } from "@physics-lab/shared";

// Using shared CIRCULAR_MOTION_SCENE from @physics-lab/shared

export const circularMotionPlugin: PhysicsPlugin = {
  id: "circular-motion",
  name: "plugin.circular-motion.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => CIRCULAR_MOTION_SCENE as unknown as PhysicsScene,

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