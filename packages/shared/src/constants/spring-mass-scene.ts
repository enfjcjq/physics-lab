import type { PhysicsScene } from "../types/physics-scene";

export const SPRING_MASS_SCENE: PhysicsScene = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {
    "title": "Spring-Mass Oscillator",
    "description": "A mass attached to a spring oscillates in simple harmonic motion.",
    "subject": "mechanics",
    "topic": "simple_harmonic_motion",
    "difficulty": "medium",
    "grade": "senior_high",
    "tags": ["spring", "oscillation", "SHM", "Hooke law"]
  },
  "entities": [
    {
      "id": "mass_1",
      "type": "ball",
      "name": "Mass",
      "position": [0, 3, 0],
      "properties": { "mass": 1.0, "radius": 0.25, "restitution": 0.1 },
      "initial_conditions": { "velocity": [0, -2, 0] },
      "visual": { "color": "#a78bfa", "material": "metal", "show_trail": true, "trail_color": "#a78bfa44", "trail_max_points": 400 }
    },
    {
      "id": "anchor",
      "type": "block",
      "name": "Anchor",
      "position": [0, 6, 0],
      "scale": [1, 0.1, 1],
      "properties": { "mass": 0, "dimensions": [1, 0.1, 1], "is_static": true },
      "visual": { "color": "#64748b" }
    }
  ],
  "environment": [
    { "type": "gravity_field", "properties": { "acceleration": 0, "direction": [0, -1, 0] } }
  ],
  "forces": [
    {
      "id": "spring_force",
      "type": "spring_force",
      "target_entity": "mass_1",
      "magnitude": "k * (L0 - y)",
      "direction": "toward equilibrium",
      "is_constant": false,
      "description": "Spring restoring force (Hooke Law)",
      "visual": { "color": "#a78bfa", "arrow_scale": 0.25, "label": "F_s" }
    }
  ],
  "constraints": [
    {
      "id": "spring_connection",
      "type": "fixed_point",
      "entities": ["mass_1", "anchor"],
      "description": "Spring connects mass to anchor point"
    }
  ],
  "equations": [
    {
      "id": "eq_hooke",
      "name": "Hooke Law",
      "expression": "F = -k * x",
      "variables": {
        "F": { "symbol": "F", "unit": "N", "description": "Restoring force" },
        "k": { "symbol": "k", "unit": "N/m", "description": "Spring constant" },
        "x": { "symbol": "x", "unit": "m", "description": "Displacement from equilibrium" }
      },
      "type": "force"
    },
    {
      "id": "eq_shm",
      "name": "Equation of motion",
      "expression": "x(t) = A * cos(omega * t + phi)",
      "variables": {
        "A": { "symbol": "A", "unit": "m", "description": "Amplitude" },
        "omega": { "symbol": "omega", "unit": "rad/s", "description": "Angular frequency" },
        "phi": { "symbol": "phi", "unit": "rad", "description": "Phase constant" }
      },
      "type": "motion"
    },
    {
      "id": "eq_period",
      "name": "Period",
      "expression": "T = 2*pi * sqrt(m/k)",
      "variables": {
        "T": { "symbol": "T", "unit": "s", "description": "Period" },
        "m": { "symbol": "m", "unit": "kg", "description": "Mass" },
        "k": { "symbol": "k", "unit": "N/m", "description": "Spring constant" }
      },
      "type": "target",
      "is_solution": true
    },
    {
      "id": "eq_energy",
      "name": "Energy conservation",
      "expression": "E = 1/2 * k * A^2 = 1/2 * m * v^2 + 1/2 * k * x^2",
      "variables": {
        "E": { "symbol": "E", "unit": "J", "description": "Total energy" },
        "A": { "symbol": "A", "unit": "m", "description": "Amplitude" }
      },
      "type": "energy"
    }
  ],
  "timeline": {
    "total_duration": 5.0,
    "fps": 60,
    "events": [
      { "id": "start", "time": 0.0, "type": "phase_start", "data": { "label": "Release" }, "description": "Mass released from displaced position" },
      { "id": "eq1", "time": 0.5, "type": "marker", "data": { "label": "Equilibrium" }, "description": "Mass passes through equilibrium" },
      { "id": "max1", "time": 1.0, "type": "marker", "data": { "label": "Max displacement" }, "description": "Maximum displacement (amplitude)" }
    ],
    "phases": [
      { "id": "release", "label": "phase.release", "icon": "o", "timeRange": [0, 0.05], "color": "#22c55e", "description": "Initial displacement" },
      { "id": "oscillating", "label": "phase.oscillating", "icon": "~", "timeRange": [0.05, 5.0], "color": "#a78bfa", "description": "Simple harmonic oscillation" }
    ]
  },
  "camera_script": [
    { "id": "overview", "time": 0.0, "position": [6, 3, 8], "target": [0, 3, 0], "fov": 55 }
  ],
  "ui_controls": [
    { "id": "ctrl_k", "parameter": "k", "type": "slider", "label": "Spring Constant", "default_value": 10, "min": 2, "max": 30, "step": 0.5, "unit": "N/m", "group": "Spring" },
    { "id": "ctrl_mass", "parameter": "entities[0].properties.mass", "type": "slider", "label": "Mass", "default_value": 1.0, "min": 0.2, "max": 5.0, "step": 0.1, "unit": "kg", "group": "Physics" },
    { "id": "ctrl_amplitude", "parameter": "amplitude", "type": "slider", "label": "Amplitude", "default_value": 2, "min": 0.5, "max": 4, "step": 0.1, "unit": "m", "group": "Initial" }
  ],
  "knowledge_tags": [
    {
      "id": "kp_hooke",
      "name": "Hooke Law",
      "category": "Forces",
      "level": 2,
      "importance": 1.0,
      "learning_tips": "F = -kx: the negative sign means the force always points toward equilibrium"
    },
    {
      "id": "kp_shm",
      "name": "Simple Harmonic Motion",
      "category": "Kinematics",
      "level": 2,
      "importance": 1.0,
      "prerequisites": ["kp_hooke"],
      "learning_tips": "SHM: acceleration is proportional to negative displacement. a = -omega^2 * x"
    },
    {
      "id": "kp_period",
      "name": "Period of Oscillation",
      "category": "Kinematics",
      "level": 2,
      "importance": 0.8,
      "prerequisites": ["kp_shm"],
      "learning_tips": "T = 2*pi*sqrt(m/k). Period depends only on mass and spring constant, not amplitude."
    }
  ],
  "teacher_steps": [
    { "id": "ts1", "order": 1, "titleKey": "teacher.spring.step1.title", "descKey": "teacher.spring.step1.desc", "timeStart": 0.0 },
    { "id": "ts2", "order": 2, "titleKey": "teacher.spring.step2.title", "descKey": "teacher.spring.step2.desc", "formulaKey": "teacher.spring.step2.formula", "timeStart": 0.3 },
    { "id": "ts3", "order": 3, "titleKey": "teacher.spring.step3.title", "descKey": "teacher.spring.step3.desc", "formulaKey": "teacher.spring.step3.formula", "timeStart": 0.6 },
    { "id": "ts4", "order": 4, "titleKey": "teacher.spring.step4.title", "descKey": "teacher.spring.step4.desc", "formulaKey": "teacher.spring.step4.formula", "timeStart": 1.0 },
    { "id": "ts5", "order": 5, "titleKey": "teacher.spring.step5.title", "descKey": "teacher.spring.step5.desc", "timeStart": 1.5 },
    { "id": "ts6", "order": 6, "titleKey": "teacher.spring.step6.title", "descKey": "teacher.spring.step6.desc", "timeStart": 2.0 },
    { "id": "ts7", "order": 7, "titleKey": "teacher.spring.step7.title", "descKey": "teacher.spring.step7.desc", "timeStart": 3.0 }
  ],
  "charts": [
    { "id": "ch_s_t", "type": "position_time", "label": "x-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Displacement", "unit": "m", "key": "x" }, "color": "#a78bfa" },
    { "id": "ch_v_t", "type": "velocity_time", "label": "v-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Velocity", "unit": "m/s", "key": "v" }, "color": "#f59e0b" },
    { "id": "ch_ke", "type": "kinetic_energy", "label": "KE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Energy", "unit": "J", "key": "ke" }, "color": "#f59e0b" }
  ],
  simulation: {
    params: { k: 10, m: 2, A: 2, g: 9.8 },
    equations: {
      x: "0",
      y: "3 + A * cos(sqrt(k / m) * t)",
      z: "0",
      vx: "0",
      vy: "-A * sqrt(k / m) * sin(sqrt(k / m) * t)",
      vz: "0",
      ax: "0",
      ay: "-A * (k / m) * cos(sqrt(k / m) * t)",
      az: "0",
      ke: "0.5 * m * vy * vy",
      pe: "0.5 * k * (y - 3) * (y - 3)",
      total_e: "0.5 * k * A * A",
      speed: "abs(vy)",
    },
    stopWhen: [],
  }
};