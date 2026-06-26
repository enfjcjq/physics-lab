import type { PhysicsScene } from "../types/physics-scene";
export type PhysicsCategory = "mechanics" | "electromagnetism" | "optics" | "thermodynamics" | "waves" | "modern";
export interface PluginControl {
    id: string;
    label: string;
    type: "slider" | "toggle" | "select" | "number";
    defaultValue: number | boolean;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: {
        label: string;
        value: string;
    }[];
    group?: string;
}
export interface PhysicsState {
    time: number;
    positions: Record<string, [number, number, number]>;
    velocities: Record<string, [number, number, number]>;
    accelerations: Record<string, [number, number, number]>;
    energies?: {
        kinetic: number;
        potential: number;
        total: number;
    };
}
export interface CameraPreset {
    id: string;
    label: string;
    position: [number, number, number];
    target: [number, number, number];
    fov?: number;
}
export interface PhaseInfo {
    id: string;
    label: string;
    icon: string;
    timeRange: [number, number];
    cameraPresetId?: string;
}
export interface ForceItem {
    name: string;
    symbol: string;
    direction: string;
    magnitude: string;
    description: string;
}
export interface MotionStep {
    title: string;
    content: string;
    formula?: string;
}
export interface DerivationStep {
    step: number;
    title: string;
    formula: string;
    explanation: string;
}
export interface KnowledgePoint {
    id: string;
    name: string;
    category: string;
    mastered: boolean;
}
export interface PhysicsPlugin {
    /** Unique plugin ID: "free-fall", "projectile", etc. */
    id: string;
    /** Display name i18n key */
    name: string;
    version: string;
    category: PhysicsCategory;
    difficulty: "easy" | "medium" | "hard";
    /** Generate a PhysicsScene from problem text (AI-powered) */
    parseProblem?: (text: string) => Promise<PhysicsScene>;
    /** Get default scene for quick demo */
    getDefaultScene: () => PhysicsScene;
    /** Pure function: compute physics state at time t */
    computeState: (t: number, params: Record<string, number>) => PhysicsState;
    /** UI controls this plugin exposes */
    getControls: () => PluginControl[];
    /** Knowledge points for teaching overlay */
    getKnowledgePoints: () => KnowledgePoint[];
    /** Force analysis for teaching */
    getForceAnalysis: () => ForceItem[];
    /** Motion analysis steps */
    getMotionAnalysis: () => MotionStep[];
    /** Formula derivation */
    getDerivation: () => DerivationStep[];
    /** Timeline phases */
    getPhases: () => PhaseInfo[];
    /** Camera presets */
    getCameraPresets: () => CameraPreset[];
}
//# sourceMappingURL=types.d.ts.map