import type { PhysicsScene } from "../types/physics-scene";

export const WAVE_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Transverse Wave",
    description: "Wave propagation on a string: y = A sin(kx - \u03C9t)",
    subject: "waves",
    topic: "transverse_wave",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["wave", "transverse", "frequency", "wavelength", "amplitude"],
  },
  entities: [
    {
      id: "wave_point",
      type: "ball",
      name: "Wave Particle",
      position: [0, 2, 0],
      properties: { mass: 0.1, radius: 0.1 },
      initial_conditions: { velocity: [0, 0, 0] },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [
    { id: "restoring", type: "applied_force", target_entity: "wave_point", magnitude: "k * A", direction: [0, 1, 0], description: "Restoring force creates oscillation" },
  ],
  timeline: {
    total_duration: 8,
    fps: 60,
    events: [],
    phases: [
      { id: "wave_start", label: "Wave Start", icon: "\u25B6", timeRange: [0, 0.5] },
      { id: "propagating", label: "Propagating", icon: "\u223C\uFE0F", timeRange: [0.5, 7] },
      { id: "full_period", label: "Full Period", icon: "\u2705", timeRange: [7, 8] },
    ],
  },
  camera_script: [
    { id: "overview", time: 0, position: [4, 4, 10], target: [4, 2, 0] },
  ],
  constraints: [],
  equations: [
    { id: "wave_eq", name: "Wave Equation", expression: "y = A sin(kx - \u03C9t)", variables: { A: { symbol: "A", unit: "m", description: "Amplitude" }, k: { symbol: "k", unit: "rad/m", description: "Wave number" }, "\u03C9": { symbol: "\u03C9", unit: "rad/s", description: "Angular frequency" } }, type: "motion" as const },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_wave_amplitude", name: "Amplitude", category: "waves", level: 1 },
    { id: "kp_wave_frequency", name: "Frequency & Period", category: "waves", level: 1 },
    { id: "kp_wave_wavelength", name: "Wavelength", category: "waves", level: 2 },
    { id: "kp_wave_speed", name: "Wave Speed", category: "waves", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.wave.step1", descKey: "teacher.wave.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.wave.step2", descKey: "teacher.wave.step2_desc", formulaKey: "teacher.wave.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.wave.step3", descKey: "teacher.wave.step3_desc", formulaKey: "teacher.wave.formula2", timeStart: 2 },
    { id: "s4", order: 4, titleKey: "teacher.wave.step4", descKey: "teacher.wave.step4_desc", timeStart: 5 },
  ],
  simulation: {
    params: { A: 1.5, k: 1.5, omega: 2, y0: 2 },
    equations: {
      x: "t * 1.5",
      y: "y0 + A * sin(k * x - omega * t)",
      z: "0",
      vx: "1.5",
      vy: "-A * omega * cos(k * x - omega * t)",
      vz: "0",
      ax: "0",
      ay: "A * omega * omega * sin(k * x - omega * t)",
      az: "0",
      ke: "0.5 * 0.1 * (vx*vx + vy*vy)",
      pe: "0",
      total_e: "0.5 * 0.1 * (vx*vx + vy*vy)",
      speed: "sqrt(vx*vx + vy*vy)",
      amplitude: "A",
      frequency: "omega / (2 * PI)",
      wavelength: "2 * PI / k",
    },
    stopWhen: [],
  },
};