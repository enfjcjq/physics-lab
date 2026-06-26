import type { PhysicsScene } from "../types/physics-scene";

export const PROJECTILE_MOTION_SCENE: PhysicsScene = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {
    "title": "Projectile Motion",
    "description": "A ball launched at an angle. Trajectory is a parabola.",
    "subject": "mechanics",
    "topic": "projectile_motion",
    "difficulty": "medium",
    "grade": "senior_high",
    "tags": ["projectile", "parabolic trajectory", "2D kinematics"]
  },
  "entities": [
    {
      "id": "ball_1",
      "type": "ball",
      "name": "Projectile",
      "position": [0, 0.5, 0],
      "properties": { "mass": 1.0, "radius": 0.2, "restitution": 0.6 },
      "initial_conditions": { "velocity": [8.66, 5.0, 0] },
      "visual": { "color": "#3b82f6", "material": "metal", "show_trail": true, "trail_color": "#3b82f644", "trail_max_points": 600 }
    },
    {
      "id": "ground",
      "type": "block",
      "name": "Ground",
      "position": [0, -0.05, 0],
      "scale": [20, 0.1, 6],
      "properties": { "mass": 0, "dimensions": [20, 0.1, 6], "is_static": true, "friction_coefficient": 0.5 },
      "visual": { "color": "#334155" }
    }
  ],
  "environment": [
    { "type": "gravity_field", "properties": { "acceleration": 9.8, "direction": [0, -1, 0] } }
  ],
  "forces": [
    {
      "id": "gravity_ball_1",
      "type": "gravity",
      "target_entity": "ball_1",
      "magnitude": "mass * g",
      "direction": [0, -1, 0],
      "is_constant": true,
      "description": "Gravity",
      "visual": { "color": "#EF4444", "arrow_scale": 0.3, "label": "G" }
    }
  ],
  "constraints": [
    {
      "id": "ground_collision",
      "type": "contact",
      "entities": ["ball_1", "ground"],
      "properties": { "restitution": 0.6, "friction": 0.5 },
      "description": "Ground collision"
    }
  ],
  "equations": [
    {
      "id": "eq_x",
      "name": "Horizontal displacement",
      "expression": "x(t) = v0 * cos(theta) * t",
      "variables": {
        "v0": { "symbol": "v0", "unit": "m/s", "description": "Initial velocity" },
        "theta": { "symbol": "theta", "unit": "rad", "description": "Launch angle" },
        "t": { "symbol": "t", "unit": "s", "description": "Time" }
      },
      "type": "motion"
    },
    {
      "id": "eq_y",
      "name": "Vertical displacement",
      "expression": "y(t) = v0 * sin(theta) * t - (1/2) * g * t^2",
      "variables": {
        "v0": { "symbol": "v0", "unit": "m/s", "description": "Initial velocity" },
        "theta": { "symbol": "theta", "unit": "rad", "description": "Launch angle" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" },
        "t": { "symbol": "t", "unit": "s", "description": "Time" }
      },
      "type": "motion"
    },
    {
      "id": "eq_range",
      "name": "Range",
      "expression": "R = v0^2 * sin(2*theta) / g",
      "variables": {
        "R": { "symbol": "R", "unit": "m", "description": "Range" },
        "v0": { "symbol": "v0", "unit": "m/s", "description": "Initial velocity" },
        "theta": { "symbol": "theta", "unit": "rad", "description": "Launch angle" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" }
      },
      "type": "target",
      "is_solution": true
    },
    {
      "id": "eq_max_height",
      "name": "Maximum height",
      "expression": "H = (v0 * sin(theta))^2 / (2 * g)",
      "variables": {
        "H": { "symbol": "H", "unit": "m", "description": "Maximum height" },
        "v0": { "symbol": "v0", "unit": "m/s", "description": "Initial velocity" },
        "theta": { "symbol": "theta", "unit": "rad", "description": "Launch angle" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" }
      },
      "type": "target"
    },
    {
      "id": "eq_flight_time",
      "name": "Time of flight",
      "expression": "T = 2 * v0 * sin(theta) / g",
      "variables": {
        "T": { "symbol": "T", "unit": "s", "description": "Time of flight" },
        "v0": { "symbol": "v0", "unit": "m/s", "description": "Initial velocity" },
        "theta": { "symbol": "theta", "unit": "rad", "description": "Launch angle" },
        "g": { "symbol": "g", "unit": "m/s2", "description": "Gravity" }
      },
      "type": "target"
    }
  ],
  "timeline": {
    "total_duration": 3.0,
    "fps": 60,
    "events": [
      { "id": "launch", "time": 0.0, "type": "phase_start", "data": { "label": "Launch" }, "description": "Ball launched at angle from origin" },
      { "id": "peak", "time": 0.51, "type": "marker", "target": "ball_1", "data": { "label": "Peak", "v_y": 0 }, "description": "Maximum height reached. vy = 0" },
      { "id": "impact", "time": 1.02, "type": "collision", "target": "ball_1", "data": { "collision_with": "ground" }, "description": "Impact with ground" }
    ],
    "phases": [
      { "id": "launch", "label": "phase.launch", "icon": ">", "timeRange": [0, 0.05], "color": "#22c55e", "description": "Ball launched with initial velocity", "cameraPresetId": "overview" },
      { "id": "ascending", "label": "phase.ascending", "icon": "/", "timeRange": [0.05, 0.51], "color": "#3b82f6", "description": "Ball rising, vy decreasing due to gravity", "cameraPresetId": "overview" },
      { "id": "peak", "label": "phase.peak", "icon": "o", "timeRange": [0.48, 0.55], "color": "#f59e0b", "description": "Maximum height. vy = 0, vx unchanged", "cameraPresetId": "peak" },
      { "id": "descending", "label": "phase.descending", "icon": "\\", "timeRange": [0.55, 1.02], "color": "#ef4444", "description": "Ball falling, vy increasing downward", "cameraPresetId": "overview" },
      { "id": "impact", "label": "phase.impact", "icon": "O", "timeRange": [0.98, 1.5], "color": "#8b5cf6", "description": "Impact with ground, bouncing", "cameraPresetId": "impact" },
      { "id": "aftermath", "label": "phase.aftermath", "icon": ".", "timeRange": [1.5, 3.0], "color": "#64748b", "description": "Post-impact motion", "cameraPresetId": "overview" }
    ]
  },
  "camera_script": [
    { "id": "overview", "time": 0.0, "position": [10, 6, 12], "target": [5, 2, 0], "fov": 55, "description": "Side overview of trajectory" },
    { "id": "peak", "time": 0.48, "duration": 0.3, "position": [4.5, 3, 8], "target": [4.5, 1.5, 0], "fov": 50, "description": "Close-up of peak" },
    { "id": "impact", "time": 0.98, "duration": 0.3, "position": [8, 1, 6], "target": [8.5, 0.5, 0], "fov": 45, "description": "Close-up of impact point" }
  ],
  "ui_controls": [
    { "id": "ctrl_v0", "parameter": "initialSpeed", "type": "slider", "label": "Initial Speed", "default_value": 10, "min": 2, "max": 30, "step": 0.5, "unit": "m/s", "group": "Launch" },
    { "id": "ctrl_angle", "parameter": "angle", "type": "slider", "label": "Launch Angle", "default_value": 30, "min": 5, "max": 85, "step": 1, "unit": "deg", "group": "Launch" },
    { "id": "ctrl_mass", "parameter": "entities[0].properties.mass", "type": "slider", "label": "Mass", "default_value": 1.0, "min": 0.1, "max": 10.0, "step": 0.1, "unit": "kg", "group": "Physics" },
    { "id": "ctrl_gravity", "parameter": "environment[0].properties.acceleration", "type": "slider", "label": "Gravity", "default_value": 9.8, "min": 0.1, "max": 20.0, "step": 0.5, "unit": "m/s2", "group": "Physics" }
  ],
  "knowledge_tags": [
    {
      "id": "kp_projectile",
      "name": "Projectile Motion",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "common_mistakes": ["Treating x and y as one dimension", "Forgetting vx is constant", "Sign errors on vy"],
      "learning_tips": "Decompose into independent horizontal (constant v) and vertical (constant a) motions"
    },
    {
      "id": "kp_parabola",
      "name": "Parabolic Trajectory",
      "category": "mechanics",
      "level": 2,
      "importance": 0.9,
      "prerequisites": ["kp_projectile", "kp_constant_accel"],
      "learning_tips": "y = x*tan(theta) - (g*x^2)/(2*v0^2*cos^2(theta)) is the parabola equation"
    },
    {
      "id": "kp_range_formula",
      "name": "Range Formula",
      "category": "mechanics",
      "level": 2,
      "importance": 0.8,
      "prerequisites": ["kp_projectile"],
      "common_mistakes": ["Using degrees instead of radians in sin(2*theta)", "Forgetting max range is at 45 degrees"],
      "learning_tips": "R = v0^2 * sin(2*theta) / g. Max at theta = 45 degrees"
    },
    {
      "id": "kp_max_height",
      "name": "Maximum Height",
      "category": "mechanics",
      "level": 2,
      "importance": 0.7,
      "learning_tips": "At peak: vy = 0, use v^2 = v0^2 + 2a*delta_y with vy=0"
    }
  ],
  "teacher_steps": [
    { "id": "ts1", "order": 1, "titleKey": "teacher.projectile.step1.title", "descKey": "teacher.projectile.step1.desc", "timeStart": 0.0 },
    { "id": "ts2", "order": 2, "titleKey": "teacher.projectile.step2.title", "descKey": "teacher.projectile.step2.desc", "timeStart": 0.2 },
    { "id": "ts3", "order": 3, "titleKey": "teacher.projectile.step3.title", "descKey": "teacher.projectile.step3.desc", "formulaKey": "teacher.projectile.step3.formula", "timeStart": 0.4 },
    { "id": "ts4", "order": 4, "titleKey": "teacher.projectile.step4.title", "descKey": "teacher.projectile.step4.desc", "formulaKey": "teacher.projectile.step4.formula", "timeStart": 0.5 },
    { "id": "ts5", "order": 5, "titleKey": "teacher.projectile.step5.title", "descKey": "teacher.projectile.step5.desc", "formulaKey": "teacher.projectile.step5.formula", "timeStart": 0.6 },
    { "id": "ts6", "order": 6, "titleKey": "teacher.projectile.step6.title", "descKey": "teacher.projectile.step6.desc", "timeStart": 1.0 },
    { "id": "ts7", "order": 7, "titleKey": "teacher.projectile.step7.title", "descKey": "teacher.projectile.step7.desc", "timeStart": 1.5 }
  ],
  "charts": [
    { "id": "ch_s_t", "type": "position_time", "label": "s-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Displacement", "unit": "m", "key": "s" }, "color": "#22c55e" },
    { "id": "ch_v_t", "type": "velocity_time", "label": "v-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Velocity", "unit": "m/s", "key": "v" }, "color": "#f59e0b" },
    { "id": "ch_a_t", "type": "acceleration_time", "label": "a-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Acceleration", "unit": "m/s2", "key": "a" }, "color": "#ef4444" },
    { "id": "ch_ke", "type": "kinetic_energy", "label": "KE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Kinetic Energy", "unit": "J", "key": "ke" }, "color": "#f59e0b" },
    { "id": "ch_pe", "type": "potential_energy", "label": "PE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Potential Energy", "unit": "J", "key": "pe" }, "color": "#22c55e" },
    { "id": "ch_me", "type": "mechanical_energy", "label": "ME", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Mechanical Energy", "unit": "J", "key": "me" }, "color": "#3b82f6" }
  ]
};
