import type { PhysicsScene, TimelinePhase } from "@physics-lab/shared";
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
    ballY: number;
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
export declare const useSimulation: import("zustand").UseBoundStore<import("zustand").StoreApi<SimulationState>>;
//# sourceMappingURL=experiment.store.d.ts.map