import { create } from "zustand";
import type { PhysicsScene, TimelinePhase } from "@physics-lab/shared";
import { useHistory } from "../../core/history.store";
import { pluginRegistry } from "../../core/plugin-registry";

export type SpeedLevel = 0.25 | 0.5 | 1 | 2 | 4;

export interface SimulationState {
  // Scene
  scene: PhysicsScene | null;
  sceneLoaded: boolean;

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
  ballY: number;
  ballVelocity: number;
  ballAcceleration: number;
  isBouncing: boolean;
  bounceCount: number;
  trail: Array<{ x: number; y: number; z: number }>;

  // Phases (from scene.timeline.phases)
  phases: TimelinePhase[];
  currentPhaseId: string;

  // Actions
  setScene: (scene: PhysicsScene) => void;
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
  tick: (deltaTime: number) => void;
  undo: () => void;
  redo: () => void;
}

// ---- Physics engine (pure functions) ----

const GROUND_Y = 0.2;
const MAX_TRAIL = 600;
const FRAME_STEP = 1 / 60;

function computePhysics(height: number, gravity: number, mass: number, t: number) {
  // Use the registered free-fall plugin for physics computation
  const plugin = pluginRegistry.get("free-fall");
  if (plugin?.computeState) {
    const state = plugin.computeState(t, { g: gravity, h0: height, mass });
    const pos = state.positions.ball;
    const vel = state.velocities.ball;
    const acc = state.accelerations.ball;
    return { y: Math.max(pos[1], GROUND_Y), vy: vel[1], ay: acc[1] };
  }
  // Fallback to built-in computation
  const y = height - 0.5 * gravity * t * t;
  const vy = -gravity * t;
  return { y: Math.max(y, GROUND_Y), vy, ay: -gravity };
}

function getPhaseId(phases: TimelinePhase[], t: number): string {
  for (const p of phases) {
    if (t >= p.timeRange[0] && t <= p.timeRange[1]) return p.id;
  }
  return phases.length > 0 ? phases[0].id : "unknown";
}

function generateTrail(height: number, gravity: number, mass: number, toTime: number) {
  const trail: Array<{ x: number; y: number; z: number }> = [];
  const dt = 1 / 60;
  let t = 0;
  while (t <= toTime && trail.length < MAX_TRAIL) {
    const { y } = computePhysics(height, gravity, mass, t);
    trail.push({ x: 0, y: Math.max(y, GROUND_Y), z: 0 });
    t += dt;
  }
  if (trail.length === 0) trail.push({ x: 0, y: height, z: 0 });
  return trail;
}

// ---- Store ----

function extractParams(scene: PhysicsScene) {
  const ball = scene.entities[0];
  const env = scene.environment[0];
  const h = ball.position[1];
  const m = (ball.properties as any).mass ?? 2;
  const g = env.type === "gravity_field" ? env.properties.acceleration : 9.8;
  const dur = scene.timeline?.total_duration ?? 5;
  const phases = scene.timeline?.phases ?? [];
  return { h, m, g, dur, phases };
}

export const useSimulation = create<SimulationState>((set, get) => ({
  scene: null,
  sceneLoaded: false,
  mass: 2.0,
  height: 10.0,
  gravity: 9.8,
  playing: true,
  timeScale: 1,
  currentTime: 0,
  totalDuration: 5.0,
  ballY: 10.0,
  ballVelocity: 0,
  ballAcceleration: -9.8,
  isBouncing: false,
  bounceCount: 0,
  trail: [{ x: 0, y: 10, z: 0 }],
  phases: [],
  currentPhaseId: "release",

  // ---- Scene ----
  setScene: (scene) => {
    const { h, m, g, dur, phases } = extractParams(scene);
    set({
      scene, sceneLoaded: true,
      mass: m, height: h, gravity: g,
      totalDuration: dur, phases,
      ballY: h, ballVelocity: 0, ballAcceleration: -g,
      currentTime: 0, currentPhaseId: getPhaseId(phases, 0),
      trail: [{ x: 0, y: h, z: 0 }],
    });
  },

  // ---- Parameters ----
  setMass: (mass) => set({ mass }),
  setHeight: (height) => {
    const { gravity, phases } = get();
    set({
      height,
      ballY: height, ballVelocity: 0, ballAcceleration: -gravity,
      currentTime: 0, currentPhaseId: getPhaseId(phases, 0),
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  setGravity: (gravity) => set({ gravity, ballAcceleration: -gravity }),

  // ---- Playback ----
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  stop: () => {
    const { height, gravity, phases } = get();
    set({
      playing: false, currentTime: 0,
      ballY: height, ballVelocity: 0, ballAcceleration: -gravity,
      currentPhaseId: getPhaseId(phases, 0),
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  replay: () => {
    const { height, gravity, phases } = get();
    set({
      playing: true, currentTime: 0,
      ballY: height, ballVelocity: 0, ballAcceleration: -gravity,
      currentPhaseId: getPhaseId(phases, 0),
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (timeScale) => set({ timeScale }),

  // ---- Navigation ----
  jumpToTime: (t) => {
    const { height, gravity, totalDuration, phases } = get();
    const clamped = Math.max(0, Math.min(t, totalDuration));
    const { y, vy, ay } = computePhysics(height, gravity, get().mass, clamped);
    const onGround = y <= GROUND_Y && vy < 0;
    set({
      currentTime: clamped,
      ballY: y, ballVelocity: vy, ballAcceleration: ay,
      currentPhaseId: getPhaseId(phases, clamped),
      playing: false,
      trail: generateTrail(height, gravity, get().mass, clamped),
      isBouncing: onGround,
    });
  },

  stepForward: () => {
    const { currentTime, height, gravity, totalDuration, phases } = get();
    const t = Math.min(currentTime + FRAME_STEP, totalDuration);
    const { y, vy, ay } = computePhysics(height, gravity, get().mass, t);
    set({
      currentTime: t,
      ballY: y, ballVelocity: vy, ballAcceleration: ay,
      currentPhaseId: getPhaseId(phases, t),
      playing: false,
      trail: generateTrail(height, gravity, get().mass, t),
    });
  },

  stepBackward: () => {
    const { currentTime, height, gravity, phases } = get();
    const t = Math.max(currentTime - FRAME_STEP, 0);
    const { y, vy, ay } = computePhysics(height, gravity, get().mass, t);
    set({
      currentTime: t,
      ballY: y, ballVelocity: vy, ballAcceleration: ay,
      currentPhaseId: getPhaseId(phases, t),
      playing: false,
      trail: generateTrail(height, gravity, get().mass, t),
    });
  },

  jumpToPhase: (phaseId) => {
    const { phases, height, gravity } = get();
    const p = phases.find((ph) => ph.id === phaseId);
    if (!p) return;
    const t = p.timeRange[0];
    const { y, vy, ay } = computePhysics(height, gravity, get().mass, t);
    set({
      currentTime: t,
      ballY: y, ballVelocity: vy, ballAcceleration: ay,
      currentPhaseId: phaseId,
      playing: false,
      trail: generateTrail(height, gravity, get().mass, t),
    });
  },

  // ---- History ----
  undo: () => {
    const snap = useHistory.getState().undo();
    if (snap) {
      const g = snap.params.g ?? get().gravity;
      const h = snap.params.h0 ?? get().height;
      set({
        mass: snap.params.mass ?? get().mass, height: h, gravity: g,
        currentTime: snap.time, ballY: snap.ballY, ballVelocity: snap.ballVelocity,
        playing: false, trail: generateTrail(h, g, snap.params.mass ?? get().mass, snap.time),
      });
    }
  },

  redo: () => {
    const snap = useHistory.getState().redo();
    if (snap) {
      const g = snap.params.g ?? get().gravity;
      const h = snap.params.h0 ?? get().height;
      set({
        mass: snap.params.mass ?? get().mass, height: h, gravity: g,
        currentTime: snap.time, ballY: snap.ballY, ballVelocity: snap.ballVelocity,
        playing: false, trail: generateTrail(h, g, snap.params.mass ?? get().mass, snap.time),
      });
    }
  },

  // ---- Tick ----
  tick: (rawDelta) => {
    const s = get();
    if (!s.playing) return;
    const dt = Math.min(rawDelta * s.timeScale, 0.05);
    const newTime = s.currentTime + dt;

    if (newTime >= s.totalDuration) {
      set({
        currentTime: s.totalDuration, playing: false,
        trail: generateTrail(s.height, s.gravity, s.mass, s.totalDuration),
        ballY: GROUND_Y, ballVelocity: 0, ballAcceleration: -s.gravity,
        currentPhaseId: getPhaseId(s.phases, s.totalDuration),
      });
      return;
    }

    const { y, vy, ay } = computePhysics(s.height, s.gravity, s.mass, newTime);
    const newTrail = [...s.trail, { x: 0, y, z: 0 }].slice(-MAX_TRAIL);
    
    // Bounce detection: ball just hit the ground
    const justBounced = y <= GROUND_Y && s.ballY > GROUND_Y && vy < 0;
    const newBounceCount = justBounced ? s.bounceCount + 1 : s.bounceCount;
    
    set({
      currentTime: newTime,
      ballY: y, ballVelocity: vy, ballAcceleration: ay,
      currentPhaseId: getPhaseId(s.phases, newTime),
      trail: newTrail,
      isBouncing: justBounced,
      bounceCount: newBounceCount,
    });
  },
}));
