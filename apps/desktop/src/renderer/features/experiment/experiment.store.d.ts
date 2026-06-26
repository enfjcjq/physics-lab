import type { PhysicsScene, TimelinePhase } from "@physics-lab/shared";
export type SpeedLevel = 0.25 | 0.5 | 1 | 2 | 4;
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
export interface SimulationState {
    scene: PhysicsScene | null;
    sceneLoaded: boolean;
    activePluginId: string;
    pluginLoading: boolean;
    mass: number;
    height: number;
    gravity: number;
    playing: boolean;
    timeScale: SpeedLevel;
    currentTime: number;
    totalDuration: number;
    ballX: number;
    ballY: number;
    ball2X: number;
    ball2Y: number;
    ballVelocity: number;
    ballAcceleration: number;
    isBouncing: boolean;
    bounceCount: number;
    trail: Array<{
        x: number;
        y: number;
        z: number;
    }>;
    phases: TimelinePhase[];
    currentPhaseId: string;
    frameCache: CachedFrame[];
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
    tick: (deltaTime: number) => void;
    undo: () => void;
    redo: () => void;
    /** Rebuild frame cache (call when params change) */
    rebuildCache: () => void;
}
export declare const useSimulation: import("zustand").UseBoundStore<import("zustand").StoreApi<SimulationState>>;
//# sourceMappingURL=experiment.store.d.ts.map