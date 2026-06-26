interface ForceItem {
    name: string;
    symbol: string;
    direction: string;
    magnitude: string;
    description: string;
}
interface MotionStep {
    title: string;
    content: string;
    formula?: string;
}
interface DerivationStep {
    step: number;
    title: string;
    formula: string;
    explanation: string;
}
interface KnowledgePoint {
    id: string;
    name: string;
    category: string;
    mastered: boolean;
}
interface AnalysisState {
    forces: ForceItem[];
    motionSteps: MotionStep[];
    derivation: DerivationStep[];
    knowledgePoints: KnowledgePoint[];
    commonMistakes: string[];
    learningTips: string[];
    finalAnswer: string;
}
export declare const useAnalysisStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AnalysisState>>;
export {};
//# sourceMappingURL=analysis.store.d.ts.map