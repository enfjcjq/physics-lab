import { COLLISION_SCENE } from "@physics-lab/shared";
export const collisionPlugin = {
    id: "collision",
    name: "plugin.collision.name",
    version: "1.0.0",
    category: "mechanics",
    difficulty: "medium",
    getDefaultScene: () => COLLISION_SCENE,
    computeState: (t, params) => {
        const { m1, m2, v1, v2, restitution } = params;
        const e = restitution ?? 0.9;
        // Collision time: when balls meet
        const relSpeed = Math.abs((v1 ?? 3) - (v2 ?? -1));
        const distance = 6; // initial distance between balls (from -3 to 3)
        const tCollision = distance / relSpeed;
        if (t < tCollision) {
            // Before collision: constant velocity
            const x1 = -3 + (v1 ?? 3) * t;
            const x2 = 3 + (v2 ?? -1) * t;
            const ke = 0.5 * (m1 ?? 2) * (v1 ?? 3) * (v1 ?? 3) + 0.5 * (m2 ?? 1) * (v2 ?? -1) * (v2 ?? -1);
            const p = (m1 ?? 2) * (v1 ?? 3) + (m2 ?? 1) * (v2 ?? -1);
            return {
                time: t,
                positions: { ball_a: [x1, 1, 0], ball_b: [x2, 1, 0] },
                velocities: { ball_a: [v1 ?? 3, 0, 0], ball_b: [v2 ?? -1, 0, 0] },
                accelerations: { ball_a: [0, 0, 0], ball_b: [0, 0, 0] },
                energies: { kinetic: ke, potential: 0, total: ke },
                data: { momentum: p, phase: "approach" },
            };
        }
        // After collision: compute new velocities
        const M = (m1 ?? 2) + (m2 ?? 1);
        const v1f = ((m1 ?? 2) - e * (m2 ?? 1)) * (v1 ?? 3) / M + (m2 ?? 1) * (1 + e) * (v2 ?? -1) / M;
        const v2f = ((m2 ?? 1) - e * (m1 ?? 2)) * (v2 ?? -1) / M + (m1 ?? 2) * (1 + e) * (v1 ?? 3) / M;
        const dt = t - tCollision;
        const xCollision = -3 + (v1 ?? 3) * tCollision; // collision point
        const x1 = xCollision + v1f * dt;
        const x2 = xCollision + 0.55 + v2f * dt; // 0.55 = sum of radii
        const ke = 0.5 * (m1 ?? 2) * v1f * v1f + 0.5 * (m2 ?? 1) * v2f * v2f;
        const p = (m1 ?? 2) * v1f + (m2 ?? 1) * v2f;
        return {
            time: t,
            positions: { ball_a: [x1, 1, 0], ball_b: [x2, 1, 0] },
            velocities: { ball_a: [v1f, 0, 0], ball_b: [v2f, 0, 0] },
            accelerations: { ball_a: [0, 0, 0], ball_b: [0, 0, 0] },
            energies: { kinetic: ke, potential: 0, total: ke },
            data: { momentum: p, phase: dt < 0.05 ? "collision" : "separate" },
        };
    },
    getControls: () => [
        { id: "m1", label: "ctrl.mass_a", type: "slider", defaultValue: 2, min: 0.5, max: 5, step: 0.5, unit: "kg", group: "ball_a" },
        { id: "v1", label: "ctrl.speed_a", type: "slider", defaultValue: 3, min: 0.5, max: 8, step: 0.5, unit: "m/s", group: "ball_a" },
        { id: "m2", label: "ctrl.mass_b", type: "slider", defaultValue: 1, min: 0.5, max: 5, step: 0.5, unit: "kg", group: "ball_b" },
        { id: "v2", label: "ctrl.speed_b", type: "slider", defaultValue: -1, min: -5, max: 5, step: 0.5, unit: "m/s", group: "ball_b" },
        { id: "restitution", label: "ctrl.restitution", type: "slider", defaultValue: 0.9, min: 0, max: 1, step: 0.1, unit: "", group: "physics" },
    ],
    getKnowledgePoints: () => [
        { id: "kp1", name: "Momentum", category: "Mechanics", mastered: false },
        { id: "kp2", name: "Elastic Collision", category: "Mechanics", mastered: false },
        { id: "kp3", name: "Inelastic Collision", category: "Mechanics", mastered: false },
        { id: "kp4", name: "Energy Conservation", category: "Energy", mastered: false },
    ],
    getForceAnalysis: () => [
        { name: "No external forces", symbol: "-", direction: "-", magnitude: "0", description: "During collision, internal forces are large but total momentum is conserved. No external horizontal forces." },
    ],
    getMotionAnalysis: () => [
        { title: "Before Collision", content: "Both balls move with constant velocity. Momentum: m1*v1 + m2*v2.", formula: "p_before = m1*v1 + m2*v2" },
        { title: "During Collision", content: "Forces act briefly. Momentum is conserved. KE may decrease (inelastic).", formula: "Impulse = delta-p" },
        { title: "After Collision", content: "New velocities: v1u0027, v2u0027. Momentum unchanged: m1*v1u0027 + m2*v2u0027 = p_before.", formula: "p_after = m1*v1u0027 + m2*v2u0027 = p_before" },
    ],
    getDerivation: () => [
        { step: 1, title: "Momentum conservation", formula: "m1*v1 + m2*v2 = m1*v1u0027 + m2*v2u0027", explanation: "Total momentum is always conserved." },
        { step: 2, title: "Elastic: KE conserved", formula: "v1 - v2 = -(v1u0027 - v2u0027)", explanation: "Relative velocity reverses in elastic collision." },
        { step: 3, title: "Solve for v1u0027", formula: "v1u0027 = ((m1-m2)*v1 + 2*m2*v2)/(m1+m2)", explanation: "From momentum and energy equations." },
        { step: 4, title: "Solve for v2u0027", formula: "v2u0027 = ((m2-m1)*v2 + 2*m1*v1)/(m1+m2)", explanation: "Symmetric solution for second ball." },
        { step: 5, title: "Special cases", formula: "If m1=m2: v1u0027=v2, v2u0027=v1 (swap velocities)", explanation: "Equal mass: velocities are exchanged." },
    ],
    getPhases: () => [
        { id: "approach", label: "phase.approach", icon: "><", timeRange: [0, 1.5] },
        { id: "collision", label: "phase.collision", icon: "O", timeRange: [1.45, 1.6] },
        { id: "separate", label: "phase.separate", icon: "<>", timeRange: [1.6, 4.0] },
    ],
    getCameraPresets: () => [
        { id: "overview", label: "Overview", position: [0, 4, 10], target: [0, 1, 0], fov: 55 },
        { id: "closeup", label: "Close-up", position: [0, 1.5, 4], target: [0, 1, 0], fov: 40 },
    ],
};
//# sourceMappingURL=collision.plugin.js.map