import { describe, it, expect } from "vitest";
import { ruleParser } from "@physics-lab/ai-parser";
import { detectMotion, extractParams } from "../../../../../packages/ai-parser/src/rule-parser";
import { parseTestCases } from "../../../../../packages/ai-parser/test-cases/cases";

// ============================================================
// Rule parser quality gate (T310)
// Guards the P1 core loop: 题目 -> PhysicsScene.
// If coverage drops below the threshold, the parser must improve
// (or a new case must be justified) before merging.
// ============================================================

describe("rule parser e2e coverage (50 cases)", () => {
  it("detects the correct scene type for every case", async () => {
    let hits = 0;
    for (const tc of parseTestCases) {
      const res = await ruleParser.parseProblem(tc.text);
      const detected = res.scene?.metadata.topic ?? "unknown";
      if (detected === tc.expectedType) hits++;
    }
    const rate = hits / parseTestCases.length;
    // Baseline before S70 was 24% (12/50). Threshold guards regressions.
    expect(rate).toBeGreaterThanOrEqual(0.9);
  });

  it("extracts expected numeric params within tolerance", async () => {
    let keys = 0;
    let matched = 0;
    for (const tc of parseTestCases) {
      const res = await ruleParser.parseProblem(tc.text);
      for (const entry of Object.entries(tc.expectedParams ?? {}) as [string, number][]) {
        const [key, expected] = entry;
        keys++;
        const found = extractSceneParam(res.scene, key);
        if (found !== undefined && Math.abs(found - expected) <= 0.05 * Math.max(Math.abs(expected), 1e-9)) {
          matched++;
        }
      }
    }
    expect(keys).toBeGreaterThan(0);
    expect(matched / keys).toBeGreaterThanOrEqual(0.9);
  });
});

describe("rule parser keyword detection", () => {
  it.each([
    ["自由落体", "free_fall"],
    ["平抛运动", "projectile"],
    ["斜面", "inclined_plane"],
    ["弹性碰撞", "collision"],
    ["弹簧振子", "spring"],
    ["单摆", "pendulum"],
    ["匀速圆周运动", "circular_motion"],
    ["浮力", "buoyancy"],
    ["电压与电阻", "ohms_law"],
    ["点电荷", "coulombs_law"],
    ["电磁感应", "faraday_law"],
    ["电动机", "electric_motor"],
    ["交流发电机", "ac_generator"],
    ["理想气体", "ideal_gas"],
    ["折射率", "refraction"],
    ["凸透镜", "lens_optics"],
    ["横波", "transverse_wave"],
    ["多普勒效应", "doppler_effect"],
  ])("detectMotion(%s) -> %s", (text, expected) => {
    expect(detectMotion(text)).toBe(expected);
  });
});

describe("rule parser parameter extraction", () => {
  it("extracts free-fall height and gravity", () => {
    const p = extractParams("一个小球从20米高处自由下落，g=10m/s²。");
    expect(p.motionType).toBe("free_fall");
    expect(p.height).toBe(20);
    expect(p.gravity).toBe(10);
  });

  it("extracts velocity in m/s without stealing wave speed", () => {
    const p = extractParams(
      "A train moving at 30 m/s approaches a stationary observer, sounding its horn (500 Hz). Sound speed is 340 m/s."
    );
    expect(p.motionType).toBe("doppler_effect");
    expect(p.velocity).toBe(30);
    expect(p.waveSpeed).toBe(340);
    expect(p.frequency).toBe(500);
  });

  it("extracts ohms-law voltage and resistance", () => {
    const p = extractParams("一个电阻的阻值为6欧姆，两端电压为12V。");
    expect(p.motionType).toBe("ohms_law");
    expect(p.resistance).toBe(6);
    expect(p.voltage).toBe(12);
  });

  it("extracts angle after the number (45度仰角)", () => {
    const p = extractParams("篮球以45度仰角斜抛，初速度为8m/s。");
    expect(p.motionType).toBe("projectile");
    expect(p.angle).toBe(45);
    expect(p.velocity).toBe(8);
  });

  it("applies params into the generated scene simulation", async () => {
    const res = await ruleParser.parseProblem("一个100匝的线圈产生感应电动势。");
    expect(res.scene?.metadata.topic).toBe("faraday_law");
    const sim = (res.scene as unknown as { simulation?: { params?: Record<string, number> } }).simulation;
    expect(sim?.params?.N).toBe(100);
  });
});

// Mirror of the extractor used by run-e2e.ts (kept local to avoid coupling)
function extractSceneParam(scene: unknown, key: string): number | undefined {
  const s = scene as {
    entities?: {
      properties?: { mass?: number };
      position?: [number, number, number];
      initial_conditions?: { velocity?: [number, number, number] };
    }[];
    environment?: { type: string; properties: Record<string, unknown> }[];
    constraints?: { properties?: Record<string, unknown> }[];
  } | null;
  if (!s) return undefined;
  const sim = (scene as { simulation?: { params?: Record<string, number> } }).simulation?.params;
  const entity = s.entities?.find((e) => (e.properties?.mass ?? 0) > 0);
  const gravEnv = s.environment?.find((e) => e.type === "gravity_field");
  const inclineEnv = s.environment?.find((e) => e.type === "incline_plane");
  switch (key) {
    case "height": return entity?.position?.[1];
    case "mass": return entity?.properties?.mass;
    case "gravity": return (gravEnv?.properties?.acceleration as number) ?? sim?.g;
    case "velocity": {
      const v = entity?.initial_conditions?.velocity;
      if (v) return Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
      return sim?.v0 ?? sim?.v ?? sim?.vs;
    }
    case "angle": return (inclineEnv?.properties?.angle as number) ?? sim?.angle ?? sim?.theta1_deg;
    case "friction": return (inclineEnv?.properties?.friction_coefficient as number) ?? sim?.mu ?? sim?.friction;
    case "length": return sim?.L ?? (s.constraints?.[0]?.properties?.length as number | undefined);
    case "k": return sim?.k;
    case "voltage": return sim?.V;
    case "resistance": return sim?.R;
    case "current": return sim?.I;
    case "charge": return sim?.q1;
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
