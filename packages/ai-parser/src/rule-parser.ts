import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE, PROJECTILE_MOTION_SCENE, INCLINED_PLANE_SCENE, COLLISION_SCENE, SPRING_MASS_SCENE, PENDULUM_SCENE } from "@physics-lab/shared";
import type { AIProvider, ParseResult } from "./types";

// ============================================================
// Rule-Based Physics Parser v2.1
// Supports Chinese + English input for 6 experiment types.
// Uses unicode escapes for Chinese chars.
// ============================================================

type MotionType = "free_fall" | "projectile" | "inclined_plane" | "collision" | "spring" | "pendulum" | "unknown";

interface ExtractedParams {
  motionType: MotionType;
  height: number;
  mass: number;
  gravity: number;
  velocity: number;
  angle: number;
  friction: number;
  length: number;
  k: number;
}

const SCENE_MAP: Record<string, PhysicsScene> = {
  free_fall: FREE_FALL_SCENE,
  projectile: PROJECTILE_MOTION_SCENE,
  inclined_plane: INCLINED_PLANE_SCENE,
  collision: COLLISION_SCENE,
  spring: SPRING_MASS_SCENE,
  pendulum: PENDULUM_SCENE,
};

// Chinese character constants
const CH = {
  meter: "\u7C73",
  kg: "\u5343\u514B",
  height: "\u9AD8\u5EA6",
  mass: "\u8D28\u91CF",
  gravity: "\u91CD\u529B\u52A0\u901F\u5EA6",
  velocity: "\u521D\u901F\u5EA6",
  angle: "\u89D2\u5EA6",
  length: "\u957F\u5EA6",
  friction: "\u6469\u64E6\u7CFB\u6570",
  spring: "\u5F39\u7C27",
  freefall: "\u81EA\u7531\u843D\u4F53",
  drop: "\u4E0B\u843D",
  release: "\u91CA\u653E",
  projectile: "\u629B\u4F53\u8FD0\u52A8",
  horizontal: "\u5E73\u629B",
  oblique: "\u659C\u629B",
  incline: "\u659C\u9762",
  block: "\u6ED1\u5757",
  slide: "\u6ED1\u4E0B",
  collision: "\u78B0\u649E",
  elastic: "\u5F39\u6027",
  pendulum: "\u5355\u6446",
  swing: "\u6446\u52A8",
  oscillation: "\u632F\u52A8",
  hooke: "\u80E1\u514B",
  degree: "\u00B0",
};

function detectMotion(text: string): MotionType {
  const patterns: [MotionType, RegExp[]][] = [
    ["pendulum", [
      new RegExp("pendulum|single pendulum|simple pendulum|" + CH.pendulum + "|" + CH.swing, "i"),
    ]],
    ["spring", [
      new RegExp("spring.?mass|" + CH.spring + "|" + CH.oscillation + "|SHM|simple harmonic|" + CH.hooke, "i"),
    ]],
    ["collision", [
      new RegExp("collision|" + CH.collision + "|" + CH.elastic + "|momentum|impact", "i"),
    ]],
    ["inclined_plane", [
      new RegExp("inclined|incline|" + CH.incline + "|" + CH.block + "|" + CH.slide + "|ramp", "i"),
    ]],
    ["projectile", [
      new RegExp("projectile|" + CH.horizontal + "|" + CH.oblique + "|" + CH.projectile + "|trajectory|parabolic|parabola", "i"),
    ]],
    ["free_fall", [
      new RegExp("free.?fall|" + CH.freefall + "|" + CH.drop + "|" + CH.release + "|falling|drop", "i"),
    ]],
  ];

  for (const [motionType, regexes] of patterns) {
    for (const re of regexes) {
      if (re.test(text)) return motionType;
    }
  }

  return "unknown";
}

function extractParams(text: string): ExtractedParams {
  const p: ExtractedParams = {
    motionType: detectMotion(text),
    height: 10, mass: 2, gravity: 9.8,
    velocity: 0, angle: 0, friction: 0.3,
    length: 4.5, k: 10,
  };

  const heightPatterns: RegExp[] = [
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:m|" + CH.meter + "|meter)", "i"),
    /height\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    /h0?\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.height + "|h)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
    new RegExp("(?:" + CH.drop + "|from)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m|" + CH.meter + ")?", "i"),
  ];
  for (const re of heightPatterns) {
    const m = text.match(re); if (m) { p.height = parseFloat(m[1]); break; }
  }

  const massPatterns: RegExp[] = [
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:kg|" + CH.kg + "|kilogram)", "i"),
    /mass\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.mass + "|m)\\s*=\\s*(\\d+(?:\\.\\d+)?)", "i"),
    /m\s*=\s*(\d+(?:\.\d+)?)\s*(?:kg)?/i,
  ];
  for (const re of massPatterns) {
    const m = text.match(re); if (m) { p.mass = parseFloat(m[1]); break; }
  }

  const gravityPatterns: RegExp[] = [
    /g\s*=\s*(\d+(?:\.\d+)?)/i,
    /gravity\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.gravity + "|g)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ];
  for (const re of gravityPatterns) {
    const m = text.match(re); if (m) { p.gravity = parseFloat(m[1]); break; }
  }

  const velocityPatterns: RegExp[] = [
    /v0?\s*=\s*(\d+(?:\.\d+)?)/i,
    /initial\s*velocity\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.velocity + "|v0?)\\s*=\\s*(\\d+(?:\\.\\d+)?)", "i"),
    /speed\s*[=:]\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const re of velocityPatterns) {
    const m = text.match(re); if (m) { p.velocity = parseFloat(m[1]); break; }
  }

  const anglePatterns: RegExp[] = [
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:" + CH.degree + "|deg|degree)", "i"),
    /angle\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.angle + ")\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ];
  for (const re of anglePatterns) {
    const m = text.match(re); if (m) { p.angle = parseFloat(m[1]); break; }
  }

  const lengthPatterns: RegExp[] = [
    /[Ll]\s*=\s*(\d+(?:\.\d+)?)/,
    new RegExp("(?:" + CH.length + "|length|L)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ];
  for (const re of lengthPatterns) {
    const m = text.match(re); if (m) { p.length = parseFloat(m[1]); break; }
  }

  const frictionPatterns: RegExp[] = [
    /mu\s*=\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.friction + "|friction|mu)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ];
  for (const re of frictionPatterns) {
    const m = text.match(re); if (m) { p.friction = parseFloat(m[1]); break; }
  }

  const kPatterns: RegExp[] = [
    /[kK]\s*=\s*(\d+(?:\.\d+)?)/,
    /spring\s*constant\s*[=:]\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const re of kPatterns) {
    const m = text.match(re); if (m) { p.k = parseFloat(m[1]); break; }
  }

  return p;
}

function buildScene(params: ExtractedParams, text: string): PhysicsScene {
  const sceneKey = params.motionType === "unknown" ? "free_fall" : params.motionType;
  const template = SCENE_MAP[sceneKey] || FREE_FALL_SCENE;
  const scene = JSON.parse(JSON.stringify(template)) as PhysicsScene;

  // Store user's problem in metadata description
  scene.metadata.description = text;

  // Apply extracted parameters
  if (scene.entities && scene.entities.length > 0) {
    const primaryEntity = scene.entities[0];
    // Set height (y position) for free-fall
    if (sceneKey === "free_fall" && primaryEntity.position) {
      primaryEntity.position[1] = params.height;
    }
    // Set velocity for projectile
    if (sceneKey === "projectile" && primaryEntity.initial_conditions?.velocity) {
      const rad = params.angle * Math.PI / 180;
      primaryEntity.initial_conditions.velocity[0] = params.velocity * Math.cos(rad);
      primaryEntity.initial_conditions.velocity[1] = params.velocity * Math.sin(rad);
    }
    // Set mass on all entities with mass > 0
    for (const entity of scene.entities) {
      if (entity.properties && typeof entity.properties.mass === "number" && entity.properties.mass > 0) {
        entity.properties.mass = params.mass;
      }
    }
  }

  // Set gravity on gravity_field environment (type-safe check)
  if (scene.environment && scene.environment.length > 0) {
    const env = scene.environment[0];
    if (env.type === "gravity_field") {
      env.properties.acceleration = params.gravity;
    }
  }

  return scene;
}

// ============================================================
// RuleBasedParser implements AIProvider
// ============================================================
export const ruleParser: AIProvider = {
  id: "rule-based",
  name: "Rule-Based Parser",

  isAvailable: async (): Promise<boolean> => {
    return true; // Always available
  },

  async parseProblem(text: string, _existingScene?: PhysicsScene): Promise<ParseResult> {
    const start = performance.now();
    try {
      const params = extractParams(text);
      const scene = buildScene(params, text);
      const durationMs = performance.now() - start;

      return {
        scene,
        success: true,
        provider: "rule-based",
        durationMs,
      };
    } catch (err) {
      return {
        scene: null,
        success: false,
        error: String(err),
        provider: "rule-based",
        durationMs: performance.now() - start,
      };
    }
  },
};

export { detectMotion, extractParams, buildScene };
export type { ExtractedParams, MotionType };
