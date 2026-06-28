import type { PhysicsScene } from "../types/physics-scene";

export const INCLINED_PLANE_SCENE: PhysicsScene = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {
    "title": "Inclined Plane",
    "description": "A block slides down an inclined plane under gravity, with optional friction.",
    "subject": "mechanics",
    "topic": "inclined_plane",
    "difficulty": "medium",
    "grade": "senior_high",
    "tags": ["incline", "friction", "force decomposition", "newton"]
  },
  "entities": [
    {
      "id": "block_1",
      "type": "block",
      "name": "Block",
      "position": [0, 5, 0],
      "properties": { "mass": 2.0, "dimensions": [0.8, 0.4, 0.8], "is_static": false, "friction_coefficient": 0.3 },
      "initial_conditions": { "velocity": [0, 0, 0] },
      "visual": { "color": "#f59e0b", "wireframe": false }
    },
    {
      "id": "incline_plane",
      "type": "block",
      "name": "Incline",
      "position": [0, 1.5, 0],
      "rotation": [0, 0, -0.524],
      "scale": [8, 0.15, 3],
      "properties": { "mass": 0, "dimensions": [8, 0.15, 3], "is_static": true, "friction_coefficient": 0.3 },
      "visual": { "color": "#475569" }
    },
    {
      "id": "ground",
      "type": "block",
      "name": "Ground",
      "position": [1.5, -1.5, 0],
      "scale": [10, 0.08, 4],
      "properties": { "mass": 0, "dimensions": [10, 0.08, 4], "is_static": true, "friction_coefficient": 0.5 },
      "visual": { "color": "#1e293b" }
    }
  ],
  "environment": [
    { "type": "gravity_field", "properties": { "acceleration": 9.8, "direction": [0, -1, 0] } },
    { "type": "incline_plane", "properties": { "angle": 30, "length": 8, "width": 3, "friction_coefficient": 0.3, "position": [0, 1.5, 0], "direction": "right" } }
  ],
  "forces": [
    {
      "id": "gravity_block",
      "type": "gravity",
      "target_entity": "block_1",
      "magnitude": "mass * g",
      "direction": [0, -1, 0],
      "is_constant": true,
      "description": "Gravity pulling block downward",
      "visual": { "color": "#EF4444", "arrow_scale": 0.3, "label": "G" }
    },
    {
      "id": "normal_block",
      "type": "normal",
      "target_entity": "block_1",
      "magnitude": "mass * g * cos(theta)",
      "direction": "perpendicular to incline surface",
      "is_constant": false,
      "description": "Normal force from incline surface",
      "visual": { "color": "#22c55e", "arrow_scale": 0.25, "label": "N" }
    },
    {
      "id": "friction_block",
      "type": "friction",
      "target_entity": "block_1",
      "magnitude": "mu * mass * g * cos(theta)",
      "direction": "up the incline",
      "is_constant": false,
      "description": "Kinetic friction opposing motion",
      "visual": { "color": "#f59e0b", "arrow_scale": 0.2, "label": "f" }
    }
  ],
  "constraints": [
    {
      "id": "block_incline_contact",
      "type": "contact",
      "entities": ["block_1", "incline_plane"],
      "properties": { "restitution": 0.2, "friction": 0.3 },
      "description": "Block slides on incline surface"
    }
  ],
  "equations": [
    {
      "id": "eq_net_force",
      "name": "Net force along incline",
      "expression": "F_net = mg*sin(theta) - mu*mg*cos(theta)",
      "variables": {
        "m": { "symbol": "m", "unit": "kg", "description": "Mass" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" },
        "theta": { "symbol": "theta", "unit": "deg", "description": "Incline angle" },
        "mu": { "symbol": "mu", "unit": "", "description": "Friction coefficient" }
      },
      "type": "force"
    },
    {
      "id": "eq_acceleration",
      "name": "Acceleration along incline",
      "expression": "a = g*(sin(theta) - mu*cos(theta))",
      "variables": {
        "a": { "symbol": "a", "unit": "m/s2", "description": "Acceleration" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" },
        "theta": { "symbol": "theta", "unit": "deg", "description": "Incline angle" },
        "mu": { "symbol": "mu", "unit": "", "description": "Friction coefficient" }
      },
      "type": "motion"
    },
    {
      "id": "eq_velocity_bottom",
      "name": "Velocity at bottom",
      "expression": "v = sqrt(2*a*L) = sqrt(2*g*L*(sin(theta) - mu*cos(theta)))",
      "variables": {
        "v": { "symbol": "v", "unit": "m/s", "description": "Velocity at bottom" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" },
        "L": { "symbol": "L", "unit": "m", "description": "Incline length" },
        "theta": { "symbol": "theta", "unit": "deg", "description": "Incline angle" },
        "mu": { "symbol": "mu", "unit": "", "description": "Friction coefficient" }
      },
      "type": "target",
      "is_solution": true
    }
  ],
  "timeline": {
    "total_duration": 3.0,
    "fps": 60,
    "events": [
      { "id": "start", "time": 0.0, "type": "phase_start", "data": { "label": "Release" }, "description": "Block released from top of incline" },
      { "id": "bottom", "time": 1.5, "type": "state_change", "target": "block_1", "data": { "label": "Bottom" }, "description": "Block reaches bottom of incline" },
      { "id": "slide_off", "time": 1.55, "type": "collision", "target": "block_1", "data": { "collision_with": "ground" }, "description": "Block slides onto ground" }
    ],
    "phases": [
      { "id": "release", "label": "phase.release", "icon": "o", "timeRange": [0, 0.05], "color": "#22c55e", "description": "Block at rest at top of incline", "cameraPresetId": "overview" },
      { "id": "sliding", "label": "phase.sliding", "icon": "/", "timeRange": [0.05, 1.45], "color": "#3b82f6", "description": "Block accelerates down incline", "cameraPresetId": "overview" },
      { "id": "reaching_bottom", "label": "phase.reaching_bottom", "icon": ">", "timeRange": [1.4, 1.6], "color": "#f59e0b", "description": "Block reaches bottom of incline", "cameraPresetId": "bottom" },
      { "id": "ground_slide", "label": "phase.ground_slide", "icon": "_", "timeRange": [1.6, 3.0], "color": "#64748b", "description": "Block slides on horizontal ground", "cameraPresetId": "overview" }
    ]
  },
  "camera_script": [
    { "id": "overview", "time": 0.0, "position": [6, 4, 10], "target": [2, 3, 0], "fov": 55, "description": "Side view of incline" },
    { "id": "bottom", "time": 1.4, "duration": 0.3, "position": [5, 1, 6], "target": [5, 1, 0], "fov": 50, "description": "Close-up of block at bottom" }
  ],
  "ui_controls": [
    { "id": "ctrl_angle", "parameter": "angle", "type": "slider", "label": "Incline Angle", "default_value": 30, "min": 10, "max": 60, "step": 1, "unit": "deg", "group": "Incline" },
    { "id": "ctrl_friction", "parameter": "friction", "type": "slider", "label": "Friction (mu)", "default_value": 0.3, "min": 0, "max": 0.8, "step": 0.05, "unit": "", "group": "Incline" },
    { "id": "ctrl_mass", "parameter": "entities[0].properties.mass", "type": "slider", "label": "Mass", "default_value": 2.0, "min": 0.5, "max": 10.0, "step": 0.5, "unit": "kg", "group": "Physics" },
    { "id": "ctrl_gravity", "parameter": "environment[0].properties.acceleration", "type": "slider", "label": "Gravity", "default_value": 9.8, "min": 0.1, "max": 20.0, "step": 0.5, "unit": "m/s2", "group": "Physics" }
  ],
  "knowledge_tags": [
    {
      "id": "kp_force_decomp",
      "name": "Force Decomposition",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "learning_tips": "Decompose gravity into parallel (mg*sin(theta)) and perpendicular (mg*cos(theta)) components"
    },
    {
      "id": "kp_friction",
      "name": "Friction",
      "category": "mechanics",
      "level": 2,
      "importance": 0.9,
      "prerequisites": ["kp_normal_force"],
      "common_mistakes": ["Confusing static vs kinetic friction", "Wrong direction for friction"],
      "learning_tips": "Friction always opposes relative motion (or impending motion)"
    },
    {
      "id": "kp_newton2_incline",
      "name": "Newton 2nd Law on Incline",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "prerequisites": ["kp_force_decomp"],
      "learning_tips": "Apply F=ma along the incline direction: mg*sin(theta) - f = ma"
    }
  ],
  "teacher_steps": [
    { "id": "ts1", "order": 1, "titleKey": "teacher.incline.step1.title", "descKey": "teacher.incline.step1.desc", "timeStart": 0.0 },
    { "id": "ts2", "order": 2, "titleKey": "teacher.incline.step2.title", "descKey": "teacher.incline.step2.desc", "formulaKey": "teacher.incline.step2.formula", "timeStart": 0.3 },
    { "id": "ts3", "order": 3, "titleKey": "teacher.incline.step3.title", "descKey": "teacher.incline.step3.desc", "formulaKey": "teacher.incline.step3.formula", "timeStart": 0.6 },
    { "id": "ts4", "order": 4, "titleKey": "teacher.incline.step4.title", "descKey": "teacher.incline.step4.desc", "formulaKey": "teacher.incline.step4.formula", "timeStart": 1.0 },
    { "id": "ts5", "order": 5, "titleKey": "teacher.incline.step5.title", "descKey": "teacher.incline.step5.desc", "timeStart": 1.4 },
    { "id": "ts6", "order": 6, "titleKey": "teacher.incline.step6.title", "descKey": "teacher.incline.step6.desc", "timeStart": 1.6 },
    { "id": "ts7", "order": 7, "titleKey": "teacher.incline.step7.title", "descKey": "teacher.incline.step7.desc", "timeStart": 2.0 }
  ],
  "charts": [
    { "id": "ch_s_t", "type": "position_time", "label": "s-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Position", "unit": "m", "key": "s" }, "color": "#22c55e" },
    { "id": "ch_v_t", "type": "velocity_time", "label": "v-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Velocity", "unit": "m/s", "key": "v" }, "color": "#f59e0b" },
    { "id": "ch_a_t", "type": "acceleration_time", "label": "a-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Acceleration", "unit": "m/s2", "key": "a" }, "color": "#ef4444" },
    { "id": "ch_ke", "type": "kinetic_energy", "label": "KE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Kinetic Energy", "unit": "J", "key": "ke" }, "color": "#f59e0b" },
    { "id": "ch_pe", "type": "potential_energy", "label": "PE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Potential Energy", "unit": "J", "key": "pe" }, "color": "#22c55e" },
    { "id": "ch_me", "type": "mechanical_energy", "label": "ME", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Mechanical Energy", "unit": "J", "key": "me" }, "color": "#3b82f6" }
  ],
  simulation: {
    params: { L: 5, angle: 30, mu: 0.3, g: 9.8, m: 2 },
    equations: {
      x: "0.5 * g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * t > L ? L : 0.5 * g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * t",
      y: "L - 0.5 * g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * t * sin(angle * PI / 180) > 0.2 ? L - 0.5 * g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * t * sin(angle * PI / 180) : 0.2",
      z: "0",
      vx: "g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t",
      vy: "-g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * sin(angle * PI / 180)",
      vz: "0",
      ax: "g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180))",
      ay: "-g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * sin(angle * PI / 180)",
      az: "0",
      ke: "0.5 * m * (vx * vx + vy * vy)",
      pe: "m * g * y",
      total_e: "m * g * L",
      speed: "sqrt(vx * vx + vy * vy)",
    },
    stopWhen: [
      { formula: "0.5 * g * (sin(angle * PI / 180) - mu * cos(angle * PI / 180)) * t * t - L + 0.01", description: "Block reaches end of incline" },
    ],
  }
};