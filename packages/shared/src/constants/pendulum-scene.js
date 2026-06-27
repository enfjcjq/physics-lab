export const PENDULUM_SCENE = {
    $schema: "https://physics-lab.app/schemas/physics-scene/2.0.json",
    version: "2.0",
    metadata: {
        title: "Simple Pendulum",
        description: "A pendulum swinging under gravity. Simple harmonic motion for small angles.",
        subject: "mechanics",
        topic: "pendulum",
        difficulty: "medium",
        grade: "senior_high",
        tags: ["pendulum", "simple harmonic motion", "period", "oscillation"],
    },
    entities: [
        {
            id: "ball_1",
            type: "ball",
            name: "Bob",
            position: [2, 2, 0],
            properties: { mass: 1.0, radius: 0.18, restitution: 0 },
            initial_conditions: { velocity: [0, 0, 0] },
            visual: { color: "#60a5fa", material: "metal", show_trail: true, trail_color: "#93c5fd44", trail_max_points: 300 },
        },
        {
            id: "pivot",
            type: "block",
            name: "Pivot",
            position: [0, 6, 0],
            scale: [0.3, 0.3, 0.3],
            properties: { mass: 0, dimensions: [0.3, 0.3, 0.3], is_static: true },
            visual: { color: "#475569" },
        },
    ],
    environment: [
        { type: "gravity_field", properties: { acceleration: 9.8, direction: [0, -1, 0] } },
    ],
    forces: [
        {
            id: "gravity_bob", type: "gravity", target_entity: "ball_1",
            magnitude: "mass * g", direction: [0, -1, 0], is_constant: true,
            description: "Gravity on bob",
            visual: { color: "#EF4444", arrow_scale: 0.3, label: "G" },
        },
        {
            id: "tension", type: "tension", target_entity: "ball_1",
            magnitude: "variable", direction: "toward pivot", is_constant: false,
            description: "String tension",
            visual: { color: "#3b82f6", arrow_scale: 0.3, label: "T" },
        },
    ],
    constraints: [
        {
            id: "string_constraint", type: "fixed_point", entities: ["ball_1", "pivot"],
            properties: { length: 4.5 },
            description: "Massless string of fixed length",
        },
    ],
    equations: [
        {
            id: "eq_period", name: "Period (small angle)",
            expression: "T = 2*pi * sqrt(L/g)",
            variables: {
                L: { symbol: "L", unit: "m", description: "String length" },
                g: { symbol: "g", unit: "m/s2", description: "Gravity acceleration" },
                T: { symbol: "T", unit: "s", description: "Period" },
            },
            type: "target", is_solution: true,
        },
        {
            id: "eq_angle", name: "Angular displacement",
            expression: "theta(t) = theta0 * cos(omega * t)",
            variables: {
                theta0: { symbol: "theta0", unit: "rad", description: "Initial angle" },
                omega: { symbol: "omega", unit: "rad/s", description: "Angular frequency" },
            },
            type: "motion",
        },
    ],
    timeline: {
        total_duration: 4.5,
        fps: 60,
        events: [
            { id: "start", time: 0.0, type: "phase_start", data: { label: "Release" }, description: "Pendulum released from angle" },
            { id: "lowest", time: 1.07, type: "state_change", data: { label: "Lowest point" }, description: "Bob at lowest point, max velocity" },
            { id: "max_angle", time: 2.14, type: "state_change", data: { label: "Max angle" }, description: "Bob at opposite maximum angle" },
        ],
        phases: [
            { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.1], color: "#22c55e", description: "Initial release from angle" },
            { id: "swinging", label: "phase.oscillating", icon: "~", timeRange: [0.05, 4.5], color: "#3b82f6", description: "Simple harmonic oscillation" },
        ],
    },
    camera_script: [
        { id: "overview", time: 0.0, position: [4, 4, 8], target: [1, 3, 0], fov: 55, description: "Front view" },
        { id: "side", time: 1.0, position: [8, 3, 1], target: [1, 3, 0], fov: 50, description: "Side view" },
    ],
    ui_controls: [
        { id: "ctrl_length", parameter: "constraints[0].properties.length", type: "slider", label: "String Length", default_value: 4.5, min: 1, max: 8, step: 0.1, unit: "m", group: "Setup" },
        { id: "ctrl_angle", parameter: "angle", type: "slider", label: "Initial Angle", default_value: 20, min: 5, max: 45, step: 1, unit: "deg", group: "Initial" },
        { id: "ctrl_mass", parameter: "entities[0].properties.mass", type: "slider", label: "Bob Mass", default_value: 1.0, min: 0.1, max: 5.0, step: 0.1, unit: "kg", group: "Physics" },
        { id: "ctrl_gravity", parameter: "environment[0].properties.acceleration", type: "slider", label: "Gravity", default_value: 9.8, min: 0.1, max: 20.0, step: 0.5, unit: "m/s2", group: "Physics" },
    ],
    knowledge_tags: [
        { id: "kp_shm", name: "Simple Harmonic Motion", category: "mechanics", level: 2, importance: 1.0,
            learning_tips: "Acceleration is proportional to negative displacement." },
        { id: "kp_pendulum", name: "Simple Pendulum", category: "mechanics", level: 2, importance: 0.9,
            common_mistakes: ["Assuming period depends on mass", "Forgetting small angle approximation"],
            learning_tips: "Period depends only on L and g for small angles." },
        { id: "kp_period", name: "Oscillation Period", category: "mechanics", level: 2, importance: 0.8,
            learning_tips: "T = 2*pi*sqrt(L/g) is independent of amplitude (small angles)." },
    ],
    teacher_steps: [
        { id: "ps1", order: 1, titleKey: "teacher.pendulum.step1.title", descKey: "teacher.pendulum.step1.desc", timeStart: 0.0 },
        { id: "ps2", order: 2, titleKey: "teacher.pendulum.step2.title", descKey: "teacher.pendulum.step2.desc", formulaKey: "teacher.pendulum.step2.formula", timeStart: 0.3 },
        { id: "ps3", order: 3, titleKey: "teacher.pendulum.step3.title", descKey: "teacher.pendulum.step3.desc", formulaKey: "teacher.pendulum.step3.formula", timeStart: 1.0 },
        { id: "ps4", order: 4, titleKey: "teacher.pendulum.step4.title", descKey: "teacher.pendulum.step4.desc", formulaKey: "teacher.pendulum.step4.formula", timeStart: 2.0 },
        { id: "ps5", order: 5, titleKey: "teacher.pendulum.step5.title", descKey: "teacher.pendulum.step5.desc", timeStart: 3.0 },
    ],
    charts: [
        { id: "ch_angle", type: "position_time", label: "Angle-t", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Angle", unit: "rad", key: "theta" }, color: "#22c55e" },
        { id: "ch_v_t", type: "velocity_time", label: "v-t", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Velocity", unit: "m/s", key: "v" }, color: "#f59e0b" },
        { id: "ch_energy", type: "kinetic_energy", label: "Energy", xAxis: { label: "Time", unit: "s", key: "t" }, yAxis: { label: "Energy", unit: "J", key: "E" }, color: "#f59e0b" },
    ],
};
//# sourceMappingURL=pendulum-scene.js.map