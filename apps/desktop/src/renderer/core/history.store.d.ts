export interface ExperimentSnapshot {
    id: string;
    label: string;
    timestamp: number;
    time: number;
    params: Record<string, number>;
    ballY: number;
    ballVelocity: number;
}
interface HistoryState {
    past: ExperimentSnapshot[];
    future: ExperimentSnapshot[];
    bookmarks: ExperimentSnapshot[];
    pushSnapshot: (snapshot: ExperimentSnapshot) => void;
    undo: () => ExperimentSnapshot | null;
    redo: () => ExperimentSnapshot | null;
    canUndo: () => boolean;
    canRedo: () => boolean;
    addBookmark: (snapshot: ExperimentSnapshot) => void;
    removeBookmark: (id: string) => void;
    getBookmarks: () => ExperimentSnapshot[];
}
export declare const useHistory: import("zustand").UseBoundStore<import("zustand").StoreApi<HistoryState>>;
export {};
//# sourceMappingURL=history.store.d.ts.map