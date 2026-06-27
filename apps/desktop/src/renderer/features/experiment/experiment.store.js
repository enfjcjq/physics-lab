import { create } from "zustand";
import { useHistory } from "../../core/history.store";
import { pluginRegistry } from "../../core/plugin-registry";
import { ensurePlugin } from "../../core/plugin-loader";
/** Precompute all frames at 60fps for the given experiment parameters. */
function buildFrameCache(duration, height, gravity, mass, pluginId, phases) {
    const fps = 60;
    const dt = 1 / fps;
    const frames = [];
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin) {
        // Fallback: basic free-fall computation
        for (let t = 0; t <= duration + dt / 2; t += dt) {
            const y = height - 0.5 * gravity * t * t;
            const vy = -gravity * t;
            const clampedY = Math.max(y, 0.2);
            frames.push({
                time: parseFloat(t.toFixed(4)),
                ballX: 0, ballY: clampedY,
                ball2X: 3, ball2Y: 1,
                ballVelocity: vy, ballAcceleration: -gravity,
                isOnGround: clampedY <= 0.2 && vy < 0,
                phaseId: getPhaseIdFromCache(phases, t),
            });
        }
        return frames;
    }
    // Use plugin computeState for accurate physics
    const getParams = () => {
        switch (pluginId) {
            case "pendulum": return { L: 4.5, g: gravity, theta0: 20, mass };
            case "spring-mass": return { k: 10, mass, amplitude: 2 };
            case "collision": return { m1: 2, m2: 1, v1: 3, v2: -1, restitution: 0.9 };
            case "projectile-motion": return { g: gravity, h0: height, mass, v0: 10, angle: 30 };
            case "inclined-plane": return { g: gravity, angle: 30, friction: 0.3, mass };
            case "free-fall":
            default: return { g: gravity, h0: height, mass };
        }
    };
    const params = getParams();
    for (let t = 0; t <= duration + dt / 2; t += dt) {
        const state = plugin.computeState(t, params);
        const pos = state.positions.ball || [0, height - 0.5 * gravity * t * t, 0];
        const vel = state.velocities.ball || [0, -gravity * t, 0];
        const acc = state.accelerations.ball || [0, -gravity, 0];
        const ballX = pos[0];
        let ballY = Math.max(pos[1], 0.2);
        const ballVy = vel[1];
        const ballAy = acc[1];
        // Handle two-ball plugins (collision)
        let ball2X = 3, ball2Y = 1;
        if (pluginId === "collision") {
            const posB = state.positions.ball_b;
            if (posB) {
                ball2X = posB[0];
                ball2Y = Math.max(posB[1], 0.2);
            }
        }
        frames.push({
            time: parseFloat(t.toFixed(4)),
            ballX, ballY,
            ball2X, ball2Y,
            ballVelocity: ballVy,
            ballAcceleration: ballAy,
            isOnGround: ballY <= 0.2 && ballVy < 0,
            phaseId: getPhaseIdFromCache(phases, t),
        });
    }
    return frames;
}
function getPhaseIdFromCache(phases, t) {
    for (const p of phases) {
        if (t >= p.timeRange[0] && t <= p.timeRange[1])
            return p.id;
    }
    return phases.length > 0 ? phases[0].id : "unknown";
}
/** Binary search in frame cache for nearest frame at or before time t. */
function findFrame(frames, t) {
    if (frames.length === 0) {
        return { time: 0, ballX: 0, ballY: 0, ball2X: 0, ball2Y: 0, ballVelocity: 0, ballAcceleration: 0, isOnGround: false, phaseId: "unknown" };
    }
    let lo = 0, hi = frames.length - 1;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (frames[mid].time <= t)
            lo = mid;
        else
            hi = mid - 1;
    }
    return frames[lo];
}
/** Generate trail points from frame cache (subset for rendering). */
function trailFromCache(frames, toTime, maxPoints = 200) {
    const trail = [];
    const step = Math.max(2, Math.floor(frames.length / maxPoints));
    for (let i = 0; i < frames.length && frames[i].time <= toTime && trail.length < maxPoints; i += step) {
        trail.push({ x: frames[i].ballX, y: frames[i].ballY, z: 0 });
    }
    // Always include current position
    const last = findFrame(frames, toTime);
    if (trail.length === 0 || Math.abs(trail[trail.length - 1].y - last.ballY) > 0.01) {
        trail.push({ x: last.ballX, y: last.ballY, z: 0 });
    }
    return trail;
}
const GROUND_Y = 0.2;
function extractParams(scene) {
    const ball = scene.entities[0];
    const env = scene.environment[0];
    const h = ball.position[1];
    const m = ball.properties.mass ?? 2;
    const g = env.type === "gravity_field" ? env.properties.acceleration : 9.8;
    const dur = scene.timeline?.total_duration ?? 5;
    const phases = scene.timeline?.phases ?? [];
    return { height: h, mass: m, gravity: g, duration: dur, phases };
}
// Module-level counter for trail throttling (not in React state)
let tickCounter = 0;
export const useSimulation = create()((set, get) => ({
    scene: null,
    sceneLoaded: false,
    activePluginId: "free-fall",
    pluginLoading: false,
    mass: 2,
    height: 10,
    gravity: 9.8,
    playing: false,
    timeScale: 1,
    currentTime: 0,
    totalDuration: 3,
    ballX: 0, ballY: 10, ball2X: 3, ball2Y: 1,
    ballVelocity: 0, ballAcceleration: -9.8,
    isBouncing: false, bounceCount: 0,
    trail: [],
    phases: [],
    currentPhaseId: "release",
    frameCache: [],
    // ===== Scene management =====
    setScene: (scene) => {
        const { height, mass, gravity, duration, phases } = extractParams(scene);
        const pluginId = scene.metadata.topic ?? "free-fall";
        const cache = buildFrameCache(duration, height, gravity, mass, pluginId, phases);
        const frame = cache[0];
        set({
            scene, sceneLoaded: true,
            activePluginId: pluginId,
            mass, height, gravity,
            totalDuration: duration, phases,
            currentTime: 0, playing: false,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            trail: [],
            frameCache: cache,
            bounceCount: 0, isBouncing: false,
        });
    },
    setActivePlugin: async (pluginId) => {
        set({ pluginLoading: true });
        try {
            const ok = await ensurePlugin(pluginId);
            const plugin = ok ? pluginRegistry.get(pluginId) : null;
            if (!plugin) {
                set({ pluginLoading: false });
                return;
            }
            const scene = plugin.getDefaultScene();
            const { height, mass, gravity, duration, phases } = extractParams(scene);
            const cache = buildFrameCache(duration, height, gravity, mass, pluginId, phases);
            const frame = cache[0];
            set({
                scene, sceneLoaded: true,
                activePluginId: pluginId,
                pluginLoading: false,
                mass, height, gravity,
                totalDuration: duration, phases,
                currentTime: 0, playing: false,
                ballX: frame.ballX, ballY: frame.ballY,
                ball2X: frame.ball2X, ball2Y: frame.ball2Y,
                ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
                currentPhaseId: frame.phaseId,
                trail: [],
                frameCache: cache,
                bounceCount: 0, isBouncing: false,
            });
        }
        catch {
            set({ pluginLoading: false });
        }
    },
    // ===== Parameter setters (rebuild cache on change) =====
    setMass: (mass) => {
        const { height, gravity, totalDuration, phases, activePluginId, currentTime, playing } = get();
        const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases);
        const frame = findFrame(cache, playing ? currentTime : currentTime);
        set({
            mass,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            frameCache: cache,
        });
    },
    setHeight: (height) => {
        const { mass, gravity, totalDuration, phases, activePluginId, currentTime } = get();
        const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases);
        const frame = findFrame(cache, currentTime);
        set({
            height,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            frameCache: cache,
        });
    },
    setGravity: (gravity) => {
        const { mass, height, totalDuration, phases, activePluginId, currentTime } = get();
        const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases);
        const frame = findFrame(cache, currentTime);
        set({
            gravity,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            frameCache: cache,
        });
    },
    rebuildCache: () => {
        const { mass, height, gravity, totalDuration, phases, activePluginId, currentTime } = get();
        const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases);
        const frame = findFrame(cache, currentTime);
        set({
            frameCache: cache,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
        });
    },
    // ===== Playback =====
    play: () => {
        const { currentTime, totalDuration } = get();
        if (currentTime >= totalDuration)
            get().replay();
        else
            set({ playing: true });
    },
    pause: () => set({ playing: false }),
    stop: () => {
        const { frameCache, gravity, mass, height, phases, activePluginId } = get();
        const frame0 = frameCache[0];
        set({
            playing: false, currentTime: 0,
            ballX: frame0.ballX, ballY: frame0.ballY,
            ball2X: frame0.ball2X, ball2Y: frame0.ball2Y,
            ballVelocity: frame0.ballVelocity, ballAcceleration: frame0.ballAcceleration,
            currentPhaseId: frame0.phaseId,
            trail: [], bounceCount: 0, isBouncing: false,
        });
    },
    replay: () => {
        const { frameCache } = get();
        const frame0 = frameCache[0];
        set({
            playing: true, currentTime: 0,
            ballX: frame0.ballX, ballY: frame0.ballY,
            ball2X: frame0.ball2X, ball2Y: frame0.ball2Y,
            ballVelocity: frame0.ballVelocity, ballAcceleration: frame0.ballAcceleration,
            currentPhaseId: frame0.phaseId,
            trail: [], bounceCount: 0, isBouncing: false,
        });
    },
    togglePlay: () => {
        const { playing } = get();
        playing ? get().pause() : get().play();
    },
    setSpeed: (timeScale) => set({ timeScale }),
    // ===== Navigation (instant, cache-driven) =====
    jumpToTime: (t) => {
        const { totalDuration, frameCache, phases } = get();
        const clamped = Math.max(0, Math.min(t, totalDuration));
        const frame = findFrame(frameCache, clamped);
        const trail = trailFromCache(frameCache, clamped);
        set({
            currentTime: clamped,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            playing: false,
            trail,
            isBouncing: frame.isOnGround,
        });
    },
    stepForward: () => {
        const { currentTime, totalDuration, frameCache } = get();
        const t = Math.min(currentTime + 1 / 60, totalDuration);
        const frame = findFrame(frameCache, t);
        const trail = trailFromCache(frameCache, t);
        set({
            currentTime: t,
            ballX: frame.ballX, ballY: frame.ballY,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            playing: false,
            trail,
        });
    },
    stepBackward: () => {
        const { currentTime, frameCache } = get();
        const t = Math.max(currentTime - 1 / 60, 0);
        const frame = findFrame(frameCache, t);
        const trail = trailFromCache(frameCache, t);
        set({
            currentTime: t,
            ballX: frame.ballX, ballY: frame.ballY,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            playing: false,
            trail,
        });
    },
    jumpToPhase: (phaseId) => {
        const { phases, frameCache, totalDuration } = get();
        const p = phases.find((ph) => ph.id === phaseId);
        if (!p)
            return;
        const t = p.timeRange[0];
        const frame = findFrame(frameCache, t);
        const trail = trailFromCache(frameCache, t);
        set({
            currentTime: t,
            ballX: frame.ballX, ballY: frame.ballY,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: phaseId,
            playing: false,
            trail,
        });
    },
    // ===== History =====
    undo: () => {
        const snap = useHistory.getState().undo();
        if (snap) {
            const g = snap.params.g ?? get().gravity;
            const h = snap.params.h0 ?? get().height;
            const m = snap.params.mass ?? get().mass;
            const pid = String(snap.params.pluginId ?? get().activePluginId);
            const { phases } = get();
            const cache = buildFrameCache(get().totalDuration, h, g, m, pid, phases);
            const frame = findFrame(cache, snap.time);
            set({
                mass: m, height: h, gravity: g, activePluginId: pid,
                currentTime: snap.time,
                ballX: frame.ballX, ballY: frame.ballY,
                ballVelocity: frame.ballVelocity,
                playing: false,
                frameCache: cache,
                trail: trailFromCache(cache, snap.time),
            });
        }
    },
    redo: () => {
        const snap = useHistory.getState().redo();
        if (snap) {
            const g = snap.params.g ?? get().gravity;
            const h = snap.params.h0 ?? get().height;
            const m = snap.params.mass ?? get().mass;
            const pid = String(snap.params.pluginId ?? get().activePluginId);
            const { phases } = get();
            const cache = buildFrameCache(get().totalDuration, h, g, m, pid, phases);
            const frame = findFrame(cache, snap.time);
            set({
                mass: m, height: h, gravity: g, activePluginId: pid,
                currentTime: snap.time,
                ballX: frame.ballX, ballY: frame.ballY,
                ballVelocity: frame.ballVelocity,
                playing: false,
                frameCache: cache,
                trail: trailFromCache(cache, snap.time),
            });
        }
    },
    // ===== Tick (playback update, throttled trail updates) =====
    tick: (rawDelta) => {
        const s = get();
        if (!s.playing)
            return;
        const dt = Math.min(rawDelta * s.timeScale, 0.05);
        const newTime = s.currentTime + dt;
        if (newTime >= s.totalDuration) {
            const lastFrame = s.frameCache[s.frameCache.length - 1];
            set({
                currentTime: s.totalDuration,
                playing: false,
                ballX: lastFrame.ballX, ballY: lastFrame.ballY,
                ball2X: lastFrame.ball2X, ball2Y: lastFrame.ball2Y,
                ballVelocity: lastFrame.ballVelocity, ballAcceleration: lastFrame.ballAcceleration,
                currentPhaseId: lastFrame.phaseId,
                isBouncing: lastFrame.isOnGround,
                trail: trailFromCache(s.frameCache, s.totalDuration),
            });
            return;
        }
        const frame = findFrame(s.frameCache, newTime);
        const justBounced = frame.isOnGround && !s.isBouncing;
        // Throttle trail updates: only rebuild every 3 ticks
        // Use module-level counter to avoid polluting React state
        tickCounter += 1;
        const trail = tickCounter % 3 === 0
            ? trailFromCache(s.frameCache, newTime)
            : s.trail;
        set({
            currentTime: newTime,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            trail,
            isBouncing: frame.isOnGround,
            bounceCount: justBounced ? s.bounceCount + 1 : s.bounceCount,
        });
    },
}));
//# sourceMappingURL=experiment.store.js.map