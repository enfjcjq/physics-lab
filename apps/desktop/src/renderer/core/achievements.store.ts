import { create } from "zustand";
import { useMastery } from "./mastery.store";
import { pluginRegistry } from "./plugin-registry";
import { loadJSON, saveJSON, removeKey } from "../lib/storage";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

const ACHIEVEMENTS_KEY = "physics-lab:achievements";

interface AchievementState {
  badges: Achievement[];
  check: () => void;
  getUnlocked: () => Achievement[];
  getAll: () => Achievement[];
  reset: () => void;
}

const BADGE_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_correct", title: "First Step", description: "Answer your first quiz correctly", icon: "\u{1F389}" },
  { id: "perfect_experiment", title: "Perfectionist", description: "Achieve 100% mastery on any experiment", icon: "\u{1F3C6}" },
  { id: "ten_correct", title: "Scholar", description: "Answer 10 questions correctly", icon: "\u{1F393}" },
  { id: "three_experiments", title: "Explorer", description: "Try 3 different experiments", icon: "\u{1F30D}" },
  { id: "all_experiments", title: "Physicist", description: "Try all available experiments", icon: "\u{269B}" },
  { id: "streak_3", title: "Consistent", description: "Learn for 3 consecutive days", icon: "\u{1F525}" },
  { id: "speed_demon", title: "Quick Thinker", description: "Answer a question correctly on first try", icon: "\u{26A1}" },
];

function load(): Record<string, { unlocked: boolean; unlockedAt: string | null }> {
  return loadJSON(ACHIEVEMENTS_KEY, {});
}

function save(d: Record<string, unknown>): void {
  saveJSON(ACHIEVEMENTS_KEY, d);
}

function checkAchievements(): Achievement[] {
  const stored = load();
  const now = new Date().toISOString();
  const mastery = useMastery.getState();
  const entries = mastery.getAll();
  const plugins = pluginRegistry.list();

  return BADGE_DEFS.map((def) => {
    const prev = stored[def.id];
    let unlocked = prev?.unlocked ?? false;
    let unlockedAt = prev?.unlockedAt ?? null;

    if (!unlocked) {
      switch (def.id) {
        case "first_correct": {
          const hasCorrect = Object.values(entries).some((e) => e.correct > 0);
          if (hasCorrect) { unlocked = true; unlockedAt = now; }
          break;
        }
        case "perfect_experiment": {
          for (const p of plugins) {
            const kps = p.getKnowledgePoints();
            const kpIds = kps.map((k) => p.id + ":" + k.id);
            if (kpIds.length > 0 && kpIds.every((id) => entries[id]?.mastered)) {
              unlocked = true; unlockedAt = now; break;
            }
          }
          break;
        }
        case "ten_correct": {
          const total = Object.values(entries).reduce((sum, e) => sum + e.correct, 0);
          if (total >= 10) { unlocked = true; unlockedAt = now; }
          break;
        }
        case "three_experiments": {
          const tried = plugins.filter((p) => {
            const kps = p.getKnowledgePoints();
            return kps.some((k) => {
              const e = entries[p.id + ":" + k.id] ?? entries[k.id];
              return e && e.attempts > 0;
            });
          });
          if (tried.length >= 3) { unlocked = true; unlockedAt = now; }
          break;
        }
        case "all_experiments": {
          const allTried = plugins.every((p) => {
            const kps = p.getKnowledgePoints();
            return kps.some((k) => {
              const e = entries[p.id + ":" + k.id] ?? entries[k.id];
              return e && e.attempts > 0;
            });
          });
          if (allTried && plugins.length > 0) { unlocked = true; unlockedAt = now; }
          break;
        }
        case "streak_3": {
          const dates = Object.values(entries)
            .filter((e) => e.lastAttempted)
            .map((e) => new Date(e.lastAttempted!).toDateString());
          const unique = [...new Set(dates)].sort().reverse();
          let streak = 0;
          const today = new Date().toDateString();
          if (unique[0] === today || unique[0] === new Date(Date.now() - 86400000).toDateString()) {
            streak = 1;
            for (let i = 1; i < unique.length; i++) {
              const d1 = new Date(unique[i - 1]);
              const d2 = new Date(unique[i]);
              if ((d1.getTime() - d2.getTime()) / 86400000 <= 1.5) streak++;
              else break;
            }
          }
          if (streak >= 3) { unlocked = true; unlockedAt = now; }
          break;
        }
        case "speed_demon": {
          const hasFirstTry = Object.values(entries).some((e) => e.attempts === 1 && e.correct === 1);
          if (hasFirstTry) { unlocked = true; unlockedAt = now; }
          break;
        }
      }
    }

    if (unlocked && !prev?.unlocked) {
      stored[def.id] = { unlocked: true, unlockedAt };
    }

    return { ...def, unlocked, unlockedAt };
  });
}

export const useAchievements = create<AchievementState>((set, get) => ({
  badges: BADGE_DEFS.map((d) => ({ ...d, unlocked: false, unlockedAt: null })),

  check: () => {
    const badges = checkAchievements();
    save(Object.fromEntries(badges.map((b) => [b.id, { unlocked: b.unlocked, unlockedAt: b.unlockedAt }])));
    set({ badges });
  },

  getUnlocked: () => get().badges.filter((b) => b.unlocked),

  getAll: () => get().badges,

  reset: () => {
    removeKey(ACHIEVEMENTS_KEY);
    set({ badges: BADGE_DEFS.map((d) => ({ ...d, unlocked: false, unlockedAt: null })) });
  },
}));