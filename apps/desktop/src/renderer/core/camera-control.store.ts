import { create } from "zustand";

export type CameraMode = "teaching" | "free";

interface CameraControlState {
  mode: CameraMode;
  backNonce: number;
  resetNonce: number;
  goFree: () => void;
  backToTeaching: () => void;
  resetView: () => void;
}

export const useCameraControl = create<CameraControlState>((set) => ({
  mode: "teaching",
  backNonce: 0,
  resetNonce: 0,
  goFree: () => set({ mode: "free" }),
  backToTeaching: () => set((s) => ({ mode: "teaching", backNonce: s.backNonce + 1 })),
  resetView: () => set((s) => ({ mode: "teaching", resetNonce: s.resetNonce + 1 })),
}));
