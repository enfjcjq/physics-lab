// ============================================================
// AI Parser E2E Runner (T310)
//
// Runs every test case in cases.ts through the rule parser (and
// optionally the Ollama provider) and prints a JSON report to
// stdout: type hit rate, param match rate, per-category breakdown.
//
// Run (from repo root):
//   npx vite-node -c vitest.config.ts packages/ai-parser/test-cases/run-e2e.ts
// ============================================================

import { ruleParser } from "@physics-lab/ai-parser";
import { OllamaProvider } from "@physics-lab/ai-parser";
import { parseTestCases, type ParseTestCase } from "./cases";
import type { PhysicsScene } from "@physics-lab/shared";

const REL_TOLERANCE = 0.05; // 5% relative tolerance for numeric params

interface ParamReport {
  key: string;
  expected: number;
  found: number | null;
  match: boolean;
}

interface CaseReport {
  id: string;
  category: ParseTestCase["category"];
  lang: ParseTestCase["lang"];
  expectedType: string;
  detectedType: string;
  typeHit: boolean;
  params: ParamReport[];
}

function extractParamValue(scene: PhysicsScene | null, key: string): number | undefined {
  if (!scene) return undefined;
  const sim = (scene as unknown as { simulation?: { params?: Record<string, number> } }).simulation?.params;
  const entity = scene.entities.find((e) => (e.properties as { mass?: number }).mass && (e.properties as { mass?: number }).mass! > 0);
  const gravEnv = scene.environment.find((e) => e.type === "gravity_field");
  const inclineEnv = scene.environment.find((e) => e.type === "incline_plane");
  const v = entity && "initial_conditions" in entity ? entity.initial_conditions?.velocity : undefined;

  switch (key) {
    case "height": return entity?.position?.[1];
    case "mass": return entity?.properties?.mass as number | undefined;
    case "gravity": return gravEnv?.properties.acceleration ?? sim?.g;
    case "velocity":
      if (Array.isArray(v)) return Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
      return sim?.v0 ?? sim?.v;
    case "angle": return inclineEnv?.properties.angle ?? sim?.angle ?? sim?.theta1_deg;
    case "friction": return inclineEnv?.properties.friction_coefficient ?? sim?.mu ?? sim?.friction;
    case "length": return sim?.L ?? (scene.constraints[0]?.properties as { length?: number } | undefined)?.length;
    case "k": return sim?.k;
    case "voltage": return sim?.V;
    case "resistance": return sim?.R;
    case "current": return sim?.I;
    case "charge": return sim?.q1 ?? (entity?.properties as { charge?: number } | undefined)?.charge;
    case "turns": return sim?.N;
    case "temperature": return sim?.T;
    case "pressure": return sim?.P ?? sim?.pressure;
    case "focal_length": return sim?.f;
    case "refractive_index": return sim?.n2 ?? sim?.n1;
    case "frequency": return sim?.f0 ?? sim?.f;
    case "wave_speed": return sim?.v_sound ?? sim?.v_light ?? sim?.v;
    default: return undefined;
  }
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= REL_TOLERANCE * Math.max(Math.abs(b), 1e-9);
}

function runCase(tc: ParseTestCase, scene: PhysicsScene | null): CaseReport {
  const detectedType = scene?.metadata.topic ?? "unknown";
  const params: ParamReport[] = Object.entries(tc.expectedParams ?? {}).map(([key, expected]) => {
    const found = extractParamValue(scene, key);
    return {
      key,
      expected,
      found: found ?? null,
      match: found !== undefined && near(found, expected),
    };
  });
  return {
    id: tc.id,
    category: tc.category,
    lang: tc.lang,
    expectedType: tc.expectedType,
    detectedType,
    typeHit: detectedType === tc.expectedType,
    params,
  };
}

function summarize(reports: CaseReport[]) {
  const total = reports.length;
  const typeHits = reports.filter((r) => r.typeHit).length;
  const allParams = reports.flatMap((r) => r.params);
  const paramKeys = allParams.length;
  const paramMatches = allParams.filter((p) => p.match).length;
  const paramMissing = allParams.filter((p) => p.found === null).length;

  const byCategory: Record<string, { total: number; hits: number; paramKeys: number; paramMatches: number }> = {};
  for (const r of reports) {
    const c = (byCategory[r.category] ??= { total: 0, hits: 0, paramKeys: 0, paramMatches: 0 });
    c.total++;
    if (r.typeHit) c.hits++;
    c.paramKeys += r.params.length;
    c.paramMatches += r.params.filter((p) => p.match).length;
  }

  return {
    total,
    typeHitRate: total ? +(typeHits / total).toFixed(4) : 0,
    typeHits,
    paramMatchRate: paramKeys ? +(paramMatches / paramKeys).toFixed(4) : 0,
    paramKeys,
    paramMatches,
    paramMissing,
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [
        k,
        { ...v, hitRate: v.total ? +(v.hits / v.total).toFixed(4) : 0, paramMatchRate: v.paramKeys ? +(v.paramMatches / v.paramKeys).toFixed(4) : 0 },
      ]),
    ),
  };
}

async function main() {
  const t0 = Date.now();
  const reports: CaseReport[] = [];

  for (const tc of parseTestCases) {
    const res = await ruleParser.parseProblem(tc.text);
    reports.push(runCase(tc, res.scene));
  }

  const ruleSummary = summarize(reports);

  // Optional Ollama comparison (skipped when not available)
  const ollama = new OllamaProvider();
  const ollamaAvailable = await ollama.isAvailable();
  let ollamaReport: { available: boolean; summary?: unknown; failures?: { id: string; error: string }[] } = { available: ollamaAvailable };
  if (ollamaAvailable) {
    const oReports: CaseReport[] = [];
    const failures: { id: string; error: string }[] = [];
    for (const tc of parseTestCases) {
      const res = await ollama.parseProblem(tc.text);
      if (res.success && res.scene) {
        oReports.push(runCase(tc, res.scene));
      } else {
        failures.push({ id: tc.id, error: res.error ?? "unknown" });
      }
    }
    ollamaReport = {
      available: true,
      summary: summarize(oReports),
      failures,
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    ruleParser: ruleSummary,
    ollama: ollamaReport,
    cases: reports,
  };

  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

