// ============================================================
// Teaching Layer — pure data derivation (deterministic).
// state = f(scene, time): no playback history, no side effects.
// Drives PhaseCard + FormulaStrip components.
// ============================================================

import type { PhysicsScene, TimelinePhase, Equation } from "@physics-lab/shared";
import { evaluateExpression } from "./formula-evaluator";

export interface PhaseCardData {
  id: string;
  labelKey: string;
  hint?: string;
  index: number;
  total: number;
}

export type FormulaStage = "formula" | "substituted" | "result";

export interface FormulaStripData {
  equationId: string;
  phaseId: string;
  expression: string;
  substituted: string;
  result: number | null;
  stage: FormulaStage;
  progress: number;
}

export function getActivePhase(scene: PhysicsScene, time: number): TimelinePhase | null {
  const phases = scene.timeline?.phases ?? [];
  for (const p of phases) {
    if (time >= p.timeRange[0] && time < p.timeRange[1]) return p;
  }
  return null;
}

export function getPhaseCardData(scene: PhysicsScene, time: number): PhaseCardData | null {
  const phase = getActivePhase(scene, time);
  if (!phase) return null;
  const phases = scene.timeline?.phases ?? [];
  const phaseCardGroup = scene.overlay_hints?.phase_cards;
  if (phaseCardGroup !== undefined && phaseCardGroup.length === 0) return null; // AI toggled off
  const hints = phaseCardGroup?.find((h) => h.phase_id === phase.id);
  return {
    id: phase.id,
    labelKey: hints?.title ?? phase.label,
    hint: hints?.hint ?? phase.description,
    index: phases.findIndex((p) => p.id === phase.id) + 1,
    total: phases.length,
  };
}

export function phaseProgress(scene: PhysicsScene, phase: TimelinePhase, time: number): number {
  const [start, end] = phase.timeRange;
  const span = end - start;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(1, (time - start) / span));
}

/**
 * Resolve the equation that belongs to the active phase:
 * 1. overlay_hints.formula_strips entry for the phase (explicit mapping);
 * 2. default rule: equations[phaseIndex] (auto-hide when absent).
 */
export function getFormulaStripData(scene: PhysicsScene, time: number): FormulaStripData | null {
  const phase = getActivePhase(scene, time);
  if (!phase) return null;
  const phases = scene.timeline?.phases ?? [];
  const phaseIndex = phases.findIndex((p) => p.id === phase.id);
  if (phaseIndex < 0) return null;

  const stripGroup = scene.overlay_hints?.formula_strips;
  if (stripGroup !== undefined && stripGroup.length === 0) return null; // AI toggled off
  const mapping = stripGroup?.find((m) => m.phase_id === phase.id);
  let equation: Equation | undefined;
  if (mapping) {
    equation = scene.equations.find((e) => e.id === mapping.equation_id);
  } else {
    equation = scene.equations[phaseIndex];
  }
  if (!equation) return null; // auto-hide (no empty shell)

  const progress = phaseProgress(scene, phase, time);
  const stage: FormulaStage = progress < 0.5 ? "formula" : progress < 0.8 ? "substituted" : "result";
  const sim = (scene as unknown as { simulation?: { params?: Record<string, number> } }).simulation?.params;
  const substituted = substituteExpression(equation.expression, equation, sim, time);
  const result = stage === "result" ? evaluateExpression(substituted) : null;

  return {
    equationId: equation.id,
    phaseId: phase.id,
    expression: equation.expression,
    substituted,
    result,
    stage,
    progress,
  };
}

export function substituteExpression(
  expression: string,
  equation: Equation,
  params: Record<string, number> | undefined,
  time: number
): string {
  let out = expression;
  const vars = Object.keys(equation.variables ?? {});
  for (const v of vars) {
    if (v === "t") {
      out = out.replace(/(?<![a-zA-Z(])t\b/g, formatNumber(time));
      continue;
    }
    const value = params?.[v];
    if (typeof value === "number" && Number.isFinite(value)) {
      out = out.replace(new RegExp(`\\b${escapeRegExp(v)}\\b`, "g"), formatNumber(value));
    }
  }
  // Any remaining standalone t -> current time (safety)
  out = out.replace(/(?<![a-zA-Z(])t\b/g, formatNumber(time));
  return out;
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "?";
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


// ---- S72: ForceCallout / EventPulse ----

export interface ForceCalloutData {
  forceId: string;
  label: string;
  formula: string;
  entityId: string;
  type: string;
  color: string;
  direction: [number, number, number] | string;
}

/**
 * Which forces to annotate at time t (state = f(t)).
 * overlay_hints.force_callouts restrict the set; otherwise all forces.
 * Sorted by numeric magnitude desc; capped at `max` (rest -> hidden count).
 */
export function getForceCalloutData(scene: PhysicsScene, time: number, max = 3): { callouts: ForceCalloutData[]; hidden: number } {
  const hints = scene.overlay_hints?.force_callouts;
  const allowed = hints !== undefined ? new Set(hints.map((h) => h.force_id)) : null;
  let forces = scene.forces.filter((f) => !allowed || allowed.has(f.id));
  forces = [...forces].sort((a, b) => {
    const na = typeof a.magnitude === "number" ? a.magnitude : -1;
    const nb = typeof b.magnitude === "number" ? b.magnitude : -1;
    return nb - na;
  });
  const visible = forces.slice(0, max);
  const callouts = visible.map((f) => {
    const hint = hints?.find((h) => h.force_id === f.id);
    const label = (f.visual as { label?: string } | undefined)?.label ?? f.description ?? f.type;
    const formula = hint?.formula_override ?? (typeof f.magnitude === "number" ? String(f.magnitude) : f.magnitude);
    return {
      forceId: f.id,
      label,
      formula,
      entityId: f.target_entity,
      type: f.type,
      color: "#EF4444",
      direction: f.direction,
    };
  });
  return { callouts, hidden: Math.max(0, forces.length - max) };
}

export interface EventPulseText {
  eventId: string;
  time: number;
  text: string;
}

/** Explanation text: visible for a window after the event time (deterministic f(t)). */
export function getEventPulseText(scene: PhysicsScene, time: number, windowSec = 2): EventPulseText | null {
  const events = scene.timeline?.events ?? [];
  const pulses = scene.overlay_hints?.event_pulses;
  const pulseIds = pulses !== undefined ? new Set(pulses.map((p) => p.event_id)) : null;
  for (const e of events) {
    if (e.type !== "collision" && e.type !== "state_change") continue;
    if (pulseIds && !pulseIds.has(e.id)) continue; // AI toggled this event off
    if (time >= e.time && time <= e.time + windowSec) {
      const hint = scene.overlay_hints?.event_pulses?.find((h) => h.event_id === e.id);
      return { eventId: e.id, time: e.time, text: hint?.text_override ?? e.description ?? "" };
    }
  }
  return null;
}

export interface PulsableEvent {
  eventId: string;
  time: number;
  type: string;
}

/**
 * Events eligible for a pulse ring (playback-only effect).
 * Default rule: collision events always; plus the first other event per
 * phase; at most `maxPerPhase` per phase. overlay_hints.event_pulses
 * overrides the candidate set when present.
 */
export function getPulsableEvents(scene: PhysicsScene, maxPerPhase = 2): PulsableEvent[] {
  const phases = scene.timeline?.phases ?? [];
  const all = (scene.timeline?.events ?? []).filter((e) => e.type === "collision" || e.type === "state_change");
  const hintIds = scene.overlay_hints?.event_pulses?.map((h) => h.event_id);
  if (hintIds !== undefined) {
    return all.filter((e) => hintIds.includes(e.id)).map((e) => ({ eventId: e.id, time: e.time, type: e.type }));
  }
  const result: PulsableEvent[] = [];
  for (const phase of phases) {
    const [start, end] = phase.timeRange;
    const inPhase = all.filter((e) => e.time >= start && e.time <= end);
    const collisions = inPhase.filter((e) => e.type === "collision");
    const firstOther = inPhase.filter((e) => e.type !== "collision").slice(0, 1);
    for (const e of [...collisions, ...firstOther].slice(0, maxPerPhase)) {
      result.push({ eventId: e.id, time: e.time, type: e.type });
    }
  }
  return result;
}



