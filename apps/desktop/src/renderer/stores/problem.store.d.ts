import type { InputMethod } from "./ui.store";
interface HistoryItem {
    id: string;
    title: string;
    inputMethod: InputMethod;
    timestamp: number;
    sceneId?: string;
}
interface ProblemState {
    inputMethod: InputMethod;
    inputText: string;
    isSubmitting: boolean;
    parseError: string | null;
    history: HistoryItem[];
    setInputMethod: (m: InputMethod) => void;
    setInputText: (t: string) => void;
    submit: () => Promise<import("@physics-lab/shared").PhysicsScene | null>;
    addToHistory: (item: HistoryItem) => void;
    clearHistory: () => void;
}
export declare const useProblemStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ProblemState>>;
export {};
//# sourceMappingURL=problem.store.d.ts.map