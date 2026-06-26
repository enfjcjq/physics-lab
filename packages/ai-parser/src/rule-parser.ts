import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";
import type { AIProvider, ParseResult } from "./types";

// ============================================================
// Rule-Based Physics Parser
// Extracts physical quantities from Chinese/English text.
// Temporary solution until LLM integration.
// ============================================================

interface ExtractedParams {
  height: number;
  mass: number;
  gravity: number;
  velocity: number;
  angle: number;
  motionType: "free_fall" | "projectile" | "unknown";
}

function extractParams(text: string): ExtractedParams {
  const params: ExtractedParams = {
    height: 10,
    mass: 2,
    gravity: 9.8,
    velocity: 0,
    angle: 0,
    motionType: "unknown",
  };

  // Detect motion type
  if (/free.?fall|ziyou luoti|free fall/i.test(text)) {
    params.motionType = "free_fall";
  } else if (/projectile|ping pao|projectile motion/i.test(text)) {
    params.motionType = "projectile";
  } else if (/luoxia|fall|xia luo|drop/i.test(text)) {
    params.motionType = "free_fall";
  }

  // Height: "10m", "10米", "height 10", "h0=10", "从10m", "高度10"
  const heightPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:m|米|meter)/i,
    /height\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /h0?\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /(?:从|from)\s*(\d+(?:\.\d+)?)\s*(?:m|米)/i,
    /(?:高度|gaodu)\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const p of heightPatterns) {
    const m = text.match(p);
    if (m) { params.height = parseFloat(m[1]); break; }
  }

  // Mass: "2kg", "2千克", "mass 2", "质量2", "m=2"
  const massPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:kg|千克|kilogram)/i,
    /mass\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /(?:质量|zhiliang)\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /m\s*=\s*(\d+(?:\.\d+)?)\s*(?:kg)?/i,
  ];
  for (const p of massPatterns) {
    const m = text.match(p);
    if (m) { params.mass = parseFloat(m[1]); break; }
  }

  // Gravity: "g=10", "g=9.8", "重力加速度10"
  const gravPatterns = [
    /g\s*=\s*(\d+(?:\.\d+)?)/i,
    /gravity\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /(?:重力加速度|zhongli)\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const p of gravPatterns) {
    const m = text.match(p);
    if (m) { params.gravity = parseFloat(m[1]); break; }
  }

  // Velocity: "v0=5", "初速度5", "initial velocity 5"
  const velPatterns = [
    /v0?\s*=\s*(\d+(?:\.\d+)?)/i,
    /initial.velocity\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /(?:初速度|chusudu)\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const p of velPatterns) {
    const m = text.match(p);
    if (m) { params.velocity = parseFloat(m[1]); break; }
  }

  // Angle: "45度", "angle 30", "角度30"
  const anglePatterns = [
    /(\d+(?:\.\d+)?)\s*(?:度|°|deg)/i,
    /angle\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
    /(?:角度|jiaodu)\s*(?:=|:|= )\s*(\d+(?:\.\d+)?)/i,
  ];
  for (const p of anglePatterns) {
    const m = text.match(p);
    if (m) { params.angle = parseFloat(m[1]); break; }
  }

  return params;
}

function buildScene(params: ExtractedParams, originalText: string): PhysicsScene {
  // For free fall, clone and customize the default scene
  if (params.motionType === "free_fall") {
    const scene = JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;
    
    // Update entity position
    if (scene.entities[0] && scene.entities[0].type === "ball") {
      scene.entities[0].position[1] = params.height;
      scene.entities[0].properties.mass = params.mass;
    }
    
    // Update gravity
    if (scene.environment[0] && scene.environment[0].type === "gravity_field") {
      scene.environment[0].properties.acceleration = params.gravity;
    }
    
    // Recalculate impact time
    const g = params.gravity;
    const h = params.height;
    const impactTime = Math.sqrt(2 * h / g);
    const impactVelocity = Math.sqrt(2 * g * h);
    
    // Update timeline
    scene.timeline.total_duration = Math.max(impactTime * 2, 3);
    scene.timeline.events = [
      { id: "start", time: 0.0, type: "phase_start", data: { label: "Release" }, description: "Released from rest" },
      { id: "impact", time: impactTime, type: "collision", target: "ball_1", data: { collision_with: "ground", impact_velocity: impactVelocity }, description: "Impact" },
    ];
    
    // Update phases
    if (scene.timeline.phases) {
      scene.timeline.phases = [
        { id: "release", label: "phase.release", icon: "o", timeRange: [0, 0.05], color: "#22c55e" },
        { id: "falling", label: "phase.falling", icon: "v", timeRange: [0.05, impactTime - 0.05], color: "#3b82f6" },
        { id: "impact",  label: "phase.impact",  icon: "O", timeRange: [impactTime - 0.1, impactTime + 0.1], color: "#f59e0b" },
        { id: "bounce",  label: "phase.bounce",  icon: "^", timeRange: [impactTime + 0.1, scene.timeline.total_duration], color: "#ef4444" },
      ];
    }

    // Update metadata
    scene.metadata.title = originalText.slice(0, 50) || "Free Fall";
    scene.metadata.generatedAt = new Date().toISOString();
    scene.metadata.generatedBy = "rule-parser";
    
    // Update equation with computed values
    scene.equations = [
      {
        id: "eq_motion", name: "Motion", expression: `y(t) = ${params.height} - (1/2)*${g}*t^2`,
        variables: { h: { symbol: "h", unit: "m", description: "Height" }, g: { symbol: "g", unit: "m/s2", description: "Gravity" }, t: { symbol: "t", unit: "s", description: "Time" } },
        type: "motion",
      },
      {
        id: "eq_velocity", name: "Impact velocity",
        expression: `v = sqrt(2*${g}*${params.height}) = ${impactVelocity.toFixed(1)} m/s`,
        variables: { v: { symbol: "v", unit: "m/s", description: "Velocity" }, g: { symbol: "g", unit: "m/s2", description: "Gravity" }, h: { symbol: "h", unit: "m", description: "Height" } },
        type: "target", is_solution: true,
      },
    ];
    
    // Update UI controls
    scene.ui_controls = [
      { id: "ctrl_mass", parameter: "entities[0].properties.mass", type: "slider", label: "Mass", default_value: params.mass, min: 0.1, max: 10.0, step: 0.1, unit: "kg", group: "Physics" },
      { id: "ctrl_gravity", parameter: "environment[0].properties.acceleration", type: "slider", label: "Gravity", default_value: g, min: 0.1, max: 20.0, step: 0.5, unit: "m/s2", group: "Physics" },
      { id: "ctrl_height", parameter: "entities[0].position[1]", type: "slider", label: "Height", default_value: params.height, min: 1.0, max: 50.0, step: 0.5, unit: "m", group: "Initial" },
    ];

    return scene;
  }

  // Unknown type: fall back to default free-fall
  return JSON.parse(JSON.stringify(FREE_FALL_SCENE)) as PhysicsScene;
}

// ============================================================
// RuleParser Provider
// ============================================================

export const ruleParser: AIProvider = {
  id: "rule-parser",
  name: "Rule-Based Parser",

  isAvailable: async () => true,

  parseProblem: async (text: string, existingScene?: PhysicsScene): Promise<ParseResult> => {
    const start = Date.now();
    try {
      const params = extractParams(text);
      const scene = buildScene(params, text);
      return {
        scene,
        success: true,
        provider: "rule-parser",
        durationMs: Date.now() - start,
      };
    } catch (e: any) {
      return {
        scene: existingScene ?? null,
        success: false,
        error: e?.message ?? "Unknown parse error",
        provider: "rule-parser",
        durationMs: Date.now() - start,
      };
    }
  },
};
