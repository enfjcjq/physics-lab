import { create } from "zustand";
import { pluginRegistry } from "./plugin-registry";

export interface GhostTrajectory {
  color: string;
  label: string;
  points: Array<{ x: number; y: number; z: number }>;
}

interface CompareState {
  enabled: boolean;
  varyParam: "mass" | "height" | "gravity";
  ghostTrails: GhostTrajectory[];
  toggle: () => void;
  setVaryParam: (p: "mass" | "height" | "gravity") => void;
  computeGhosts: (pluginId: string, baseParams: Record<string, number>) => void;
  clear: () => void;
}

const GHOST_COLORS = ["#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#22c55e"];
const VARIATIONS = [0.5, 2, 3, 4, 0.25];

function getParamLabel(param: string, value: number, baseValue: number): string {
  const pct = Math.round((value / baseValue) * 100);
  return param + ": " + value + " (" + pct + "%)";
}

export const useCompare = create<CompareState>((set, get) => ({
  enabled: false,
  varyParam: "height",
  ghostTrails: [],

  toggle: () => set((s) => {
    if (s.enabled) return { enabled: false, ghostTrails: [] };
    return { enabled: true };
  }),

  setVaryParam: (varyParam) => set({ varyParam, ghostTrails: [] }),

  computeGhosts: (pluginId, baseParams) => {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin) return;

    const { varyParam } = get();
    const baseValue = baseParams[varyParam] ?? 1;
    const trails: GhostTrajectory[] = [];

    for (let i = 0; i < VARIATIONS.length; i++) {
      const mult = VARIATIONS[i];
      const params = { ...baseParams, [varyParam]: baseValue * mult };
      const points: Array<{ x: number; y: number; z: number }> = [];

      // Simulate at 60fps up to total duration
      const totalDuration = plugin.getDefaultScene().timeline.total_duration;
      const fps = 60;
      const totalFrames = Math.ceil(totalDuration * fps);

      for (let f = 0; f <= totalFrames; f++) {
        const t = (f / fps);
        const state = plugin.computeState(t, params);
        const pos = state.positions["ball_1"];
        if (pos) {
          points.push({ x: pos[0], y: pos[1], z: pos[2] || 0 });
        }
      }

      trails.push({
        color: GHOST_COLORS[i],
        label: getParamLabel(varyParam, baseValue * mult, baseValue),
        points,
      });
    }

    set({ ghostTrails: trails });
  },

  clear: () => set({ ghostTrails: [] }),
}));