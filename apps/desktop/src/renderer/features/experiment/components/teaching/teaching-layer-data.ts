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
  const hints = scene.overlay_hints?.phase_cards?.find((h) => h.phase_id === phase.id);
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

  const mapping = scene.overlay_hints?.formula_strips?.find((m) => m.phase_id === phase.id);
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

