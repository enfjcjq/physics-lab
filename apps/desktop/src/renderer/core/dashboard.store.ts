import { create } from "zustand";

interface DashboardState {
  open: boolean;
  toggle: () => void;
  openDashboard: () => void;
  closeDashboard: () => void;
}

export const useDashboard = create<DashboardState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  openDashboard: () => set({ open: true }),
  closeDashboard: () => set({ open: false }),
}));
