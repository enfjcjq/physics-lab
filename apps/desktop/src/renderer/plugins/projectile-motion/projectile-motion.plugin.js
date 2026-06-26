import { PROJECTILE_MOTION_SCENE } from "@physics-lab/shared";
export const projectileMotionPlugin = {
    id: "projectile-motion",
    name: "plugin.projectile-motion.name",
    version: "1.0.0",
    category: "mechanics",
    difficulty: "medium",
    getDefaultScene: () => PROJECTILE_MOTION_SCENE,
    computeState: (t, params) => {
        const { g, v0, angle } = params;
        const theta = (angle * Math.PI) / 180;
        const vx = v0 * Math.cos(theta);
        const vy0 = v0 * Math.sin(theta);
        const px = vx * t;
        const py = vy0 * t - 0.5 * g * t * t;
        const velY = vy0 - g * t;
        const groundY = 0.2;
        if (py <= groundY && velY < 0) {
            const reboundVy = -velY * 0.6;
            const speed = Math.sqrt(vx * vx * 0.36 + reboundVy * reboundVy);
            return {
                time: t,
                positions: { ball: [px, groundY, 0] },
                velocities: { ball: [vx * 0.6, reboundVy, 0] },
                accelerations: { ball: [0, -g, 0] },
                energies: {
                    kinetic: 0.5 * params.mass * speed * speed,
                    potential: params.mass * g * groundY,
                    total: 0.5 * params.mass * speed * speed + params.mass * g * groundY,
                },
            };
        }
        const speed = Math.sqrt(vx * vx + Math.max(velY, -20) * Math.max(velY, -20));
        return {
            time: t,
            positions: { ball: [px, Math.max(py, groundY), 0] },
            velocities: { ball: [vx, velY, 0] },
            accelerations: { ball: [0, -g, 0] },
            energies: {
                kinetic: 0.5 * params.mass * speed * speed,
                potential: params.mass * g * Math.max(py, 0),
                total: 0.5 * params.mass * speed * speed + params.mass * g * Math.max(py, 0),
            },
        };
    },
    getControls: () => [
        { id: "v0", label: "ctrl.initial_speed", type: "slider", defaultValue: 10, min: 2, max: 30, step: 0.5, unit: "m/s", group: "launch" },
        { id: "angle", label: "ctrl.launch_angle", type: "slider", defaultValue: 30, min: 5, max: 85, step: 1, unit: "deg", group: "launch" },
        { id: "g", label: "ctrl.gravity", type: "slider", defaultValue: 9.8, min: 0.1, max: 30, step: 0.1, unit: "m/s2", group: "physics" },
        { id: "mass", label: "ctrl.mass", type: "slider", defaultValue: 1, min: 0.1, max: 10, step: 0.1, unit: "kg", group: "physics" },
    ],
    getKnowledgePoints: () => [
        { id: "kp1", name: "2D Kinematics", category: "Kinematics", mastered: true },
        { id: "kp2", name: "Vector Decomposition", category: "Vectors", mastered: true },
        { id: "kp3", name: "Parabolic Motion", category: "Kinematics", mastered: false },
        { id: "kp4", name: "Independence of Motions", category: "Concepts", mastered: false },
    ],
    getForceAnalysis: () => [
        { name: "Gravity", symbol: "G", direction: "Downward (vertical only)", magnitude: "G = mg", description: "Only gravity acts during flight. No horizontal forces." },
    ],
    getMotionAnalysis: () => [
        { title: "Horizontal", content: "Constant velocity, no horizontal force.", formula: "vx = v0x (constant)" },
        { title: "Vertical", content: "Constant downward acceleration g.", formula: "a_y = -g" },
        { title: "Trajectory", content: "Parabola from combined horizontal and vertical motion.", formula: "y = x*tan(theta) - (g*x^2)/(2*v0x^2)" },
        { title: "Key Points", content: "Peak: vy=0. Range: y returns to 0.", formula: "T = 2*v0*sin(theta)/g" },
    ],
    getDerivation: () => [
        { step: 1, title: "Decompose velocity", formula: "vx = v0*cos(theta), vy0 = v0*sin(theta)", explanation: "Split into horizontal and vertical." },
        { step: 2, title: "Horizontal", formula: "x(t) = v0*cos(theta)*t", explanation: "No horizontal force: constant vx" },
        { step: 3, title: "Vertical", formula: "y(t) = v0*sin(theta)*t - 1/2*g*t^2", explanation: "Constant downward acceleration." },
        { step: 4, title: "Range", formula: "R = v0^2*sin(2*theta)/g", explanation: "y=0 gives flight time, substitute into x(t)." },
        { step: 5, title: "Max Height", formula: "H = (v0*sin(theta))^2/(2g)", explanation: "vy=0 gives time to peak, substitute into y(t)." },
    ],
    getPhases: () => [
        { id: "launch", label: "phase.launch", icon: ">", timeRange: [0, 0.05] },
        { id: "ascending", label: "phase.ascending", icon: "/", timeRange: [0.05, 0.51] },
        { id: "peak", label: "phase.peak", icon: "o", timeRange: [0.48, 0.55] },
        { id: "descending", label: "phase.descending", icon: "\\", timeRange: [0.55, 1.02] },
        { id: "impact", label: "phase.impact", icon: "O", timeRange: [0.98, 1.5] },
        { id: "aftermath", label: "phase.aftermath", icon: ".", timeRange: [1.5, 3.0] },
    ],
    getCameraPresets: () => [
        { id: "overview", label: "Overview", position: [10, 6, 12], target: [5, 2, 0], fov: 55 },
        { id: "peak", label: "Peak", position: [4.5, 3, 8], target: [4.5, 1.5, 0], fov: 50 },
        { id: "impact", label: "Impact", position: [8, 1, 6], target: [8.5, 0.5, 0], fov: 45 },
    ],
};
//# sourceMappingURL=projectile-motion.plugin.js.map