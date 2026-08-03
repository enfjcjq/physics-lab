// ============================================================
// Rule-based recommendation engine ("expert system", not ML).
//
// Input: mastery entries + wrong-answer count + per-plugin progress.
// Output: prioritized recommendations with machine-readable types,
//         so the UI can explain WHY each recommendation was made.
//
// Pure function -> fully unit-testable, no store/React dependencies.
// ============================================================

export type RecommendationType =
  | "review_wrong"   // unreviewed wrong answers waiting
  | "strengthen"     // a knowledge point repeatedly failed
  | "continue"       // experiment started but not finished
  | "compare_pair"   // compare with a companion experiment (consolidate + extend)
  | "new_start"      // a fresh easy experiment to begin
  | "challenge"      // harder material after mastery
  | "all_done";      // everything mastered

export interface PluginProgress {
  id: string;
  difficulty: string; // "easy" | "medium" | "hard"
  percent: number;    // 0-100 of its knowledge points mastered
  kpIds: string[];
}

export interface EngineInput {
  entries: Record<string, { attempts: number; score: number; mastered: boolean }>;
  unreviewedWrong: number;
  plugins: PluginProgress[];
}

export interface Recommendation {
  type: RecommendationType;
  priority: number;      // lower = more urgent
  pluginId?: string;     // experiment to open
  pairWith?: string;     // (compare_pair) the already-studied companion
  weakKpId?: string;     // (strengthen) the failing knowledge point
}

/** Physics-meaningful comparison pairs (bidirectional). */
const COMPANION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["free-fall", "projectile-motion"],   // 1D motion <-> 2D motion
  ["spring-mass", "pendulum"],          // two kinds of simple harmonic motion
  ["wave", "doppler"],                  // wave basics <-> wave phenomenon
  ["refraction", "lens_optics"],        // law <-> its application
  ["electric_motor", "ac_generator"],   // electricity->motion <-> motion->electricity
  ["faraday_law", "ac_generator"],      // the law <-> its application
];

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

/** A plugin counts as "studied enough to compare from" at 60% mastery. */
const STUDIED_THRESHOLD = 60;
/** A KP counts as "weak" after 2+ attempts below this score. */
const WEAK_SCORE = 60;

function companionOf(pluginId: string): string | undefined {
  for (const [a, b] of COMPANION_PAIRS) {
    if (a === pluginId) return b;
    if (b === pluginId) return a;
  }
  return undefined;
}

export function generateRecommendations(input: EngineInput): Recommendation[] {
  const { entries, unreviewedWrong, plugins } = input;
  const recs: Recommendation[] = [];
  if (plugins.length === 0) return recs;

  const byId = new Map(plugins.map((p) => [p.id, p]));

  // R1: unreviewed wrong answers — retake the mistakes first
  if (unreviewedWrong > 0) {
    recs.push({ type: "review_wrong", priority: 10 });
  }

  // R2: weakest knowledge point (repeated attempts, low score) -> relearn that experiment
  let weakest: { pluginId: string; kpId: string; score: number } | null = null;
  for (const p of plugins) {
    for (const kpId of p.kpIds) {
      const e = entries[kpId];
      if (e && e.attempts >= 2 && e.score < WEAK_SCORE) {
        if (!weakest || e.score < weakest.score) weakest = { pluginId: p.id, kpId, score: e.score };
      }
    }
  }
  if (weakest) {
    recs.push({ type: "strengthen", priority: 20, pluginId: weakest.pluginId, weakKpId: weakest.kpId });
  }

  // R3: started but unfinished experiment — finish what you started (closest first)
  const started = plugins
    .filter((p) => p.percent > 0 && p.percent < 100)
    .sort((a, b) => b.percent - a.percent);
  if (started.length > 0) {
    recs.push({ type: "continue", priority: 30, pluginId: started[0].id });
  }

  // R4 (student-requested): comparative learning — studied A, now compare with companion B
  const studied = plugins.filter((p) => p.percent >= STUDIED_THRESHOLD);
  for (const s of studied) {
    const mate = companionOf(s.id);
    if (!mate) continue;
    const mateProgress = byId.get(mate);
    if (mateProgress && mateProgress.percent < STUDIED_THRESHOLD) {
      recs.push({ type: "compare_pair", priority: 40, pluginId: mate, pairWith: s.id });
      break; // one pair recommendation is enough
    }
  }

  // R5: a fresh start — easiest untouched experiment
  const untouched = plugins
    .filter((p) => p.percent === 0)
    .sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1));
  if (untouched.length > 0) {
    recs.push({ type: "new_start", priority: 50, pluginId: untouched[0].id });
  }

  // R6: everything started and no unfinished work -> challenge the hardest incomplete,
  //     or celebrate full mastery
  if (started.length === 0 && untouched.length === 0) {
    const notFull = plugins
      .filter((p) => p.percent < 100)
      .sort((a, b) => (DIFFICULTY_ORDER[b.difficulty] ?? 1) - (DIFFICULTY_ORDER[a.difficulty] ?? 1));
    if (notFull.length > 0) {
      recs.push({ type: "challenge", priority: 60, pluginId: notFull[0].id });
    } else {
      recs.push({ type: "all_done", priority: 90 });
    }
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
