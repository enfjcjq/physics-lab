import type { PhysicsScene } from "@physics-lab/shared";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import zhCN from "../locales/zh-CN.json";
import enUS from "../locales/en-US.json";
import { evaluateExpression } from "../features/experiment/components/teaching/formula-evaluator";
import { beautifyFormula } from "../features/experiment/components/teaching/formula-beautify";

export interface ReportData {
  scene: PhysicsScene;
  params: Record<string, number>;
  currentTime: number;
  ballY: number;
  ballVelocity: number;
}

// ==================== i18n (export-time, zh fallback, never leak raw keys) ====================

const DICTS: Record<string, Record<string, string>> = { "zh-CN": zhCN as unknown as Record<string, string>, "en-US": enUS as unknown as Record<string, string> };

function translate(key: string, locale: string): string {
  const zh = zhCN as unknown as Record<string, string>;
  const dict = DICTS[locale] ?? zh;
  const v = dict[key];
  if (v !== undefined && v !== key) return v;
  const zv = zh[key];
  return zv !== undefined && zv !== key ? zv : key;
}

// ==================== simulation-driven params & state ====================

interface SimLike { params?: Record<string, number>; equations?: Record<string, string> }

function simOf(scene: PhysicsScene): SimLike | null {
  const sim = (scene as unknown as { simulation?: SimLike }).simulation;
  return sim && (sim.params || sim.equations) ? sim : null;
}

function substitute(expr: string, params: Record<string, number>, time: number): string {
  let out = expr;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
  }
  out = out.replace(/\bt\b/g, String(time));
  return out;
}

const PARAM_LABELS: Record<string, { zh: string; en: string; unit?: string }> = {
  N: { zh: "匝数 N", en: "Turns N" }, I: { zh: "电流 I", en: "Current I", unit: "A" },
  A: { zh: "面积 A", en: "Area A", unit: "m²" }, B: { zh: "磁感应强度 B", en: "Magnetic field B", unit: "T" },
  omega0: { zh: "初角速度 ω₀", en: "Initial angular speed ω₀", unit: "rad/s" }, r: { zh: "半径 r", en: "Radius r", unit: "m" },
  friction: { zh: "摩擦", en: "Friction" }, h0: { zh: "初始高度 h₀", en: "Initial height h₀", unit: "m" },
  g: { zh: "重力加速度 g", en: "Gravity g", unit: "m/s²" }, m: { zh: "质量 m", en: "Mass m", unit: "kg" },
  v0: { zh: "初速度 v₀", en: "Initial velocity v₀", unit: "m/s" }, angle: { zh: "角度 θ", en: "Angle θ", unit: "°" },
  L: { zh: "长度 L", en: "Length L", unit: "m" }, k: { zh: "劲度系数 k", en: "Spring constant k", unit: "N/m" },
  R: { zh: "电阻 R", en: "Resistance R", unit: "Ω" }, V: { zh: "电压 V", en: "Voltage V", unit: "V" },
  T: { zh: "温度 T", en: "Temperature T", unit: "K" }, P: { zh: "压强 P", en: "Pressure P", unit: "Pa" },
  f: { zh: "频率 f", en: "Frequency f", unit: "Hz" }, v_sound: { zh: "声速", en: "Sound speed", unit: "m/s" },
};

const STATE_LABELS: Record<string, { zh: string; en: string; unit?: string }> = {
  y: { zh: "位置 y", en: "Position y", unit: "m" },
  v: { zh: "速度 v", en: "Velocity v", unit: "m/s" },
  speed: { zh: "速率", en: "Speed", unit: "m/s" },
  ke: { zh: "动能", en: "Kinetic energy", unit: "J" },
  pe: { zh: "势能", en: "Potential energy", unit: "J" },
  total_e: { zh: "机械能", en: "Mechanical energy", unit: "J" },
  torque: { zh: "力矩 τ", en: "Torque τ", unit: "N·m" },
  angular_speed: { zh: "角速度 ω", en: "Angular speed ω", unit: "rad/s" },
  angle: { zh: "转角 θ", en: "Angle θ", unit: "rad" },
  current: { zh: "电流 I", en: "Current I", unit: "A" },
  voltage: { zh: "电压 U", en: "Voltage U", unit: "V" },
  emf: { zh: "感应电动势", en: "EMF", unit: "V" },
  flux: { zh: "磁通量 Φ", en: "Magnetic flux Φ", unit: "Wb" },
};

const TOPIC_STATE_KEYS: Record<string, string[]> = {
  electric_motor: ["angle", "angular_speed", "torque", "current", "speed", "ke"],
  ohms_law: ["current", "voltage"],
  faraday_law: ["emf", "flux"],
  ac_generator: ["emf", "flux", "angle", "current"],
  free_fall: ["y", "v", "ke", "pe", "total_e"],
  projectile_motion: ["y", "v", "ke", "pe", "total_e"],
};

function stateValue(scene: PhysicsScene, data: ReportData, key: string, sim: SimLike | null): number | null {
  if (key === "y" && data.ballY !== undefined) return data.ballY;
  if (key === "v" && data.ballVelocity !== undefined) return data.ballVelocity;
  if (!sim) return null;
  // angle for the motor: phi = omega0*t + 0.5*N*I*A*B*t^2/1.5 (from x=r cos(phi), z=r sin(phi))
  if (key === "angle" && scene.metadata.topic === "electric_motor" && sim.params) {
    const expr = "omega0 * t + 0.5 * N * I * A * B * t * t / 1.5";
    return evaluateExpression(substitute(expr, sim.params, data.currentTime));
  }
  if (sim.equations && sim.equations[key]) {
    return evaluateExpression(substitute(sim.equations[key], sim.params ?? {}, data.currentTime));
  }
  if (sim.params && key in sim.params) return sim.params[key];
  return null;
}

function buildStateRows(scene: PhysicsScene, data: ReportData, locale: string): string[] {
  const isZh = locale === "zh-CN";
  const sim = simOf(scene);
  const keys = TOPIC_STATE_KEYS[scene.metadata.topic ?? ""] ?? ["speed", "ke", "pe", "total_e"];
  const rows: string[] = [];
  for (const key of keys) {
    const value = stateValue(scene, data, key, sim);
    const label = STATE_LABELS[key];
    if (value !== null && Number.isFinite(value)) {
      rows.push(`- **${label ? (isZh ? label.zh : label.en) : key}**: ${value.toFixed(2)}${label?.unit ? " " + label.unit : ""}`);
    }
  }
  return rows;
}

function buildParamRows(scene: PhysicsScene, locale: string): string[] {
  const isZh = locale === "zh-CN";
  const sim = simOf(scene);
  const params = sim?.params;
  if (!params || Object.keys(params).length === 0) return [];
  const rows: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    const ctrl = (scene.ui_controls ?? []).find((c) => c.parameter === key);
    const label = ctrl ? translate(ctrl.label, locale) : (PARAM_LABELS[key] ? (isZh ? PARAM_LABELS[key].zh : PARAM_LABELS[key].en) : key);
    const unit = ctrl?.unit ?? PARAM_LABELS[key]?.unit ?? "";
    rows.push(`| ${label} | ${value} | ${unit} |`);
  }
  return rows;
}

// ==================== Markdown → HTML ====================

function inlineMd(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  const codeBuf: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const codeMatch = line.match(/^```/);
    if (codeMatch) {
      if (!inCode) { inCode = true; codeBuf.length = 0; }
      else { out.push("<pre><code>" + codeBuf.join("\n") + "</code></pre>"); inCode = false; }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // table block (consecutive lines starting with |)
    if (line.startsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) { tbl.push(lines[i]); i++; }
      const header = tbl[0].split("|").filter((x) => x.trim() !== "");
      const body = tbl.slice(2).filter((r) => /[^|]/.test(r.replace(/\|/g, "")));
      let html = "<table><thead><tr>" + header.map((h) => `<th>${inlineMd(h.trim())}</th>`).join("") + "</tr></thead><tbody>";
      for (const row of body) {
        const cells = row.split("|").filter((x, idx, arr) => !(idx === 0 && x.trim() === "") && !(idx === arr.length - 1 && x.trim() === ""));
        html += "<tr>" + cells.map((c) => `<td>${inlineMd(c.trim())}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table>";
      out.push(html);
      continue;
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineMd(h[2])}</h${level}>`);
      i++; continue;
    }
    if (/^---+$/.test(line.trim())) { out.push("<hr />"); i++; continue; }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(inlineMd(lines[i].replace(/^[-*]\s+/, ""))); i++; }
      out.push("<ul>" + items.map((it) => `<li>${it}</li>`).join("") + "</ul>");
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    // paragraph (merge consecutive non-empty, non-special lines)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^```/.test(lines[i]) && !lines[i].startsWith("|") && !/^(#{1,3})\s/.test(lines[i]) && !/^---+$/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i])) {
      para.push(inlineMd(lines[i])); i++;
    }
    out.push("<p>" + para.join("<br/>") + "</p>");
  }
  if (inCode) out.push("<pre><code>" + codeBuf.join("\n") + "</code></pre>");
  return out.join("\n");
}

// ==================== Report generation ====================

export function generateMarkdownReport(data: ReportData, locale: string): string {
  const { scene, currentTime } = data;
  const meta = scene.metadata;
  const isZh = locale === "zh-CN";
  const t = (k: string) => translate(k, locale);

  const lines: string[] = [];
  lines.push(`# ${isZh ? "Physics Lab 实验报告" : "Physics Lab Experiment Report"}`);
  lines.push("");
  lines.push(`**${meta.title}** | ${isZh ? "生成时间" : "Generated"}: ${new Date().toISOString()}`);
  lines.push("");

  lines.push(`## ${isZh ? "实验概述" : "Overview"}`);
  lines.push("");
  lines.push(`- **${isZh ? "题目" : "Topic"}**: ${meta.title}`);
  if (meta.description) lines.push(`- **${isZh ? "描述" : "Description"}**: ${meta.description}`);
  lines.push(`- **${isZh ? "学科" : "Subject"}**: ${meta.subject}`);
  lines.push(`- **${isZh ? "难度" : "Difficulty"}**: ${meta.difficulty ?? "-"}`);
  lines.push(`- **${isZh ? "年级" : "Grade"}**: ${meta.grade ?? "-"}`);
  lines.push("");

  // Parameters — driven by the scene's simulation.params (no cross-experiment leakage)
  const paramRows = buildParamRows(scene, locale);
  if (paramRows.length > 0) {
    lines.push(`## ${isZh ? "实验参数" : "Parameters"}`);
    lines.push("");
    lines.push("| " + (isZh ? "参数" : "Parameter") + " | " + (isZh ? "数值" : "Value") + " | " + (isZh ? "单位" : "Unit") + " |");
    lines.push("|------|------|------|");
    lines.push(...paramRows);
    lines.push("");
  }

  // Current state — per experiment type; hidden when nothing is available (no empty shell)
  const stateRows = buildStateRows(scene, data, locale);
  if (stateRows.length > 0) {
    lines.push(`## ${isZh ? "当前状态" : "Current State"} (t = ${currentTime.toFixed(2)} s)`);
    lines.push("");
    lines.push(...stateRows);
    lines.push("");
  }

  // Equations
  if (scene.equations.length > 0) {
    lines.push(`## ${isZh ? "公式" : "Formulas"}`);
    lines.push("");
    for (const eq of scene.equations) {
      lines.push(`### ${eq.name}`);
      lines.push("");
      lines.push(`\`${beautifyFormula(eq.expression)}\``);
      if (eq.is_solution) lines.push(` *(${isZh ? "答案" : "solution"})*`);
      lines.push("");
    }
  }

  // Knowledge points — skip tags with no content
  const kps = scene.knowledge_tags.filter((kp) => kp.learning_tips || (kp.common_mistakes && kp.common_mistakes.length > 0));
  if (kps.length > 0) {
    lines.push(`## ${isZh ? "知识点" : "Knowledge Points"}`);
    lines.push("");
    for (const kp of kps) {
      lines.push(`### ${kp.name}`);
      lines.push("");
      if (kp.learning_tips) lines.push(`💡 ${kp.learning_tips}`);
      if (kp.common_mistakes && kp.common_mistakes.length > 0) {
        lines.push("");
        lines.push(isZh ? "**常见错误**:" : "**Common Mistakes**:");
        for (const m of kp.common_mistakes) lines.push(`- ${m}`);
      }
      lines.push("");
    }
  }

  // Teacher steps — resolve i18n keys to copy (never leak raw key names)
  if (scene.teacher_steps && scene.teacher_steps.length > 0) {
    lines.push(`## ${isZh ? "教学步骤" : "Teaching Steps"}`);
    lines.push("");
    for (const step of [...scene.teacher_steps].sort((a, b) => a.order - b.order)) {
      const checked = currentTime >= step.timeStart ? "✓" : "○";
      lines.push(`${checked} **${t(step.titleKey)}** (t ≥ ${step.timeStart}s)`);
      lines.push(`  ${t(step.descKey)}`);
      if (step.formulaKey) lines.push(`  \`${t(step.formulaKey)}\``);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*${isZh ? "由 Physics Lab 自动生成" : "Generated by Physics Lab"}*`);
  return lines.join("\n");
}

export function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

/** Three.js Canvas 的默认 CSS 选择器 */
const CANVAS_SELECTOR = "#physics-canvas";

/** 捕获 Three.js 画布为 PNG data URL；canvas 不存在或 tainted 时返回 null */
export function captureScreenshot(selector: string = CANVAS_SELECTOR): string | null {
  if (typeof document === "undefined") return null;
  const canvas = document.querySelector<HTMLCanvasElement>(selector);
  if (!canvas) return null;
  try { return canvas.toDataURL("image/png"); }
  catch { console.warn("[report] Canvas tainted, screenshot unavailable"); return null; }
}
/** Generate HTML report with embedded screenshot (Markdown fully converted) */
export function generateHTMLReport(data: ReportData, locale: string): string {
  const md = generateMarkdownReport(data, locale);
  const bodyHtml = markdownToHtml(md);
  const screenshot = captureScreenshot();
  const title = data.scene.metadata.title || "Experiment";
  return `<!DOCTYPE html>
<html lang="${locale === "zh-CN" ? "zh" : "en"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} - Physics Lab</title>
<style>
body{font-family:-apple-system,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1e293b;line-height:1.7}
h1{font-size:28px;color:#0369a1;border-bottom:3px solid #0ea5e9;padding-bottom:12px;margin-bottom:20px}
h2{font-size:20px;color:#334155;margin:28px 0 12px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
img{max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin:16px 0}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px}
pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0}
pre code{background:none;padding:0}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left}
th{background:#f8fafc;font-weight:600;color:#475569}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:13px}
</style></head>
<body>
${screenshot ? `<img src="${screenshot}" alt="Screenshot" />\n` : ""}
${bodyHtml}
<div class="footer">Generated by Physics Lab</div>
</body></html>`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ==================== PDF 导出（html2canvas + jsPDF 图片嵌入法）====================

const PDF_RENDER_TARGET_ID = "pdf-render-target";

export async function generatePDFReport(
  data: ReportData,
  locale: string,
  options?: { canvasSelector?: string; quality?: number }
): Promise<Blob> {
  const { quality = 2 } = options ?? {};
  const htmlContent = generateHTMLReport(data, locale);
  const container = document.createElement("div");
  container.id = PDF_RENDER_TARGET_ID;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "860px";
  container.style.background = "#ffffff";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: quality, useCORS: true, logging: false });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf.output("blob");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}

export async function downloadPDFReport(data: ReportData, locale: string, filename?: string): Promise<void> {
  const name = filename ?? `${data.scene.metadata.title || "experiment"}_${Date.now()}.pdf`;
  const blob = await generatePDFReport(data, locale);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
