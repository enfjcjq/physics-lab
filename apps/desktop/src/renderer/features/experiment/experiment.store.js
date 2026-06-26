import { create } from "zustand";
import { PHASES } from "../../stores/ui.store";
import { useHistory } from "../../core/history.store";
function getPhaseFromTime(t) {
    for (const p of PHASES) {
        if (t >= p.timeRange[0] && t <= p.timeRange[1])
            return p.id;
    }
    return t < 0 ? "release" : "bounce";
}
function computePhysics(height, gravity, t) {
    const y = height - 0.5 * gravity * t * t;
    const vy = -gravity * t;
    return { y: Math.max(y, 0.2), vy };
}
const GROUND_Y = 0.2;
const RESTITUTION = 0.6;
const MAX_TRAIL = 600;
const FRAME_STEP = 1 / 60;
/** Regenerate trail from physics formula up to a given time */
function generateTrail(height, gravity, toTime) {
    const trail = [];
    const trailDt = 1 / 60;
    let t = 0;
    while (t <= toTime && trail.length < MAX_TRAIL) {
        const { y, vy } = computePhysics(height, gravity, t);
        let ballY = y;
        if (y <= GROUND_Y + 0.01 && vy < 0) {
            ballY = GROUND_Y;
        }
        trail.push({ x: 0, y: Math.max(ballY, GROUND_Y), z: 0 });
        t += trailDt;
    }
    if (trail.length === 0) {
        trail.push({ x: 0, y: height, z: 0 });
    }
    return trail;
}
export const useSimulation = create((set, get) => ({
    scene: null,
    sceneLoaded: false,
    mass: 2.0,
    height: 10.0,
    gravity: 9.8,
    playing: true,
    timeScale: 1,
    currentTime: 0,
    totalDuration: 5.0,
    currentPhase: "release",
    ballY: 10.0,
    ballVelocity: 0,
    trail: [{ x: 0, y: 10, z: 0 }],
    setScene: (scene) => {
        const ball = scene.entities[0];
        const env = scene.environment[0];
        set({
            scene,
            sceneLoaded: true,
            mass: ball.properties.mass,
            height: ball.position[1],
            gravity: env.type === "gravity_field" ? env.properties.acceleration : 9.8,
            ballY: ball.position[1],
            ballVelocity: 0,
            currentTime: 0,
            currentPhase: "release",
            totalDuration: scene.timeline?.total_duration ?? 5.0,
            trail: [{ x: 0, y: ball.position[1], z: 0 }],
        });
    },
    setMass: (mass) => set({ mass }),
    setHeight: (height) => {
        const trail = generateTrail(height, get().gravity, 0);
        set({
            height,
            ballY: height,
            ballVelocity: 0,
            currentTime: 0,
            currentPhase: "release",
            trail,
        });
    },
    setGravity: (gravity) => set({ gravity }),
    play: () => set({ playing: true }),
    pause: () => set({ playing: false }),
    stop: () => {
        const { height, gravity } = get();
        const trail = generateTrail(height, gravity, 0);
        set({
            playing: false,
            currentTime: 0,
            ballY: height,
            ballVelocity: 0,
            currentPhase: "release",
            trail,
        });
    },
    replay: () => {
        const { height, gravity } = get();
        const trail = generateTrail(height, gravity, 0);
        set({
            playing: true,
            currentTime: 0,
            ballY: height,
            ballVelocity: 0,
            currentPhase: "release",
            trail,
        });
    },
    togglePlay: () => set((s) => ({ playing: !s.playing })),
    setSpeed: (timeScale) => set({ timeScale }),
    jumpToTime: (t) => {
        const { height, gravity, totalDuration } = get();
        const clamped = Math.max(0, Math.min(t, totalDuration));
        const { y, vy } = computePhysics(height, gravity, clamped);
        const trail = generateTrail(height, gravity, clamped);
        const phase = getPhaseFromTime(clamped);
        set({
            currentTime: clamped,
            ballY: y,
            ballVelocity: vy,
            currentPhase: phase,
            playing: false,
            trail,
        });
    },
    stepForward: () => {
        const { currentTime, height, gravity, totalDuration } = get();
        const t = Math.min(currentTime + FRAME_STEP, totalDuration);
        const { y, vy } = computePhysics(height, gravity, t);
        const trail = generateTrail(height, gravity, t);
        set({
            currentTime: t,
            ballY: y,
            ballVelocity: vy,
            currentPhase: getPhaseFromTime(t),
            playing: false,
            trail,
        });
    },
    stepBackward: () => {
        const { currentTime, height, gravity } = get();
        const t = Math.max(currentTime - FRAME_STEP, 0);
        const { y, vy } = computePhysics(height, gravity, t);
        const trail = generateTrail(height, gravity, t);
        set({
            currentTime: t,
            ballY: y,
            ballVelocity: vy,
            currentPhase: getPhaseFromTime(t),
            playing: false,
            trail,
        });
    },
    jumpToPhase: (phase) => {
        const phaseInfo = PHASES.find((p) => p.id === phase);
        if (!phaseInfo)
            return;
        const t = phaseInfo.timeRange[0];
        const { height, gravity } = get();
        const { y, vy } = computePhysics(height, gravity, t);
        const trail = generateTrail(height, gravity, t);
        set({
            currentTime: t,
            ballY: y,
            ballVelocity: vy,
            currentPhase: phase,
            playing: false,
            trail,
        });
    },
    undo: () => {
        const snap = useHistory.getState().undo();
        if (snap) {
            const g = snap.params.g ?? get().gravity;
            const h = snap.params.h0 ?? get().height;
            const trail = generateTrail(h, g, snap.time);
            set({
                mass: snap.params.mass ?? get().mass,
                height: h,
                gravity: g,
                currentTime: snap.time,
                ballY: snap.ballY,
                ballVelocity: snap.ballVelocity,
                playing: false,
                trail,
            });
        }
    },
    redo: () => {
        const snap = useHistory.getState().redo();
        if (snap) {
            const g = snap.params.g ?? get().gravity;
            const h = snap.params.h0 ?? get().height;
            const trail = generateTrail(h, g, snap.time);
            set({
                mass: snap.params.mass ?? get().mass,
                height: h,
                gravity: g,
                currentTime: snap.time,
                ballY: snap.ballY,
                ballVelocity: snap.ballVelocity,
                playing: false,
                trail,
            });
        }
    },
    saveBookmark: () => {
        const s = get();
        useHistory.getState().addBookmark({
            id: "", label: "",
            timestamp: Date.now(),
            time: s.currentTime,
            params: { mass: s.mass, h0: s.height, g: s.gravity },
            ballY: s.ballY,
            ballVelocity: s.ballVelocity,
        });
    },
    tick: (rawDelta) => {
        const s = get();
        if (!s.playing)
            return;
        const dt = Math.min(rawDelta * s.timeScale, 0.05);
        const newTime = s.currentTime + dt;
        if (newTime >= s.totalDuration) {
            const trail = generateTrail(s.height, s.gravity, s.totalDuration);
            set({ currentTime: s.totalDuration, playing: false, trail, ballY: GROUND_Y, ballVelocity: 0, currentPhase: "bounce" });
            return;
        }
        const { y, vy } = computePhysics(s.height, s.gravity, newTime);
        let ballY = y;
        let ballVelocity = vy;
        // Bounce: clamp to ground and reverse velocity
        if (y <= GROUND_Y && vy < 0) {
            ballY = GROUND_Y;
            ballVelocity = -vy * RESTITUTION;
            // Don't reset time - keep timeline continuous
            // Just clamp position and reverse velocity for visual bounce
        }
        const phase = getPhaseFromTime(newTime);
        const newTrail = [...s.trail, { x: 0, y: ballY, z: 0 }].slice(-MAX_TRAIL);
        set({ currentTime: newTime, ballY, ballVelocity, currentPhase: phase, trail: newTrail });
    },
}));
//# sourceMappingURL=experiment.store.js.map