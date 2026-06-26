import { create } from "zustand";
export const useHistory = create((set, get) => ({
    past: [],
    future: [],
    bookmarks: [],
    pushSnapshot: (snapshot) => set((s) => ({
        past: [...s.past.slice(-49), snapshot],
        future: [],
    })),
    undo: () => {
        const { past, future } = get();
        if (past.length === 0)
            return null;
        const current = past[past.length - 1];
        set({
            past: past.slice(0, -1),
            future: [current, ...future],
        });
        return past.length > 1 ? past[past.length - 2] : null;
    },
    redo: () => {
        const { past, future } = get();
        if (future.length === 0)
            return null;
        const next = future[0];
        set({
            past: [...past, next],
            future: future.slice(1),
        });
        return next;
    },
    canUndo: () => get().past.length > 1,
    canRedo: () => get().future.length > 0,
    addBookmark: (snapshot) => set((s) => ({
        bookmarks: [...s.bookmarks, { ...snapshot, id: "bm-" + Date.now(), label: "State " + (s.bookmarks.length + 1) }],
    })),
    removeBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    getBookmarks: () => get().bookmarks,
}));
//# sourceMappingURL=history.store.js.map