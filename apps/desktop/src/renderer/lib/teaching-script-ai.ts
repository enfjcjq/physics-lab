// ============================================================
// S75: AI 接入 TeachingScript
//
// AI's job (per product/UX decision):
//   1. polish student-facing copy (hint / event text);
//   2. decide which templates to enable (empty array = disable).
// Hard boundaries:
//   - output MUST pass validateTeachingScript, otherwise the whole
//     AI result falls back to the rule version;
//   - Ollama offline / timeout / garbage -> seamless fallback;
//   - formula_strips mapping is a teaching red line: never editable by AI.
// ============================================================

import type { PhysicsScene, OverlayHints } from "@physics-lab/shared";
import { generateTeachingScript, validateTeachingScript } from "@physics-lab/shared";
import { OllamaProvider } from "@physics-lab/ai-parser";

/**
 * Merge AI-edited groups over the rule version.
 * formula_strips always come from the rule generator (teaching red line).
 * Absent AI group -> keep rule group.
 */
export function mergeAiHints(ruleHints: OverlayHints, aiHints: OverlayHints | null | undefined): OverlayHints {
  if (!aiHints) return ruleHints;
  return {
    phase_cards: Array.isArray(aiHints.phase_cards) ? aiHints.phase_cards : ruleHints.phase_cards,
    formula_strips: ruleHints.formula_strips,
    force_callouts: Array.isArray(aiHints.force_callouts) ? aiHints.force_callouts : ruleHints.force_callouts,
    event_pulses: Array.isArray(aiHints.event_pulses) ? aiHints.event_pulses : ruleHints.event_pulses,
  };
}

/** Try to extract a JSON object from the model response. */
export function extractAiHintsJson(text: string): OverlayHints | null {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const obj = candidate.match(/\{[\s\S]*\}/);
  if (!obj) return null;
  try {
    const parsed = JSON.parse(obj[0]) as OverlayHints;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function buildPrompt(scene: PhysicsScene, ruleHints: OverlayHints): string {
  const editable = {
    phase_cards: ruleHints.phase_cards ?? [],
    event_pulses: ruleHints.event_pulses ?? [],
    force_callouts: ruleHints.force_callouts ?? [],
  };
  return `你是一名面向中学生的物理教学文案编辑。请润色下面 PhysicsScene 的教学脚本（overlay_hints）中的学生可见文案，并决定模板开关。

只能修改以下三组（保持 id 完全不变）：
1. phase_cards[].hint —— 一句话阶段提示（≤30 字，口语化、引导式，多用"观察…/注意…"）
2. event_pulses[].text_override —— 关键事件解释（≤20 字）
3. force_callouts —— 该题需要标注的受力；若纯运动学题不需要受力标注，返回空数组 []
禁止：修改 phase_id / event_id / force_id / equation 映射；禁止剧透最终答案数值（最后一个 phase 之前）。

输入 PhysicsScene 关键信息：
${JSON.stringify({
  title: scene.metadata.title,
  description: scene.metadata.description,
  equations: scene.equations.map((e) => ({ id: e.id, expression: e.expression })),
  forces: scene.forces.map((f) => ({ id: f.id, type: f.type, description: f.description })),
  timeline: { phases: scene.timeline?.phases, events: scene.timeline?.events },
  overlay_hints: editable,
})}

只输出一个 JSON 对象（不要解释、不要 markdown 代码块之外的文字），形状与上面 overlay_hints 相同。`;
}

/**
 * Polish a scene's teaching script with the local LLM.
 * Returns the scene unchanged (rule version intact) on any failure.
 */
export async function polishTeachingScriptWithAI(scene: PhysicsScene, provider?: OllamaProvider): Promise<PhysicsScene> {
  const ruleHints = scene.overlay_hints ?? generateTeachingScript(scene);
  const ollama = provider ?? new OllamaProvider();
  try {
    const raw = await ollama.generate(buildPrompt(scene, ruleHints));
    if (!raw) return scene;
    const aiHints = extractAiHintsJson(raw);
    if (!aiHints) return scene;

    const merged = mergeAiHints(ruleHints, aiHints);
    const validated = validateTeachingScript(scene, merged);

    // If validation dropped anything the AI provided, fall back to the rule version
    // (the student always sees correct, complete content).
    const aiProvided = (group: "phase_cards" | "event_pulses" | "force_callouts") =>
      Array.isArray(aiHints[group]);
    const dropped = (group: "phase_cards" | "event_pulses" | "force_callouts") =>
      aiProvided(group) && (validated[group]?.length ?? 0) < (aiHints[group]?.length ?? 0);
    if (dropped("phase_cards") || dropped("event_pulses") || dropped("force_callouts")) {
      return scene;
    }

    scene.overlay_hints = validated;
    return scene;
  } catch {
    return scene; // offline / timeout / parse error -> seamless fallback
  }
}
