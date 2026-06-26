import type { PhysicsScene } from "@physics-lab/shared";
import type { ExperimentPhase } from "../../stores/ui.store";
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
    trail: Array<{
        x: number;
        y: number;
        z: number;
    }>;
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
export declare const useSimulation: import("zustand").UseBoundStore<import("zustand").StoreApi<SimulationState>>;
//# sourceMappingURL=experiment.store.d.ts.map