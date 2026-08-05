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

/**
 * Extract the intended overlay_hints JSON from the model response.
 * Strategy:
 *   1. strip a markdown fence if present;
 *   2. scan all balanced {...} blocks (brace-depth aware, so nested
 *      JSON objects are captured whole);
 *   3. parse each block, preferring the one that carries overlay_hints
 *      keys (small models often echo the prompt JSON back).
 */
export function extractAiHintsJson(text: string): OverlayHints | null {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fence ? fence[1] : text;
  const blocks = extractBalancedBlocks(candidate);
  if (blocks.length === 0) return null;
  const keyHits = (s: string) =>
    (s.includes("phase_cards") ? 1 : 0) +
    (s.includes("event_pulses") ? 1 : 0) +
    (s.includes("force_callouts") ? 1 : 0) +
    (s.includes("formula_strips") ? 1 : 0);
  blocks.sort((a, b) => keyHits(b) - keyHits(a));
  for (const b of blocks) {
    const attempts = [b, repairJson(b)];
    for (const candidate of attempts) {
      try {
        const parsed = JSON.parse(candidate) as OverlayHints;
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        // try the next candidate / block
      }
    }
  }
  return null;
}

/**
 * Lightweight repair for common small-model JSON typos:
 *   - "key:value"  -> "key":value   (missing closing quote before colon)
 *   - trailing commas before ] or }
 * Best-effort; callers still fall back when it cannot parse.
 */
export function repairJson(text: string): string {
  return text
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*:)/g, '"$1"')
    .replace(/,\s*([}\]])/g, "$1");
}

/** Extract every balanced {...} block (supports nested braces). */
export function extractBalancedBlocks(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "{") continue;
    let depth = 0;
    let inStr = false;
    for (let j = i; j < text.length; j++) {
      const ch = text[j];
      if (ch === '"' && text[j - 1] !== "\\") inStr = !inStr;
      if (inStr) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          out.push(text.slice(i, j + 1));
          i = j;
          break;
        }
      }
    }
  }
  return out;
}

export function buildPrompt(scene: PhysicsScene, ruleHints: OverlayHints): string {
  const editable = {
    phase_cards: ruleHints.phase_cards ?? [],
    event_pulses: ruleHints.event_pulses ?? [],
    force_callouts: ruleHints.force_callouts ?? [],
  };
  const reference = {
    title: scene.metadata.title,
    description: scene.metadata.description,
    equations: scene.equations.map((e) => ({ id: e.id, expression: e.expression })),
    forces: scene.forces.map((f) => ({ id: f.id, type: f.type, description: f.description })),
    timeline: { phases: scene.timeline?.phases, events: scene.timeline?.events },
  };
  // Few-shot example built from REAL ids only (a model copying the example
  // must not invent ids that the validator would drop).
  const samplePhaseId = ruleHints.phase_cards?.[0]?.phase_id ?? "phase";
  const sampleEventId = ruleHints.event_pulses?.[0]?.event_id ?? "";
  const hasEvents = (ruleHints.event_pulses?.length ?? 0) > 0;
  const sampleForceId = (ruleHints.force_callouts?.[0]?.force_id) ?? scene.forces?.[0]?.id ?? "gravity";
  const eventsExample = hasEvents
    ? `[{"event_id":"${sampleEventId}","text_override":"小球落地，注意观察"}]`
    : "[]";
  const example = `{"phase_cards":[{"phase_id":"${samplePhaseId}","hint":"观察小球下落时速度的变化"}],"event_pulses":${eventsExample},"force_callouts":[{"force_id":"${sampleForceId}"}]}`;
  return [
    '你是一名面向中学生的物理教学文案编辑。请把【待编辑对象】中的教学提示润色成更口语、更引导式的学生友好版本，并决定模板开关。',
    '',
    '规则：',
    '- 只输出一个 JSON 对象，形状与【待编辑对象】完全相同；所有 id 必须原样使用【待编辑对象】中真实存在的 id，禁止发明或改写 id；若某类模板为空数组则保持空数组',
    '- phase_cards[].hint 不超过 30 字；event_pulses[].text_override 不超过 20 字',
    '- 多用“观察…/注意…”句式；在最后一个 phase 之前不要剧透答案数值',
    '- force_callouts 若该题不需要受力标注则输出空数组 []',
    '',
    '【参考信息】（仅作背景理解，不要回显）：',
    '' + JSON.stringify(reference),
    '',
    '【待编辑对象】：',
    '' + JSON.stringify(editable),
    '',
    '【输出示例】（id 全部来自【待编辑对象】）：',
    '' + example,
    '',
    '请只输出【待编辑对象】的润色版本 JSON，不要输出任何其他文字。',
  ].join("\n");
}

export async function polishTeachingScriptWithAI(scene: PhysicsScene, provider?: OllamaProvider): Promise<PhysicsScene> {
  const ruleHints = scene.overlay_hints ?? generateTeachingScript(scene);
  const ollama = provider ?? new OllamaProvider();
  try {
    let raw = await ollama.generate(buildPrompt(scene, ruleHints));
    let aiHints = raw ? extractAiHintsJson(raw) : null;
    if (!aiHints) {
      // Small models are stochastic: retry once before falling back to the rule version.
      raw = await ollama.generate(buildPrompt(scene, ruleHints));
      aiHints = raw ? extractAiHintsJson(raw) : null;
    }
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
