import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  message: string;
  icon: string;
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

let nextId = 0;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: (t) => {
    const id = "toast-" + (nextId++);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));