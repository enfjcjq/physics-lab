import type { PhysicsScene } from "../types/physics-scene";

export const COLLISION_SCENE: PhysicsScene = {
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {
    "title": "Collision",
    "description": "Two balls collide. Observe momentum conservation and energy transfer.",
    "subject": "mechanics",
    "topic": "collision",
    "difficulty": "medium",
    "grade": "senior_high",
    "tags": ["collision", "momentum", "energy", "elastic", "inelastic"]
  },
  "entities": [
    {
      "id": "ball_a",
      "type": "ball",
      "name": "Ball A",
      "position": [-3, 1, 0],
      "properties": { "mass": 2.0, "radius": 0.3, "restitution": 0.9 },
      "initial_conditions": { "velocity": [3, 0, 0] },
      "visual": { "color": "#3b82f6", "material": "metal", "show_trail": true, "trail_color": "#3b82f644", "trail_max_points": 300 }
    },
    {
      "id": "ball_b",
      "type": "ball",
      "name": "Ball B",
      "position": [3, 1, 0],
      "properties": { "mass": 1.0, "radius": 0.25, "restitution": 0.9 },
      "initial_conditions": { "velocity": [-1, 0, 0] },
      "visual": { "color": "#ef4444", "material": "metal", "show_trail": true, "trail_color": "#ef444444", "trail_max_points": 300 }
    },
    {
      "id": "ground",
      "type": "block",
      "name": "Ground",
      "position": [0, -0.05, 0],
      "scale": [16, 0.08, 4],
      "properties": { "mass": 0, "dimensions": [16, 0.08, 4], "is_static": true, "friction_coefficient": 0.1 },
      "visual": { "color": "#1e293b" }
    }
  ],
  "environment": [
    { "type": "gravity_field", "properties": { "acceleration": 0.0, "direction": [0, -1, 0] } }
  ],
  "forces": [],
  "constraints": [
    {
      "id": "ball_collision",
      "type": "contact",
      "entities": ["ball_a", "ball_b"],
      "properties": { "restitution": 0.9, "friction": 0 },
      "description": "Elastic collision between the two balls"
    }
  ],
  "equations": [
    {
      "id": "eq_momentum",
      "name": "Conservation of momentum",
      "expression": "m1*v1 + m2*v2 = m1*v1u0027 + m2*v2u0027",
      "variables": {
        "m1": { "symbol": "m1", "unit": "kg", "description": "Mass of ball A" },
        "m2": { "symbol": "m2", "unit": "kg", "description": "Mass of ball B" },
        "v1": { "symbol": "v1", "unit": "m/s", "description": "Initial velocity of A" },
        "v2": { "symbol": "v2", "unit": "m/s", "description": "Initial velocity of B" }
      },
      "type": "momentum"
    },
    {
      "id": "eq_elastic_v1",
      "name": "Velocity of A after elastic collision",
      "expression": "v1u0027 = ((m1-m2)*v1 + 2*m2*v2) / (m1+m2)",
      "variables": {
        "v1u0027": { "symbol": "v1u0027", "unit": "m/s", "description": "Final velocity of A" }
      },
      "type": "target",
      "is_solution": true
    },
    {
      "id": "eq_elastic_v2",
      "name": "Velocity of B after elastic collision",
      "expression": "v2u0027 = ((m2-m1)*v2 + 2*m1*v1) / (m1+m2)",
      "variables": {
        "v2u0027": { "symbol": "v2u0027", "unit": "m/s", "description": "Final velocity of B" }
      },
      "type": "target"
    }
  ],
  "timeline": {
    "total_duration": 4.0,
    "fps": 60,
    "events": [
      { "id": "start", "time": 0.0, "type": "phase_start", "data": { "label": "Approach" }, "description": "Balls moving toward each other" },
      { "id": "collision", "time": 1.5, "type": "collision", "target": "ball_a", "data": { "collision_with": "ball_b" }, "description": "Collision occurs" },
      { "id": "separate", "time": 1.55, "type": "state_change", "data": { "label": "Separate" }, "description": "Balls moving apart" }
    ],
    "phases": [
      { "id": "approach", "label": "phase.approach", "icon": "><", "timeRange": [0, 1.5], "color": "#3b82f6", "description": "Balls approaching each other", "cameraPresetId": "overview" },
      { "id": "collision", "label": "phase.collision", "icon": "O", "timeRange": [1.45, 1.6], "color": "#f59e0b", "description": "Moment of impact. Momentum is conserved.", "cameraPresetId": "closeup" },
      { "id": "separate", "label": "phase.separate", "icon": "<>", "timeRange": [1.6, 4.0], "color": "#22c55e", "description": "Balls moving apart with new velocities", "cameraPresetId": "overview" }
    ]
  },
  "camera_script": [
    { "id": "overview", "time": 0.0, "position": [0, 4, 10], "target": [0, 1, 0], "fov": 55, "description": "Full view of collision" },
    { "id": "closeup", "time": 1.45, "duration": 0.3, "position": [0, 1.5, 4], "target": [0, 1, 0], "fov": 40, "description": "Close-up of impact moment" }
  ],
  "ui_controls": [
    { "id": "ctrl_m1", "parameter": "m1", "type": "slider", "label": "Mass A", "default_value": 2, "min": 0.5, "max": 5, "step": 0.5, "unit": "kg", "group": "Ball A" },
    { "id": "ctrl_v1", "parameter": "v1", "type": "slider", "label": "Speed A", "default_value": 3, "min": 0.5, "max": 8, "step": 0.5, "unit": "m/s", "group": "Ball A" },
    { "id": "ctrl_m2", "parameter": "m2", "type": "slider", "label": "Mass B", "default_value": 1, "min": 0.5, "max": 5, "step": 0.5, "unit": "kg", "group": "Ball B" },
    { "id": "ctrl_v2", "parameter": "v2", "type": "slider", "label": "Speed B", "default_value": -1, "min": -5, "max": 5, "step": 0.5, "unit": "m/s", "group": "Ball B" },
    { "id": "ctrl_restitution", "parameter": "restitution", "type": "slider", "label": "Restitution", "default_value": 0.9, "min": 0, "max": 1, "step": 0.1, "unit": "", "group": "Physics" }
  ],
  "knowledge_tags": [
    {
      "id": "kp_momentum",
      "name": "Conservation of Momentum",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "learning_tips": "Total momentum before collision = total momentum after collision."
    },
    {
      "id": "kp_elastic_collision",
      "name": "Elastic Collision",
      "category": "mechanics",
      "level": 2,
      "importance": 0.9,
      "prerequisites": ["kp_momentum"],
      "common_mistakes": ["Forgetting to use relative velocity formula", "Sign errors on velocities"],
      "learning_tips": "In elastic collisions, both momentum AND kinetic energy are conserved."
    },
    {
      "id": "kp_inelastic_collision",
      "name": "Inelastic Collision",
      "category": "mechanics",
      "level": 2,
      "importance": 0.8,
      "learning_tips": "In perfectly inelastic collisions, objects stick together. KE is not conserved."
    }
  ],
  "teacher_steps": [
    { "id": "ts1", "order": 1, "titleKey": "teacher.collision.step1.title", "descKey": "teacher.collision.step1.desc", "timeStart": 0.0 },
    { "id": "ts2", "order": 2, "titleKey": "teacher.collision.step2.title", "descKey": "teacher.collision.step2.desc", "formulaKey": "teacher.collision.step2.formula", "timeStart": 0.5 },
    { "id": "ts3", "order": 3, "titleKey": "teacher.collision.step3.title", "descKey": "teacher.collision.step3.desc", "timeStart": 1.4 },
    { "id": "ts4", "order": 4, "titleKey": "teacher.collision.step4.title", "descKey": "teacher.collision.step4.desc", "formulaKey": "teacher.collision.step4.formula", "timeStart": 1.6 },
    { "id": "ts5", "order": 5, "titleKey": "teacher.collision.step5.title", "descKey": "teacher.collision.step5.desc", "timeStart": 2.0 },
    { "id": "ts6", "order": 6, "titleKey": "teacher.collision.step6.title", "descKey": "teacher.collision.step6.desc", "timeStart": 2.5 },
    { "id": "ts7", "order": 7, "titleKey": "teacher.collision.step7.title", "descKey": "teacher.collision.step7.desc", "timeStart": 3.0 }
  ],
  "charts": [
    { "id": "ch_v_t", "type": "velocity_time", "label": "v-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Velocity", "unit": "m/s", "key": "v" }, "color": "#f59e0b" },
    { "id": "ch_p_t", "type": "momentum", "label": "p-t", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Momentum", "unit": "kg.m/s", "key": "p" }, "color": "#a78bfa" },
    { "id": "ch_ke", "type": "kinetic_energy", "label": "KE", "xAxis": { "label": "Time", "unit": "s", "key": "t" }, "yAxis": { "label": "Kinetic Energy", "unit": "J", "key": "ke" }, "color": "#f59e0b" }
  ]
};
