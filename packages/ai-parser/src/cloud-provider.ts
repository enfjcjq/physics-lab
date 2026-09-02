// ============================================================
// CloudProvider (S85, DD-002): OpenAI-compatible remote LLM.
// Implements the existing AIProvider interface; architecture
// unchanged. baseUrl / apiKey / model are configurable from the
// settings page (stored locally by the renderer).
// Offline/failure -> honest error (never hard-fit a wrong scene).
// ============================================================

import type { AIProvider, ParseResult } from "./types";
import type { PhysicsScene } from "@physics-lab/shared";

export interface CloudConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "deepseek-chat";

function buildScenePrompt(text: string): string {
  return `You are a physics problem parser. Convert the following physics problem into a valid PhysicsScene JSON object.

Physics Problem:
${text}

Output ONLY valid JSON following this schema:

{
  "version": "2.0",
  "metadata": { "title": "short title", "description": "brief", "subject": "mechanics|electromagnetism|optics|thermodynamics|waves|modern", "topic": "free_fall|projectile|inclined_plane|collision|spring|pendulum|circular_motion|buoyancy|ohms_law|coulombs_law|faraday_law|electric_motor|ac_generator|ideal_gas|refraction|lens_optics|transverse_wave|doppler_effect", "difficulty": "easy|medium|hard", "grade": "junior_high|senior_high|college", "tags": ["tag1"] },
  "entities": [ { "id": "ball_1", "type": "ball", "name": "Object", "position": [0, 10, 0], "properties": { "mass": 2, "radius": 0.2 }, "initial_conditions": { "velocity": [0, 0, 0] } } ],
  "environment": [ { "type": "gravity_field", "properties": { "acceleration": 9.8, "direction": [0, -1, 0] } } ],
  "forces": [ { "id": "gravity", "type": "gravity", "target_entity": "ball_1", "magnitude": "mass * g", "direction": [0, -1, 0] } ],
  "equations": [ { "id": "eq1", "name": "Motion", "expression": "y(t) = h0 - 0.5 * g * t^2", "variables": { "h0": { "symbol": "h0", "unit": "m", "description": "height" }, "g": { "symbol": "g", "unit": "m/s2", "description": "gravity" } }, "type": "motion", "is_solution": false } ],
  "timeline": { "total_duration": 3, "fps": 60, "events": [ { "id": "impact", "time": 1.4, "type": "collision", "data": {} } ], "phases": [ { "id": "release", "label": "phase.release", "icon": "o", "timeRange": [0, 0.1] }, { "id": "falling", "label": "phase.falling", "icon": "v", "timeRange": [0.1, 1.4] } ] },
  "camera_script": [ { "id": "overview", "time": 0, "position": [8, 6, 8], "target": [0, 5, 0] } ],
  "ui_controls": [],
  "knowledge_tags": [ { "id": "kp1", "name": "Free Fall", "category": "mechanics", "level": 2 } ]
}

Extract all numerical parameters (height, mass, velocity, angle, gravity, friction, length, k, voltage, resistance, current, charge, turns, frequency, temperature, pressure, focal length, refractive index, wave speed) from the problem. Use SI units. If the problem is not a supported physics scenario, output {"unsupported": true} instead.`;
}

function extractJson(text: string): string | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const m = candidate.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

export class CloudProvider implements AIProvider {
  id = "cloud";
  name = "Cloud AI";
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private timeout: number;

  constructor(config: Partial<CloudConfig> = {}, timeout = 30000) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, "") || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey ?? "";
    this.model = config.model || DEFAULT_MODEL;
    this.timeout = timeout;
  }

  getConfig(): CloudConfig {
    return { baseUrl: this.baseUrl, apiKey: this.apiKey, model: this.model };
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!resp.ok) return false;
      try {
        const data = await resp.json();
        const models: Array<{ id?: string }> = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (models.length > 0) {
          return models.some((m) => m.id === this.model);
        }
      } catch {
        // fall through to best-effort resp.ok when the list is unreadable
      }
      return true;
    } catch {
      return false;
    }
  }

  /** One raw chat completion request. Returns status/body and parsed JSON (best-effort). */
  private async chat(text: string): Promise<{ ok: boolean; status: number; body: string; data: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: buildScenePrompt(text) }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });
      const body = await resp.text().catch(() => "");
      let data: any = null;
      try { data = body ? JSON.parse(body) : null; } catch { data = null; }
      return { ok: resp.ok, status: resp.status, body, data };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async parseProblem(text: string, _existingScene?: PhysicsScene): Promise<ParseResult> {
    const start = Date.now();
    if (!this.apiKey) {
      return { scene: null, success: false, error: "尚未配置云端 AI 密钥（帮助 → 设置 → 云 AI）。", provider: this.id, durationMs: Date.now() - start };
    }
    try {
      let r = await this.chat(text);
      if (!r.ok) {
        console.warn(`[CloudProvider] HTTP ${r.status}: ${r.body.slice(0, 200)}`);
        return { scene: null, success: false, error: `云端 AI 请求失败（HTTP ${r.status}），已切换本地解析。`, provider: this.id, durationMs: Date.now() - start };
      }
      let choice = r.data?.choices?.[0];
      // Reasoning models may hit the token cap intermittently: retry once on truncation.
      if (choice?.finish_reason === "length") {
        r = await this.chat(text);
        if (!r.ok) {
          console.warn(`[CloudProvider] HTTP ${r.status}: ${r.body.slice(0, 200)}`);
          return { scene: null, success: false, error: `云端 AI 请求失败（HTTP ${r.status}），已切换本地解析。`, provider: this.id, durationMs: Date.now() - start };
        }
        choice = r.data?.choices?.[0];
        if (choice?.finish_reason === "length") {
          return { scene: null, success: false, error: "云端 AI 输出被截断（token 不足），请简化题目或稍后重试。", provider: this.id, durationMs: Date.now() - start };
        }
      }
      const content: string = choice?.message?.content ?? "";
      const json = extractJson(content);
      if (!json) {
        console.warn("[CloudProvider] extractJson failed; raw:", content.slice(0, 300));
        return { scene: null, success: false, error: "云端 AI 返回无法解析，已切换本地解析。", provider: this.id, durationMs: Date.now() - start };
      }
      const parsed = JSON.parse(json) as PhysicsScene & { unsupported?: boolean };
      if (parsed.unsupported) {
        return { scene: null, success: false, error: "这道题暂时不能可靠生成动画。请换一种更明确的表述，或从实验库选择最接近的实验。", provider: this.id, durationMs: Date.now() - start };
      }
      if (!parsed.version || !parsed.entities || !parsed.timeline) {
        return { scene: null, success: false, error: "云端 AI 返回场景不完整，已切换本地解析。", provider: this.id, durationMs: Date.now() - start };
      }
      return { scene: parsed, success: true, provider: this.id, durationMs: Date.now() - start, confidence: 0.9 };
    } catch (err) {
      console.warn("[CloudProvider] parseProblem error:", err instanceof Error ? err.message : String(err));
      return { scene: null, success: false, error: "云端 AI 不可用，已切换本地解析。", provider: this.id, durationMs: Date.now() - start };
    }
  }
}
