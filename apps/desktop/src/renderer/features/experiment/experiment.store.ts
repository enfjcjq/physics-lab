import { create } from "zustand";
import type { PhysicsScene } from "@physics-lab/shared";
import type { ExperimentPhase } from "../../stores/ui.store";
import { PHASES } from "../../stores/ui.store";
import { useHistory } from "../../core/history.store";

export type SpeedLevel = 0.25 | 0.5 | 1 | 2 | 4;

export interface SimulationState {
  scene: PhysicsScene | null;
  sceneLoaded: boolean;
  mass: number;
  height: number;
  gravity: number;
  playing: boolean;
  timeScale: SpeedLevel;
  currentTime: number;
  totalDuration: number;
  currentPhase: ExperimentPhase;
  ballY: number;
  ballVelocity: number;
  trail: Array<{ x: number; y: number; z: number }>;

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
  jumpToPhase: (phase: ExperimentPhase) => void;
  tick: (deltaTime: number) => void;
  undo: () => void;
  redo: () => void;
  saveBookmark: () => void;
}

function getPhaseFromTime(t: number): ExperimentPhase {
  for (const p of PHASES) {
    if (t >= p.timeRange[0] && t <= p.timeRange[1]) return p.id;
  }
  return t < 0 ? "release" : "bounce";
}

function computePhysics(height: number, gravity: number, t: number) {
  const y = height - 0.5 * gravity * t * t;
  const vy = -gravity * t;
  return { y: Math.max(y, 0.2), vy };
}

const GROUND_Y = 0.2;
const RESTITUTION = 0.6;
const MAX_TRAIL = 500;
const FRAME_STEP = 1 / 60;

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
      mass: (ball.properties as { mass: number }).mass,
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
    set({
      height,
      ballY: height,
      ballVelocity: 0,
      currentTime: 0,
      currentPhase: "release",
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  setGravity: (gravity) => set({ gravity }),

  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  stop: () => {
    const { height } = get();
    set({
      playing: false,
      currentTime: 0,
      ballY: height,
      ballVelocity: 0,
      currentPhase: "release",
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  replay: () => {
    const { height } = get();
    set({
      playing: true,
      currentTime: 0,
      ballY: height,
      ballVelocity: 0,
      currentPhase: "release",
      trail: [{ x: 0, y: height, z: 0 }],
    });
  },
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (timeScale) => set({ timeScale }),

  jumpToTime: (t) => {
    const { height, gravity, totalDuration } = get();
    const clamped = Math.max(0, Math.min(t, totalDuration));
    const { y, vy } = computePhysics(height, gravity, clamped);
    const phase = getPhaseFromTime(clamped);
    set({
      currentTime: clamped,
      ballY: y,
      ballVelocity: vy,
      currentPhase: phase,
      playing: false,
    });
  },

  stepForward: () => {
    const { currentTime, height, gravity, totalDuration } = get();
    const t = Math.min(currentTime + FRAME_STEP, totalDuration);
    const { y, vy } = computePhysics(height, gravity, t);
    set({
      currentTime: t,
      ballY: y,
      ballVelocity: vy,
      currentPhase: getPhaseFromTime(t),
      playing: false,
    });
  },

  stepBackward: () => {
    const { currentTime, height, gravity } = get();
    const t = Math.max(currentTime - FRAME_STEP, 0);
    const { y, vy } = computePhysics(height, gravity, t);
    set({
      currentTime: t,
      ballY: y,
      ballVelocity: vy,
      currentPhase: getPhaseFromTime(t),
      playing: false,
    });
  },

  jumpToPhase: (phase) => {
    const phaseInfo = PHASES.find((p) => p.id === phase);
    if (!phaseInfo) return;
    const t = phaseInfo.timeRange[0];
    const { height, gravity } = get();
    const { y, vy } = computePhysics(height, gravity, t);
    set({
      currentTime: t,
      ballY: y,
      ballVelocity: vy,
      currentPhase: phase,
      playing: false,
      trail: [{ x: 0, y, z: 0 }],
    });
  },

  undo: () => {
    const snap = useHistory.getState().undo();
    if (snap) {
      set({
        mass: snap.params.mass ?? get().mass,
        height: snap.params.h0 ?? get().height,
        gravity: snap.params.g ?? get().gravity,
        currentTime: snap.time,
        ballY: snap.ballY,
        ballVelocity: snap.ballVelocity,
        playing: false,
      });
    }
  },

  redo: () => {
    const snap = useHistory.getState().redo();
    if (snap) {
      set({
        mass: snap.params.mass ?? get().mass,
        height: snap.params.h0 ?? get().height,
        gravity: snap.params.g ?? get().gravity,
        currentTime: snap.time,
        ballY: snap.ballY,
        ballVelocity: snap.ballVelocity,
        playing: false,
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
    if (!s.playing) return;

    const dt = Math.min(rawDelta * s.timeScale, 0.05);
    const newTime = s.currentTime + dt;

    if (newTime >= s.totalDuration) {
      set({ currentTime: s.totalDuration, playing: false });
      return;
    }

    const { y, vy } = computePhysics(s.height, s.gravity, newTime);
    let ballY = y;
    let ballVelocity = vy;
    let nextTime = newTime;

    if (y <= GROUND_Y && vy < 0) {
      ballY = GROUND_Y;
      ballVelocity = -vy * RESTITUTION;
      nextTime = 0;
      set({
        currentTime: nextTime,
        height: GROUND_Y,
        ballY,
        ballVelocity,
        currentPhase: "impact",
        trail: [...s.trail.slice(-MAX_TRAIL + 1), { x: 0, y: ballY, z: 0 }],
      });
      return;
    }

    const phase = getPhaseFromTime(newTime);
    const newTrail = s.trail.length >= MAX_TRAIL
      ? [...s.trail.slice(-MAX_TRAIL + 1), { x: 0, y: ballY, z: 0 }]
      : [...s.trail, { x: 0, y: ballY, z: 0 }];

    set({ currentTime: nextTime, ballY, ballVelocity, currentPhase: phase, trail: newTrail });
  },
}));
