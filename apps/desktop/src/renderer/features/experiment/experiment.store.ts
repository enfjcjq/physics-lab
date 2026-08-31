import { create } from "zustand";
import { useResume } from "../../core/resume.store";
import { useI18n } from "../../core/i18n";
import type { PhysicsScene, TimelinePhase, PhysicsState } from "@physics-lab/shared";
import { useHistory } from "../../core/history.store";
import { pluginRegistry } from "../../core/plugin-registry";
import { createEngine } from "@physics-lab/shared";
import { ensureTeachingScript } from "@physics-lab/shared";
import { localizeScene } from "@physics-lab/ai-parser";
import type { PhysicsSceneV2 } from "@physics-lab/shared";
import { ensurePlugin } from "../../core/plugin-loader";

export type SpeedLevel = 0.25 | 0.3 | 0.5 | 0.8 | 1 | 2;

// ---- Frame Cache: precomputed physics data for instant scrubbing ----

export interface CachedFrame {
  time: number;
  ballX: number;
  ballY: number;
  ball2X: number;
  ball2Y: number;
  ballVelocity: number;
  ballAcceleration: number;
  isOnGround: boolean;
  phaseId: string;
}

/** Precompute all frames at 60fps for the given experiment parameters. */
function buildFrameCache(
  duration: number,
  height: number,
  gravity: number,
  mass: number,
  pluginId: string,
  phases: TimelinePhase[],
  scene?: PhysicsScene | null
): CachedFrame[] {
  const fps = 60;
  const dt = 1 / fps;
  const frames: CachedFrame[] = [];
  // Check if scene has simulation block �� use generic engine
  // scene passed as parameter
  if ((scene as any)?.simulation?.equations) {
    // Update simulation params with current slider values for real-time control
    const simScene = { ...scene, simulation: { ...(scene as any).simulation } };
    if (simScene.simulation.params) {
      simScene.simulation.params = { ...simScene.simulation.params, g: gravity, h0: height, m: mass };
    }
    const engine = createEngine(simScene as PhysicsSceneV2);
    const allFrames = engine.precomputeAll();
    for (const frame of allFrames) {
      const pos = frame.positions.ball ?? frame.positions[Object.keys(frame.positions)[0]] ?? [0, 0, 0];
      const vel = frame.velocities.ball ?? frame.velocities[Object.keys(frame.velocities)[0]] ?? [0, 0, 0];
      const acc = frame.accelerations.ball ?? frame.accelerations[Object.keys(frame.accelerations)[0]] ?? [0, 0, 0];
      frames.push({
        time: parseFloat(frame.time.toFixed(4)),
        ballX: pos[0], ballY: Math.max(pos[1], 0.2),
        ball2X: 0, ball2Y: 0,
        ballVelocity: vel[1], ballAcceleration: acc[1],
        isOnGround: pos[1] <= 0.22 && vel[1] <= 0,
        phaseId: getPhaseIdFromCache(phases, frame.time),
      });
    }
    return frames;
  }

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
  const getParams = (): Record<string, number> => {
    switch (pluginId) {
      case "pendulum": return { L: 4.5, g: gravity, theta0: 20, mass };
      case "spring-mass": return { k: 10, mass, amplitude: 2 };
      case "collision": return { m1: 2, m2: 1, v1: 3, v2: -1, restitution: 0.9 };
      case "projectile-motion": return { g: gravity, h0: height, mass, v0: 10, angle: 30 };
      case "inclined-plane": return { g: gravity, angle: 30, friction: 0.3, mass };
      case "free-fall": return { g: gravity, h0: height, mass };
      case "circular-motion": return { r: 2, omega: Math.PI, y0: 3, mass };
      case "buoyancy": return { rho_obj: 800, rho_fluid: 1000, V: 0.001, y0: 2, g: gravity, drag: 5 };
      default: return { g: gravity, h0: height, mass };
    }
  };

  const params = getParams();

  for (let t = 0; t <= duration + dt / 2; t += dt) {
    const state: PhysicsState = plugin.computeState(t, params);
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
      if (posB) { ball2X = posB[0]; ball2Y = Math.max(posB[1], 0.2); }
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

function getPhaseIdFromCache(phases: TimelinePhase[], t: number): string {
  for (const p of phases) {
    if (t >= p.timeRange[0] && t <= p.timeRange[1]) return p.id;
  }
  return phases.length > 0 ? phases[0].id : "unknown";
}

function findPhaseIndex(phases: TimelinePhase[], t: number): number {
  for (let i = 0; i < phases.length; i++) {
    if (t >= phases[i].timeRange[0] && t <= phases[i].timeRange[1]) return i;
  }
  return phases.length > 0 ? 0 : -1;
}

/** Binary search in frame cache for nearest frame at or before time t. */
function findFrame(frames: CachedFrame[], t: number): CachedFrame {
  if (frames.length === 0) {
    return { time: 0, ballX: 0, ballY: 0, ball2X: 0, ball2Y: 0, ballVelocity: 0, ballAcceleration: 0, isOnGround: false, phaseId: "unknown" };
  }
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (frames[mid].time <= t) lo = mid;
    else hi = mid - 1;
  }
  return frames[lo];
}

/** Generate trail points from frame cache (subset for rendering). */
function trailFromCache(frames: CachedFrame[], toTime: number, maxPoints: number = 200): Array<{ x: number; y: number; z: number }> {
  const trail: Array<{ x: number; y: number; z: number }> = [];
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

// ---- Store ----

export interface SimulationState {
  // Scene
  scene: PhysicsScene | null;
  sceneLoaded: boolean;

  // Active plugin
  activePluginId: string;
  pluginLoading: boolean;

  // Parameters (from scene)
  mass: number;
  height: number;
  gravity: number;

  // Time
  playing: boolean;
  timeScale: SpeedLevel;
  currentTime: number;
  totalDuration: number;

  // Computed state
  ballX: number;
  ballY: number;
  ball2X: number;
  ball2Y: number;
  ballVelocity: number;
  ballAcceleration: number;
  isBouncing: boolean;
  /** Phase loop: lock playback to current phase range */
  loopPhaseActive: boolean;
  loopPhaseId: string | null;
  /** S87 R1: current playback is the first teaching pass (phase-end pauses enabled) */
  teachingPass: boolean;
  /** S87 R1: first complete playback finished for the current scene session */
  firstPassDone: boolean;
  /** S87 R3: if set, playback stops at this phase's end (single phase replay) */
  singlePhaseReplayId: string | null;
  bounceCount: number;
  trail: Array<{ x: number; y: number; z: number }>;

  // Phases
  phases: TimelinePhase[];
  currentPhaseId: string;

  // Frame cache (private-like, but exposed for chart derivation)
  frameCache: CachedFrame[];

  // Actions
  setScene: (scene: PhysicsScene) => void;
  setActivePlugin: (pluginId: string) => void;
  setMass: (mass: number) => void;
  setHeight: (height: number) => void;
  setGravity: (gravity: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  replay: () => void;
  togglePlay: () => void;
  setSpeed: (scale: SpeedLevel) => void;
  jumpToTime: (t: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToPhase: (phaseId: string) => void;
  /** S87 R3: jump to phase start and replay just that phase once */
  replayPhase: (phaseId: string) => void;
  tick: (deltaTime: number) => void;
  undo: () => void;
  redo: () => void;
  /** Toggle looping within the current phase */
  togglePhaseLoop: (phaseId: string) => void;
  /** Stop phase loop */
  stopPhaseLoop: () => void;
  /** Rebuild frame cache (call when params change) */
  rebuildCache: () => void;
}

const GROUND_Y = 0.2;

function extractParams(scene: PhysicsScene) {
  const ball = scene.entities[0];
  const env = scene.environment[0];
  const h = ball.position[1];
  const m = (ball.properties as any).mass ?? 2;
  const g = env.type === "gravity_field" ? env.properties.acceleration : 9.8;
  const dur = scene.timeline?.total_duration ?? 5;
  const phases = scene.timeline?.phases ?? [];
  return { height: h, mass: m, gravity: g, duration: dur, phases };
}

/** Localize built-in scene descriptions for zh-CN without mutating the shared constant scene. */
function prepareScene(scene: PhysicsScene): PhysicsScene {
  if (useI18n.getState().locale !== "zh-CN") return scene;
  const localized: PhysicsScene = {
    ...scene,
    timeline: scene.timeline ? {
      ...scene.timeline,
      phases: (scene.timeline.phases ?? []).map((p) => ({ ...p })),
      events: (scene.timeline.events ?? []).map((e) => ({ ...e })),
    } : scene.timeline,
  };
  return localizeScene(localized);
}

// Module-level counter for trail throttling (not in React state)
let tickCounter = 0;

// S87: first-play teaching rhythm (phase-end / core-event freeze frames)
let phasePauseRemaining = 0;
const FIRST_PLAY_PHASE_PAUSE = 0.8;
const CORE_EVENT_PAUSE = 0.7;
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export const useSimulation = create<SimulationState>()((set, get) => ({
  scene: null,
  sceneLoaded: false,
  activePluginId: "free-fall",
  pluginLoading: false,

  mass: 2,
  height: 10,
  gravity: 9.8,

  playing: false,
  timeScale: 0.8,
  currentTime: 0,
  totalDuration: 3,

  ballX: 0, ballY: 10, ball2X: 3, ball2Y: 1,
  ballVelocity: 0, ballAcceleration: -9.8,
  isBouncing: false,
  loopPhaseActive: false,
  loopPhaseId: null, bounceCount: 0,
  teachingPass: false,
  firstPassDone: false,
  singlePhaseReplayId: null,
  trail: [],

  phases: [],
  currentPhaseId: "release",

  frameCache: [],

  // ===== Scene management =====
  setScene: (scene) => {
    const prepared = prepareScene(scene);
    // S74: attach generated teaching hints when absent (built-in scenes at runtime)
    ensureTeachingScript(prepared);
    const { height, mass, gravity, duration, phases } = extractParams(prepared);
    const pluginId = prepared.metadata.topic ?? "free-fall";
    const cache = buildFrameCache(duration, height, gravity, mass, pluginId, phases, prepared);
    const frame = cache[0];
    set({
      scene: prepared, sceneLoaded: true,
      activePluginId: pluginId,
      mass, height, gravity,
      totalDuration: duration, phases,
      currentTime: 0, playing: false,
      teachingPass: false, firstPassDone: false, singlePhaseReplayId: null,
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
      if (!plugin) { set({ pluginLoading: false }); return; }
      const scene = plugin.getDefaultScene();
      const prepared = prepareScene(scene);
      const { height, mass, gravity, duration, phases } = extractParams(prepared);
      const cache = buildFrameCache(duration, height, gravity, mass, pluginId, phases, prepared);
      const frame = cache[0];
      set({
        scene: prepared, sceneLoaded: true,
        activePluginId: pluginId,
        pluginLoading: false,
        mass, height, gravity,
        totalDuration: duration, phases,
        currentTime: 0, playing: false,
        teachingPass: false, firstPassDone: false, singlePhaseReplayId: null,
        ballX: frame.ballX, ballY: frame.ballY,
        ball2X: frame.ball2X, ball2Y: frame.ball2Y,
        ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
        currentPhaseId: frame.phaseId,
        trail: [],
        frameCache: cache,
        bounceCount: 0, isBouncing: false,
      });
    } catch {
      set({ pluginLoading: false });
    }
  },

  // ===== Parameter setters (rebuild cache on change) =====
  setMass: (mass) => {
    const { height, gravity, totalDuration, phases, activePluginId, currentTime, playing, scene } = get();
    const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases, scene);
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
    const { mass, gravity, totalDuration, phases, activePluginId, currentTime, scene } = get();
    const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases, scene);
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
    const { mass, height, totalDuration, phases, activePluginId, currentTime, scene } = get();
    const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases, scene);
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
    const { mass, height, gravity, totalDuration, phases, activePluginId, currentTime, scene } = get();
    const cache = buildFrameCache(totalDuration, height, gravity, mass, activePluginId, phases, scene);
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
    const { currentTime, totalDuration, firstPassDone } = get();
    if (currentTime >= totalDuration) get().replay();
    else {
      const freshStart = currentTime <= 0.001;
      set({
        playing: true,
        ...(freshStart ? { teachingPass: !firstPassDone, singlePhaseReplayId: null } : {}),
      });
    }
  },
  pause: () => set({ playing: false }),
  stop: () => {
    const { frameCache, gravity, mass, height, phases, activePluginId } = get();
    const frame0 = frameCache[0];
    phasePauseRemaining = 0;
    set({
      playing: false, currentTime: 0,
      ballX: frame0.ballX, ballY: frame0.ballY,
      ball2X: frame0.ball2X, ball2Y: frame0.ball2Y,
      ballVelocity: frame0.ballVelocity, ballAcceleration: frame0.ballAcceleration,
      currentPhaseId: frame0.phaseId,
      trail: [], bounceCount: 0, isBouncing: false,
      teachingPass: false, singlePhaseReplayId: null,
    });
  },
  replay: () => {
    const { frameCache } = get();
    const frame0 = frameCache[0];
    phasePauseRemaining = 0;
    set({
      playing: true, currentTime: 0,
      ballX: frame0.ballX, ballY: frame0.ballY,
      ball2X: frame0.ball2X, ball2Y: frame0.ball2Y,
      ballVelocity: frame0.ballVelocity, ballAcceleration: frame0.ballAcceleration,
      currentPhaseId: frame0.phaseId,
      trail: [], bounceCount: 0, isBouncing: false,
      teachingPass: false, firstPassDone: true, singlePhaseReplayId: null,
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
    phasePauseRemaining = 0;
    set({
      currentTime: clamped,
      ballX: frame.ballX, ballY: frame.ballY,
      ball2X: frame.ball2X, ball2Y: frame.ball2Y,
      ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
      currentPhaseId: frame.phaseId,
      playing: false,
      trail,
      isBouncing: frame.isOnGround,
      singlePhaseReplayId: null,
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
    if (!p) return;
    const t = p.timeRange[0];
    const frame = findFrame(frameCache, t);
    const trail = trailFromCache(frameCache, t);
    phasePauseRemaining = 0;
    set({
      currentTime: t,
      ballX: frame.ballX, ballY: frame.ballY,
      ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
      currentPhaseId: phaseId,
      playing: false,
      trail,
      singlePhaseReplayId: null,
    });
  },

  // S87 R3: jump to phase start and replay just that phase once
  replayPhase: (phaseId) => {
    const { phases, frameCache } = get();
    const p = phases.find((ph) => ph.id === phaseId);
    if (!p) return;
    const t = p.timeRange[0];
    const frame = findFrame(frameCache, t);
    const trail = trailFromCache(frameCache, t);
    phasePauseRemaining = 0;
    set({
      currentTime: t,
      ballX: frame.ballX, ballY: frame.ballY,
      ball2X: frame.ball2X, ball2Y: frame.ball2Y,
      ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
      currentPhaseId: phaseId,
      playing: true,
      teachingPass: false,
      singlePhaseReplayId: phaseId,
      loopPhaseActive: false,
      loopPhaseId: null,
      trail,
      isBouncing: frame.isOnGround,
    });
  },

  // ===== History =====
  undo: () => {
    const snap = useHistory.getState().undo();
    if (snap) {
      const g = snap.params.g ?? get().gravity;
      const h = snap.params.h0 ?? get().height;
      const m = snap.params.mass ?? get().mass;
      const pid: string = String(snap.params.pluginId ?? get().activePluginId);
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
      const pid: string = String(snap.params.pluginId ?? get().activePluginId);
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

  // ===== Phase Loop =====
  togglePhaseLoop: (phaseId: string) => {
    const { phases, loopPhaseActive, loopPhaseId } = get();
    if (loopPhaseActive && loopPhaseId === phaseId) {
      // Already looping this phase - stop
      set({ loopPhaseActive: false, loopPhaseId: null });
    } else {
      const p = phases.find((ph) => ph.id === phaseId);
      if (!p) return;
      set({ loopPhaseActive: true, loopPhaseId: phaseId });
      // Jump to phase start and play
      get().jumpToPhase(phaseId);
      setTimeout(() => get().play(), 100);
    }
  },

  stopPhaseLoop: () => {
    set({ loopPhaseActive: false, loopPhaseId: null });
  },

  // ===== Tick (playback update, throttled trail updates) =====
  tick: (rawDelta) => {
    const s = get();
    if (!s.playing) return;

    // S87 R1/R4: hold a freeze frame without advancing time
    if (phasePauseRemaining > 0) {
      phasePauseRemaining -= rawDelta;
      return;
    }

    const dt = Math.min(rawDelta * s.timeScale, 0.05);
    const newTime = s.currentTime + dt;

    // Phase loop check: if looping, wrap around within phase
    let effectiveNewTime = newTime;
    if (s.loopPhaseActive && s.loopPhaseId) {
      const loopPhase = s.phases.find((p) => p.id === s.loopPhaseId);
      if (loopPhase) {
        const phaseEnd = loopPhase.timeRange[1];
        if (newTime >= phaseEnd) {
          effectiveNewTime = loopPhase.timeRange[0] + (newTime - phaseEnd);
        }
      }
    }

    // S87 R3: single-phase replay stops at the phase end
    if (s.singlePhaseReplayId) {
      const replayPhase = s.phases.find((p) => p.id === s.singlePhaseReplayId);
      if (replayPhase && effectiveNewTime >= replayPhase.timeRange[1]) {
        const end = replayPhase.timeRange[1];
        const frame = findFrame(s.frameCache, end);
        const trail = trailFromCache(s.frameCache, end);
        set({
          currentTime: end,
          ballX: frame.ballX, ballY: frame.ballY,
          ball2X: frame.ball2X, ball2Y: frame.ball2Y,
          ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
          currentPhaseId: frame.phaseId,
          playing: false,
          singlePhaseReplayId: null,
          trail,
          isBouncing: frame.isOnGround,
        });
        return;
      }
    }

    // S87 R1/R4: teaching-pass holds (phase end + core events), skipped under reduced motion
    if (s.teachingPass && !prefersReducedMotion() && !s.loopPhaseActive && !s.singlePhaseReplayId) {
      const curIdx = findPhaseIndex(s.phases, s.currentTime);
      if (curIdx >= 0 && curIdx < s.phases.length - 1) {
        const phaseEnd = s.phases[curIdx].timeRange[1];
        if (s.currentTime < phaseEnd && effectiveNewTime >= phaseEnd) {
          const frame = findFrame(s.frameCache, phaseEnd);
          const trail = trailFromCache(s.frameCache, phaseEnd);
          phasePauseRemaining = FIRST_PLAY_PHASE_PAUSE;
          set({
            currentTime: phaseEnd,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            trail,
            isBouncing: frame.isOnGround,
          });
          return;
        }
      }
      const events = s.scene?.timeline?.events ?? [];
      for (const ev of events) {
        if ((ev.type === "collision" || ev.type === "state_change") && ev.time > s.currentTime && ev.time <= effectiveNewTime) {
          const frame = findFrame(s.frameCache, ev.time);
          const trail = trailFromCache(s.frameCache, ev.time);
          phasePauseRemaining = CORE_EVENT_PAUSE;
          set({
            currentTime: ev.time,
            ballX: frame.ballX, ballY: frame.ballY,
            ball2X: frame.ball2X, ball2Y: frame.ball2Y,
            ballVelocity: frame.ballVelocity, ballAcceleration: frame.ballAcceleration,
            currentPhaseId: frame.phaseId,
            trail,
            isBouncing: frame.isOnGround,
          });
          return;
        }
      }
    }

    if (effectiveNewTime >= s.totalDuration) {
      const lastFrame = s.frameCache[s.frameCache.length - 1];
      set({
        currentTime: s.totalDuration,
        playing: s.loopPhaseActive, // Keep playing if looping
        ballX: lastFrame.ballX, ballY: lastFrame.ballY,
        ball2X: lastFrame.ball2X, ball2Y: lastFrame.ball2Y,
        ballVelocity: lastFrame.ballVelocity, ballAcceleration: lastFrame.ballAcceleration,
        currentPhaseId: lastFrame.phaseId,
        isBouncing: lastFrame.isOnGround,
        trail: trailFromCache(s.frameCache, s.totalDuration),
        teachingPass: false,
        firstPassDone: true,
        singlePhaseReplayId: null,
      });
      return;
    }

    const frame = findFrame(s.frameCache, effectiveNewTime);
    const justBounced = frame.isOnGround && !s.isBouncing;

    tickCounter += 1;
    // Save resume state every 30 ticks (~0.5s)
    if (tickCounter % 30 === 0) {
      const resumeTime = s.totalDuration > 0 && effectiveNewTime / s.totalDuration >= 0.9 ? 0 : effectiveNewTime;
      useResume.getState().saveState(s.activePluginId, { mass: s.mass, height: s.height, gravity: s.gravity }, resumeTime);
    }
    const trail = tickCounter % 3 === 0
      ? trailFromCache(s.frameCache, effectiveNewTime)
      : s.trail;

    set({
      currentTime: effectiveNewTime,
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
