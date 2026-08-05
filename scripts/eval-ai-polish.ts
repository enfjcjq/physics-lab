// ============================================================
// S76: Ollama 在线实测 —— AI 教学脚本润色效果对比（规则版 vs AI 版）
//
// 运行（需本机 Ollama 已启动并已 pull 模型，如 llama3.2）：
//   npx vite-node -c vitest.config.ts scripts/eval-ai-polish.ts
//
// Ollama 未运行时自动提示并跳过（不报错）。
// ============================================================

import { ruleParser } from "@physics-lab/ai-parser";
import { OllamaProvider } from "@physics-lab/ai-parser";
import { polishTeachingScriptWithAI } from "../apps/desktop/src/renderer/lib/teaching-script-ai";

const CASES = [
  {
    id: "mechanics_free_fall",
    label: "力学-自由落体",
    text: "一个小球从20米高处自由下落，g=10m/s²，求落地速度。",
  },
  {
    id: "electromagnetism_ohms",
    label: "电学-欧姆定律",
    text: "一个电阻的阻值为6欧姆，两端电压为12V，求通过电阻的电流。",
  },
  {
    id: "mechanics_projectile",
    label: "力学-平抛",
    text: "小球以20m/s的初速度水平抛出，g=10m/s²，求落地时间。",
  },
];

async function main() {
  const ollama = new OllamaProvider();
  const available = await ollama.isAvailable();
  if (!available) {
    console.log(JSON.stringify({ status: "skipped", reason: "Ollama 未运行（本机实测需先启动：ollama serve 并 pull 模型）" }, null, 2));
    return;
  }

  const report: unknown[] = [];
  for (const c of CASES) {
    const parsed = await ruleParser.parseProblem(c.text);
    if (!parsed.scene) {
      report.push({ id: c.id, label: c.label, error: "解析失败" });
      continue;
    }
    const ruleHints = JSON.parse(JSON.stringify(parsed.scene.overlay_hints ?? null));
    const before = JSON.stringify(parsed.scene.overlay_hints ?? null);
    await polishTeachingScriptWithAI(parsed.scene, ollama);
    const after = JSON.stringify(parsed.scene.overlay_hints ?? null);
    report.push({
      id: c.id,
      label: c.label,
      topic: parsed.scene.metadata.topic,
      ruleVersion: ruleHints,
      aiVersion: parsed.scene.overlay_hints,
      aiApplied: before !== after,
    });
  }
  console.log(JSON.stringify({ status: "done", ollama: true, cases: report }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
