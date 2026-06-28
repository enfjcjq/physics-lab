﻿import type { PhysicsPlugin, PhysicsScene } from "@physics-lab/shared";
import { BUOYANCY_SCENE } from "@physics-lab/shared";

// Using shared BUOYANCY_SCENE from @physics-lab/shared

export const buoyancyPlugin: PhysicsPlugin = {
  id: "buoyancy",
  name: "plugin.buoyancy.name",
  version: "1.0.0",
  category: "mechanics",
  difficulty: "medium",

  getDefaultScene: () => BUOYANCY_SCENE as unknown as PhysicsScene,

  computeState: (t: number, params: Record<string, number>) => {
    const rhoObj = params.rhoObj ?? 800;
    const rhoFluid = params.rhoFluid ?? 1000;
    const volume = params.volume ?? 0.001;
    const g = params.g ?? 9.8;
    const y0 = params.y0 ?? 3;
    const dragCoeff = params.drag ?? 5;

    const mass = rhoObj * volume;
    const buoyForce = rhoFluid * volume * g;
    const weight = mass * g;
    const netForce = buoyForce - weight;

    // Acceleration
    const aNet = netForce / mass;

    // Simplified drag: reaches ~95% of terminal velocity within the simulation
    const waterSurface = 4;
    const bottom = 0.3;

    // First-order drag model: v_terminal = aNet / dragCoeff
    const vTerm = dragCoeff > 0 ? aNet / dragCoeff : aNet;

    // Position with exponential approach to terminal velocity
    // v(t) = vTerm * (1 - exp(-dragCoeff * t))
    // y(t) = y0 + vTerm * t + (vTerm / dragCoeff) * exp(-dragCoeff * t) - (vTerm / dragCoeff)
    let y: number;
    let vy: number;
    if (Math.abs(dragCoeff) < 0.001) {
      // No drag: simple kinematics
      vy = aNet * t;
      y = y0 + 0.5 * aNet * t * t;
    } else {
      vy = vTerm * (1 - Math.exp(-dragCoeff * t));
      y = y0 + vTerm * t + (vTerm / dragCoeff) * (Math.exp(-dragCoeff * t) - 1);
    }

    // Clamp between bottom and water surface
    if (y >= waterSurface && vy > 0) {
      y = waterSurface;
      vy = 0;
    }
    if (y <= bottom && vy < 0) {
      y = bottom;
      vy = 0;
    }

    const ke = 0.5 * mass * vy * vy;
    const pe = mass * g * y;

    return {
      time: t,
      positions: { block: [0, y, 0] },
      velocities: { block: [0, vy, 0] },
      accelerations: { block: [0, aNet, 0] },
      energies: {
        kinetic: ke,
        potential: pe,
        total: ke + pe,
      },
    };
  },

  getControls: () => [
    { id: "rhoObj", label: "ctrl.object_density", type: "slider", defaultValue: 800, min: 100, max: 5000, step: 50, unit: "kg/m\u00B3", group: "physics" },
    { id: "rhoFluid", label: "ctrl.fluid_density", type: "slider", defaultValue: 1000, min: 100, max: 3000, step: 50, unit: "kg/m\u00B3", group: "physics" },
    { id: "volume", label: "ctrl.volume", type: "slider", defaultValue: 0.001, min: 0.0001, max: 0.01, step: 0.0005, unit: "m\u00B3", group: "geometry" },
    { id: "y0", label: "ctrl.initial_depth", type: "slider", defaultValue: 3, min: 0.5, max: 4, step: 0.1, unit: "m", group: "geometry" },
    { id: "drag", label: "ctrl.drag_coeff", type: "slider", defaultValue: 5, min: 0.5, max: 20, step: 0.5, unit: "", group: "physics" },
    { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 30, step: 0.1, unit: "m/s\u00B2", group: "physics" },
  ],

  getKnowledgePoints: () => [
    { id: "kp_buoy_archimedes", name: "Archimedes Principle", category: "mechanics", mastered: false },
    { id: "kp_buoy_force", name: "Buoyant Force Calculation", category: "mechanics", mastered: false },
    { id: "kp_buoy_density", name: "Density & Floating", category: "mechanics", mastered: false },
    { id: "kp_buoy_net_force", name: "Net Force in Fluid", category: "mechanics", mastered: false },
  ],

  getForceAnalysis: () => [
    { name: "Buoyant Force", symbol: "F\u1D47", direction: "Upward", magnitude: "\u03C1_fluid \u00D7 V \u00D7 g", description: "Equal to the weight of the displaced fluid (Archimedes principle)." },
    { name: "Weight", symbol: "G", direction: "Downward", magnitude: "\u03C1_obj \u00D7 V \u00D7 g", description: "Gravitational force on the object." },
    { name: "Net Force", symbol: "F_net", direction: "Depends on density comparison", magnitude: "(\u03C1_fluid - \u03C1_obj) \u00D7 V \u00D7 g", description: "Determines whether the object sinks, floats, or stays suspended." },
  ],

  getMotionAnalysis: () => [
    { title: "Sinking", content: "When object density > fluid density, net force is downward. Object accelerates downward.", formula: "\u03C1_obj > \u03C1_fluid \u2192 a < 0" },
    { title: "Floating", content: "When object density < fluid density, net force is upward. Object accelerates upward.", formula: "\u03C1_obj < \u03C1_fluid \u2192 a > 0" },
    { title: "Suspension", content: "When densities are equal, net force is zero. Object stays at its position.", formula: "\u03C1_obj = \u03C1_fluid \u2192 F_net = 0" },
    { title: "Terminal Velocity", content: "Drag force opposes motion, eventually balancing the net buoyancy force.", formula: "v_term = F_net / k" },
  ],

  getDerivation: () => [
    { step: 1, title: "Archimedes Principle", formula: "F_b = \u03C1_fluid \u00D7 V_displaced \u00D7 g", explanation: "The buoyant force equals the weight of the displaced fluid." },
    { step: 2, title: "Object Weight", formula: "G = m \u00D7 g = \u03C1_obj \u00D7 V \u00D7 g", explanation: "Weight is the gravitational force on the object." },
    { step: 3, title: "Net Force", formula: "F_net = F_b - G = (\u03C1_fluid - \u03C1_obj) \u00D7 V \u00D7 g", explanation: "Net force determines acceleration direction." },
    { step: 4, title: "Acceleration", formula: "a = F_net / m = (\u03C1_fluid/\u03C1_obj - 1) \u00D7 g", explanation: "Acceleration depends on the density ratio, not the absolute values." },
  ],

  getPhases: () => [
    { id: "release", label: "Release", icon: "\u25B6", timeRange: [0, 0.3], cameraPresetId: "overview" },
    { id: "moving", label: "Buoyancy Motion", icon: "\u2B06\uFE0F\u2B07\uFE0F", timeRange: [0.3, 7], cameraPresetId: "side" },
    { id: "equilibrium", label: "Equilibrium", icon: "\u2696\uFE0F", timeRange: [7, 8], cameraPresetId: "overview" },
  ],

  getCameraPresets: () => [
    { id: "overview", label: "Overview", position: [6, 5, 8], target: [0, 2.5, 0] },
    { id: "side", label: "Side View", position: [8, 2.5, 0], target: [0, 2.5, 0] },
  ],
};
