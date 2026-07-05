import type { PhysicsScene } from "../types/physics-scene";

// Doppler Effect: frequency shift due to relative motion of source/observer
// f'\'' = f · (v_sound ± v_observer) / (v_sound ∓ v_source)
export const DOPPLER_SCENE: PhysicsScene & { simulation?: any } = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Doppler Effect",
    description: "Frequency shift: f'\'' = f·(vs ± vo)/(vs ∓ vs)",
    subject: "waves",
    topic: "doppler_effect",
    difficulty: "medium",
    grade: "senior_high",
    tags: ["waves", "doppler", "frequency", "sound", "redshift"],
  },
  entities: [
    {
      id: "source",
      type: "ball",
      name: "Sound Source",
      position: [-3, 2, 0],
      properties: { mass: 1, radius: 0.2 },
      initial_conditions: { velocity: [1.5, 0, 0] },
      visual: { color: "#ef4444", material: "metal", show_trail: true, trail_color: "#ef444444" },
    },
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 0, direction: [0, -1, 0] } },
  ],
  forces: [],
  timeline: {
    total_duration: 6,
    fps: 60,
    events: [],
    phases: [
      { id: "approaching", label: "phase.approaching", icon: "v", timeRange: [0, 2.5], color: "#3b82f6", description: "Source moves toward observer", cameraPresetId: "wide" },
      { id: "passing", label: "phase.passing", icon: "O", timeRange: [2.3, 3], color: "#f59e0b", description: "Source passes observer", cameraPresetId: "wide" },
      { id: "receding", label: "phase.receding", icon: "v", timeRange: [2.8, 6], color: "#ef4444", description: "Source moves away from observer", cameraPresetId: "wide" },
    ],
  },
  camera_script: [
    { id: "wide", time: 0, position: [3, 6, 10], target: [0, 2, 0], fov: 55 },
  ],
  constraints: [],
  equations: [
    {
      id: "doppler_eq",
      name: "Doppler Effect",
      expression: "f'\'' = f · (vsound ± vo) / (vsound ∓ vs)",
      variables: {
        f: { symbol: "f", unit: "Hz", description: "Source frequency" },
        vs: { symbol: "v_s", unit: "m/s", description: "Source velocity" },
        vo: { symbol: "v_o", unit: "m/s", description: "Observer velocity" },
      },
      type: "motion" as const,
    },
  ],
  ui_controls: [],
  knowledge_tags: [
    { id: "kp_doppler", name: "Doppler Effect", category: "waves", level: 2 },
    { id: "kp_doppler_approach", name: "Blueshift", category: "waves", level: 2 },
    { id: "kp_doppler_recede", name: "Redshift", category: "waves", level: 2 },
    { id: "kp_doppler_app", name: "Applications", category: "waves", level: 2 },
  ],
  teacher_steps: [
    { id: "s1", order: 1, titleKey: "teacher.doppler.step1", descKey: "teacher.doppler.step1_desc", timeStart: 0 },
    { id: "s2", order: 2, titleKey: "teacher.doppler.step2", descKey: "teacher.doppler.step2_desc", formulaKey: "teacher.doppler.formula1", timeStart: 0.5 },
    { id: "s3", order: 3, titleKey: "teacher.doppler.step3", descKey: "teacher.doppler.step3_desc", formulaKey: "teacher.doppler.formula2", timeStart: 2.5 },
    { id: "s4", order: 4, titleKey: "teacher.doppler.step4", descKey: "teacher.doppler.step4_desc", timeStart: 4 },
  ],
  simulation: {
    params: { f0: 440, vs: 1.5, v_sound: 340, y0: 2, observer_x: 0 },
    equations: {
      // Source moves from left to right, passes observer at x=0
      x: "-3 + vs * t > 6 ? 6 : -3 + vs * t",
      y: "y0",
      z: "0",
      vx: "vs",
      vy: "0",
      vz: "0",
      ax: "0",
      ay: "0",
      az: "0",
      ke: "0.5 * 1 * vs * vs",
      pe: "0",
      total_e: "0.5 * 1 * vs * vs",
      speed: "vs",
      // Observed frequency: approaching → f'\'' = f·v_sound/(v_sound - vs), receding → f'\'' = f·v_sound/(v_sound + vs)
      obs_freq: "x < observer_x ? f0 * v_sound / (v_sound - abs(vx)) : f0 * v_sound / (v_sound + abs(vx))",
      // Wavelength shift
      wavelength: "v_sound / (x < observer_x ? f0 * v_sound / (v_sound - abs(vx)) : f0 * v_sound / (v_sound + abs(vx)))",
    },
    stopWhen: [
      { formula: "5.5 - t", description: "End of observation" },
    ],
  },
};
