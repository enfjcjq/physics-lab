"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const FREE_FALL_SCENE = {
  $schema: "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "Free Fall",
    description: "A ball falls from height under gravity. Air resistance ignored.",
    subject: "mechanics",
    topic: "free_fall",
    difficulty: "easy",
    grade: "senior_high",
    tags: ["free fall", "constant acceleration", "kinematics"]
  },
  entities: [
    {
      id: "ball_1",
      type: "ball",
      name: "Ball",
      position: [0, 10, 0],
      properties: { mass: 2, radius: 0.2, restitution: 0.6 },
      initial_conditions: { velocity: [0, 0, 0] },
      visual: { color: "#FF6B6B", material: "metal", show_trail: true, trail_color: "#FF6B6B44", trail_max_points: 600 }
    },
    {
      id: "ground",
      type: "block",
      name: "Ground",
      position: [0, -0.05, 0],
      scale: [12, 0.1, 12],
      properties: { mass: 0, dimensions: [12, 0.1, 12], is_static: true, friction_coefficient: 0.5 },
      visual: { color: "#334155" }
    }
  ],
  environment: [
    { type: "gravity_field", properties: { acceleration: 9.8, direction: [0, -1, 0] } }
  ],
  forces: [
    {
      id: "gravity_ball_1",
      type: "gravity",
      target_entity: "ball_1",
      magnitude: "mass * g",
      direction: [0, -1, 0],
      is_constant: true,
      description: "Gravity",
      visual: { color: "#EF4444", arrow_scale: 0.3, label: "G" }
    }
  ],
  constraints: [
    {
      id: "ground_collision",
      type: "contact",
      entities: ["ball_1", "ground"],
      properties: { restitution: 0.6, friction: 0.5 },
      description: "Ground collision"
    }
  ],
  equations: [
    {
      id: "eq_motion",
      name: "Motion equation",
      expression: "y(t) = h0 - (1/2) * g * t^2",
      variables: {
        h0: { symbol: "h0", unit: "m", description: "Initial height" },
        g: { symbol: "g", unit: "m/s2", description: "Gravity" },
        t: { symbol: "t", unit: "s", description: "Time" }
      },
      type: "motion"
    },
    {
      id: "eq_velocity",
      name: "Impact velocity",
      expression: "v = sqrt(2*g*h0)",
      variables: {
        v: { symbol: "v", unit: "m/s", description: "Impact velocity" },
        g: { symbol: "g", unit: "m/s2", description: "Gravity" },
        h0: { symbol: "h0", unit: "m", description: "Initial height" }
      },
      type: "target",
      is_solution: true
    }
  ],
  timeline: {
    total_duration: 5,
    fps: 60,
    events: [
      { id: "start", time: 0, type: "phase_start", data: { label: "Release" }, description: "Ball released from rest" },
      { id: "impact", time: 1.43, type: "collision", target: "ball_1", data: { collision_with: "ground", impact_velocity: 14 }, description: "Impact with ground" }
    ],
    phases: [
      { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.05], color: "#22c55e", description: "Ball at rest, initial state" },
      { id: "falling", label: "phase.falling", icon: "v", timeRange: [0.05, 1.4], color: "#3b82f6", description: "Uniformly accelerated motion downward" },
      { id: "impact", label: "phase.impact", icon: "O", timeRange: [1.35, 1.55], color: "#f59e0b", description: "Collision with ground" },
      { id: "bounce", label: "phase.bounce", icon: "^", timeRange: [1.5, 5], color: "#ef4444", description: "Rebound and secondary motion" }
    ]
  },
  camera_script: [
    { id: "overview", time: 0, position: [8, 6, 8], target: [0, 5, 0], fov: 60, description: "Overview" },
    { id: "closeup", time: 1.3, duration: 0.5, position: [3, 3, 3], target: [0, 2, 0], fov: 45, description: "Impact close-up" }
  ],
  ui_controls: [
    { id: "ctrl_mass", parameter: "entities[0].properties.mass", type: "slider", label: "Mass", default_value: 2, min: 0.1, max: 10, step: 0.1, unit: "kg", group: "Physics" },
    { id: "ctrl_gravity", parameter: "environment[0].properties.acceleration", type: "slider", label: "Gravity", default_value: 9.8, min: 0.1, max: 20, step: 0.5, unit: "m/s2", group: "Physics" },
    { id: "ctrl_height", parameter: "entities[0].position[1]", type: "slider", label: "Height", default_value: 10, min: 1, max: 50, step: 0.5, unit: "m", group: "Initial" }
  ],
  knowledge_tags: [
    {
      id: "kp_free_fall",
      name: "Free Fall",
      category: "mechanics",
      level: 2,
      importance: 1,
      common_mistakes: ["Forgetting initial velocity is zero", "Confusing displacement with distance"],
      learning_tips: "Verify with energy conservation: mgh = 1/2 mv2"
    },
    {
      id: "kp_constant_accel",
      name: "Constant Acceleration",
      category: "mechanics",
      level: 1,
      importance: 0.9,
      prerequisites: ["kp_free_fall"],
      common_mistakes: ["Sign errors with g direction"]
    },
    {
      id: "kp_newton2",
      name: "Newton's 2nd Law",
      category: "mechanics",
      level: 2,
      importance: 1,
      learning_tips: "F = ma is the bridge between forces and motion"
    },
    {
      id: "kp_energy_cons",
      name: "Energy Conservation",
      category: "mechanics",
      level: 2,
      importance: 0.8,
      learning_tips: "Total mechanical energy is constant when only gravity works"
    }
  ],
  teacher_steps: [
    { id: "ts1", order: 1, titleKey: "teacher.step1.title", descKey: "teacher.step1.desc", timeStart: 0 },
    { id: "ts2", order: 2, titleKey: "teacher.step2.title", descKey: "teacher.step2.desc", formulaKey: "teacher.step2.formula", timeStart: 0.3 },
    { id: "ts3", order: 3, titleKey: "teacher.step3.title", descKey: "teacher.step3.desc", formulaKey: "teacher.step3.formula", timeStart: 0.6 },
    { id: "ts4", order: 4, titleKey: "teacher.step4.title", descKey: "teacher.step4.desc", formulaKey: "teacher.step4.formula", timeStart: 1 },
    { id: "ts5", order: 5, titleKey: "teacher.step5.title", descKey: "teacher.step5.desc", formulaKey: "teacher.step5.formula", timeStart: 1.4 },
    { id: "ts6", order: 6, titleKey: "teacher.step6.title", descKey: "teacher.step6.desc", timeStart: 1.5 },
    { id: "ts7", order: 7, titleKey: "teacher.step7.title", descKey: "teacher.step7.desc", timeStart: 2 }
  ],
  charts: [
    { id: "ch_s_t", type: "position_time", label: "s-t", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Displacement", unit: "m", key: "s" }, color: "#22c55e" },
    { id: "ch_v_t", type: "velocity_time", label: "v-t", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Velocity", unit: "m/s", key: "v" }, color: "#f59e0b" },
    { id: "ch_a_t", type: "acceleration_time", label: "a-t", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Acceleration", unit: "m/s2", key: "a" }, color: "#ef4444" },
    { id: "ch_ke", type: "kinetic_energy", label: "KE", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Kinetic Energy", unit: "J", key: "ke" }, color: "#f59e0b" },
    { id: "ch_pe", type: "potential_energy", label: "PE", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Potential Energy", unit: "J", key: "pe" }, color: "#22c55e" },
    { id: "ch_me", type: "mechanical_energy", label: "ME", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Mechanical Energy", unit: "J", key: "me" }, color: "#3b82f6" }
  ]
};
exports.FREE_FALL_SCENE = FREE_FALL_SCENE;
