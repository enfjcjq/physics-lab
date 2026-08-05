// ============================================================
// TeachingScript Generator (S74)
// Pure functions: PhysicsScene -> OverlayHints (rule-based).
// Deterministic, testable; reused by the rule parser, the
// renderer runtime hook, and future AI pipelines.
//
// Fallback order (rendering): explicit overlay_hints >
//   generator output > renderer default derivation.
// Append-only: never modifies existing PhysicsScene fields.
// ============================================================

import type { PhysicsScene, OverlayHints } from "../types/physics-scene";

// ---- text length helpers (character-counted, CJK aware) ----

function charLen(s: string): number {
  return Array.from(s).length;
}

// ---- R1: phase cards ----

function buildPhaseCards(scene: PhysicsScene): NonNullable<OverlayHints["phase_cards"]> {
  const phases = scene.timeline?.phases ?? [];
  const cards: NonNullable<OverlayHints["phase_cards"]> = [];
  for (const p of phases) {
    const entry: { phase_id: string; hint?: string } = { phase_id: p.id };
    if (p.description && charLen(p.description) <= 30) {
      entry.hint = p.description;
    }
    cards.push(entry);
  }
  return cards;
}

// ---- R2: formula strips ----
// Default phase[i] <-> equations[i]; improvements:
//   - is_solution equations go to the LAST phase (answer last);
//   - type:"energy" equations prefer an energy-related phase.

function isEnergyPhase(p: { label: string; description?: string }): boolean {
  return /energy|能量|机械能|守恒/.test((p.label + " " + (p.description ?? "")).toLowerCase());
}

function buildFormulaStrips(scene: PhysicsScene): NonNullable<OverlayHints["formula_strips"]> {
  const phases = scene.timeline?.phases ?? [];
  const equations = scene.equations ?? [];
  if (phases.length === 0 || equations.length === 0) return [];

  const solutionEqs = equations.filter((e) => e.is_solution);
  const energyEqs = equations.filter((e) => !e.is_solution && e.type === "energy");
  const others = equations.filter((e) => !e.is_solution && e.type !== "energy");

  const byPhase = new Map<string, string>(); // phase_id -> equation_id
  const assign = (phaseId: string | undefined, eqId: string) => {
    if (!phaseId) return;
    if (!byPhase.has(phaseId)) byPhase.set(phaseId, eqId);
  };

  // default index mapping for non-solution, non-energy equations
  others.forEach((eq, i) => {
    if (i < phases.length) assign(phases[i].id, eq.id);
  });

  // energy equations -> energy keyword phase (or first free phase, else last)
  for (const eq of energyEqs) {
    const energyIdx = phases.findIndex((p) => isEnergyPhase(p));
    if (energyIdx >= 0) {
      assign(phases[energyIdx].id, eq.id);
      continue;
    }
    const freeIdx = phases.findIndex((p) => !byPhase.has(p.id));
    assign(freeIdx >= 0 ? phases[freeIdx].id : phases[phases.length - 1].id, eq.id);
  }

  // solution equations -> last phase (answer last; overrides index mapping)
  for (const eq of solutionEqs) {
    byPhase.set(phases[phases.length - 1].id, eq.id);
  }

  return Array.from(byPhase.entries()).map(([phase_id, equation_id]) => ({ phase_id, equation_id }));
}

// ---- R3: force callouts ----
// List every force; the renderer sorts by magnitude, shows top 3 and folds the rest into "+N".

function buildForceCallouts(scene: PhysicsScene): NonNullable<OverlayHints["force_callouts"]> {
  return (scene.forces ?? []).map((f) => ({ force_id: f.id }));
}

// ---- R4: event pulses ----
// collision events always; plus the first other event per phase; at most 2 per phase.

function buildEventPulses(scene: PhysicsScene): NonNullable<OverlayHints["event_pulses"]> {
  const phases = scene.timeline?.phases ?? [];
  const all = (scene.timeline?.events ?? []).filter((e) => e.type === "collision" || e.type === "state_change");
  const result: NonNullable<OverlayHints["event_pulses"]> = [];
  const maxPerPhase = 2;
  for (const phase of phases) {
    const [start, end] = phase.timeRange;
    const inPhase = all.filter((e) => e.time >= start && e.time < end);
    const collisions = inPhase.filter((e) => e.type === "collision");
    const firstOther = inPhase.filter((e) => e.type !== "collision").slice(0, 1);
    for (const e of [...collisions, ...firstOther].slice(0, maxPerPhase)) {
      result.push({ event_id: e.id });
    }
  }
  return result;
}

// ---- generator ----

/** Deterministically generate teaching hints from a PhysicsScene. */
export function generateTeachingScript(scene: PhysicsScene): OverlayHints {
  const hints: OverlayHints = {
    phase_cards: buildPhaseCards(scene),
    formula_strips: buildFormulaStrips(scene),
    force_callouts: buildForceCallouts(scene),
    event_pulses: buildEventPulses(scene),
  };
  return validateTeachingScript(scene, hints);
}

// ---- validator ----
// Never throws. Drops invalid entries one by one; if a whole group is
// invalid it becomes empty and the renderer falls back to default derivation.

function asArray<T>(x: T[] | undefined | null): T[] { return Array.isArray(x) ? (x as T[]) : []; }

export function validateTeachingScript(scene: PhysicsScene, hints: OverlayHints | undefined | null): OverlayHints {
  if (!hints) return {};
  const phases = scene.timeline?.phases ?? [];
  const phaseIds = new Set(phases.map((p) => p.id));
  const equationIds = new Set((scene.equations ?? []).map((e) => e.id));
  const forceIds = new Set((scene.forces ?? []).map((f) => f.id));
  const events = scene.timeline?.events ?? [];
  const eventIds = new Set(events.map((e) => e.id));

  const phaseOf = (eventId: string): string | null => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return null;
    const phase = phases.find((p) => ev.time >= p.timeRange[0] && ev.time <= p.timeRange[1]);
    return phase?.id ?? null;
  };

  // phase_cards: valid phase_id; hint <= 30 chars (else hint dropped, entry kept)
  const phase_cards = asArray(hints.phase_cards)
    .filter((c) => phaseIds.has(c.phase_id))
    .map((c) => (c.hint && charLen(c.hint) > 30 ? { phase_id: c.phase_id } : c));

  // formula_strips: valid ids; at most one per phase (first wins)
  const formula_strips: NonNullable<OverlayHints["formula_strips"]> = [];
  {
    const seen = new Set<string>();
    for (const s of asArray(hints.formula_strips)) {
      if (!phaseIds.has(s.phase_id) || !equationIds.has(s.equation_id)) continue;
      if (seen.has(s.phase_id)) continue;
      seen.add(s.phase_id);
      formula_strips.push(s);
    }
  }

  // force_callouts: valid ids; dedup
  const force_callouts: NonNullable<OverlayHints["force_callouts"]> = [];
  {
    const seen = new Set<string>();
    for (const f of asArray(hints.force_callouts)) {
      if (!forceIds.has(f.force_id)) continue;
      if (seen.has(f.force_id)) continue;
      seen.add(f.force_id);
      force_callouts.push(f);
    }
  }

  // event_pulses: valid ids; <= 2 per phase
  const event_pulses: NonNullable<OverlayHints["event_pulses"]> = [];
  {
    const counts = new Map<string, number>();
    for (const e of asArray(hints.event_pulses)) {
      if (!eventIds.has(e.event_id)) continue;
      const pid = phaseOf(e.event_id);
      const n = counts.get(pid ?? "__none") ?? 0;
      if (pid && n >= 2) continue;
      if (!pid && n >= 2) continue;
      counts.set(pid ?? "__none", n + 1);
      event_pulses.push(e);
    }
  }

  return { phase_cards, formula_strips, force_callouts, event_pulses };
}

/** Attach generated+validated hints when the scene has none (runtime hook). */
export function ensureTeachingScript(scene: PhysicsScene): PhysicsScene {
  const hasHints = Boolean(
    scene.overlay_hints &&
      ((scene.overlay_hints.phase_cards?.length ?? 0) > 0 ||
        (scene.overlay_hints.formula_strips?.length ?? 0) > 0 ||
        (scene.overlay_hints.force_callouts?.length ?? 0) > 0 ||
        (scene.overlay_hints.event_pulses?.length ?? 0) > 0)
  );
  if (!hasHints) {
    scene.overlay_hints = generateTeachingScript(scene);
  } else {
    scene.overlay_hints = validateTeachingScript(scene, scene.overlay_hints);
  }
  return scene;
}


