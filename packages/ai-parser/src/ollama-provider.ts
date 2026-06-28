import type { AIProvider, ParseResult } from "./types";
import type { PhysicsScene } from "@physics-lab/shared";

/**
 * Ollama AI Provider
 *
 * Communicates with a local Ollama instance to parse physics problems.
 * Falls back gracefully if Ollama is not running.
 *
 * Endpoint: http://localhost:11434/api/generate
 * Default model: llama3.2 (lightweight, good for structured output)
 */

const OLLAMA_BASE = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";

interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export class OllamaProvider implements AIProvider {
  id = "ollama";
  name = "Ollama (Local LLM)";
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl ?? OLLAMA_BASE;
    this.model = config.model ?? DEFAULT_MODEL;
    this.timeout = config.timeout ?? 30000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return resp.ok;
    } catch {
      return false;
    }
  }

  async parseProblem(text: string, _existingScene?: PhysicsScene): Promise<ParseResult> {
    const start = Date.now();

    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          scene: null, success: false,
          error: "Ollama is not running. Please start Ollama and try again.",
          provider: this.id, durationMs: Date.now() - start,
        };
      }

      const prompt = this.buildPrompt(text);
      const response = await this.callOllama(prompt);

      if (!response) {
        return {
          scene: null, success: false,
          error: "Ollama returned empty response.",
          provider: this.id, durationMs: Date.now() - start,
        };
      }

      // Try to parse the JSON from the response
      const jsonStr = this.extractJSON(response);
      if (!jsonStr) {
        return {
          scene: null, success: false,
          error: "Could not extract valid PhysicsScene JSON from Ollama response.",
          provider: this.id, durationMs: Date.now() - start,
        };
      }

      const parsed = JSON.parse(jsonStr) as PhysicsScene;
      // Basic validation
      if (!parsed.version || !parsed.entities || !parsed.timeline) {
        return {
          scene: null, success: false,
          error: "Ollama returned incomplete PhysicsScene (missing required fields).",
          provider: this.id, durationMs: Date.now() - start,
        };
      }

      return {
        scene: parsed, success: true,
        provider: this.id, durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        scene: null, success: false,
        error: err instanceof Error ? err.message : "Unknown Ollama error",
        provider: this.id, durationMs: Date.now() - start,
      };
    }
  }

  private buildPrompt(text: string): string {
    return `You are a physics problem parser. Convert the following physics problem into a valid PhysicsScene JSON object.

Physics Problem:
${text}

Output ONLY valid JSON following this schema:

{
  "version": "2.0",
  "metadata": {
    "title": "short title",
    "description": "brief description",
    "subject": "mechanics",
    "topic": "free_fall|projectile|inclined_plane|collision|spring|pendulum",
    "difficulty": "easy|medium|hard",
    "grade": "senior_high",
    "tags": ["tag1", "tag2"]
  },
  "entities": [
    {
      "id": "ball_1",
      "type": "ball",
      "name": "Object",
      "position": [x, y, z],
      "properties": { "mass": number },
      "initial_conditions": { "velocity": [vx, vy, vz] }
    }
  ],
  "environment": [
    { "type": "gravity_field", "properties": { "acceleration": 9.8, "direction": [0, -1, 0] } }
  ],
  "forces": [
    { "id": "gravity", "type": "gravity", "target_entity": "ball_1", "magnitude": "mg", "direction": [0, -1, 0] }
  ],
  "timeline": {
    "total_duration": number,
    "fps": 60,
    "phases": [
      { "id": "phase1", "label": "phase name", "timeRange": [start, end] }
    ]
  }
}

Extract all numerical parameters (height, mass, velocity, angle, gravity, friction coefficient) from the problem.
Use SI units: meters, kg, seconds, m/s^2.
Set total_duration based on the physics (e.g., free fall from 10m = sqrt(2*10/9.8) ~ 1.43s, add 0.2s margin).`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const resp = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 2048 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      return data.response ?? "";
    } catch {
      clearTimeout(timeoutId);
      return "";
    }
  }

  private extractJSON(text: string): string | null {
    // Try to find JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];

    // Try to find JSON in markdown code block
    const mdMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (mdMatch) return mdMatch[1];

    return null;
  }
}
