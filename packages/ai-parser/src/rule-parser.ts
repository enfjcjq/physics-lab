import type { PhysicsScene, Environment } from "@physics-lab/shared";
import {
  FREE_FALL_SCENE, PROJECTILE_MOTION_SCENE, INCLINED_PLANE_SCENE, COLLISION_SCENE,
  SPRING_MASS_SCENE, PENDULUM_SCENE, CIRCULAR_MOTION_SCENE, BUOYANCY_SCENE,
  OHMS_LAW_SCENE, WAVE_SCENE, COULOMB_SCENE, REFRACTION_SCENE, DOPPLER_SCENE,
  FARADAY_SCENE, MOTOR_SCENE, IDEAL_GAS_SCENE, LENS_OPTICS_SCENE, AC_GENERATOR_SCENE,
} from "@physics-lab/shared";
import type { AIProvider, ParseResult } from "./types";
import { ensureTeachingScript } from "@physics-lab/shared";
import { isChinese, localizeScene } from "./localize";

// ============================================================
// Rule-Based Physics Parser v3.0
// Supports Chinese + English input for 18 experiment types.
// ============================================================

export type MotionType =
  | "free_fall" | "projectile" | "inclined_plane" | "collision" | "spring"
  | "pendulum" | "circular_motion" | "buoyancy" | "ohms_law" | "coulombs_law"
  | "faraday_law" | "electric_motor" | "ac_generator" | "ideal_gas"
  | "refraction" | "lens_optics" | "transverse_wave" | "doppler_effect" | "unknown";

export interface ExtractedParams {
  motionType: MotionType;
  height: number; mass: number; gravity: number; velocity: number; angle: number;
  friction: number; length: number; k: number;
  voltage: number; resistance: number; current: number; charge: number; charge2: number;
  turns: number; frequency: number; temperature: number; pressure: number;
  focalLength: number; refractiveIndex: number; waveSpeed: number;
}

const SCENE_MAP: Record<string, PhysicsScene> = {
  free_fall: FREE_FALL_SCENE,
  projectile: PROJECTILE_MOTION_SCENE,
  inclined_plane: INCLINED_PLANE_SCENE,
  collision: COLLISION_SCENE,
  spring: SPRING_MASS_SCENE,
  pendulum: PENDULUM_SCENE,
  circular_motion: CIRCULAR_MOTION_SCENE,
  buoyancy: BUOYANCY_SCENE,
  ohms_law: OHMS_LAW_SCENE,
  coulombs_law: COULOMB_SCENE,
  faraday_law: FARADAY_SCENE,
  electric_motor: MOTOR_SCENE,
  ac_generator: AC_GENERATOR_SCENE,
  ideal_gas: IDEAL_GAS_SCENE,
  refraction: REFRACTION_SCENE,
  lens_optics: LENS_OPTICS_SCENE,
  transverse_wave: WAVE_SCENE,
  doppler_effect: DOPPLER_SCENE,
};

// Chinese keyword constants (literal UTF-8; see locale convention note in AGENT_HANDOFF)
const CH = {
  meter: "米", kg: "千克", height: "高度", mass: "质量", gravity: "重力加速度",
  velocity: "初速度", angle: "角度", length: "长度", friction: "摩擦系数",
  spring: "弹簧", freefall: "自由落体", drop: "下落", release: "释放",
  projectile: "抛体运动", horizontal: "平抛", oblique: "斜抛", incline: "斜面",
  block: "滑块", slide: "滑下", collision: "碰撞", elastic: "弹性", pendulum: "单摆",
  swing: "摆动", oscillation: "振动", hooke: "胡克", degree: "°",
  // v3.0 additions
  ohm: "欧姆", voltage: "电压", resistance: "电阻", current: "电流",
  charge: "电荷", pointCharge: "点电荷", coulomb: "库仑", turns: "匝数",
  coil: "线圈", induction: "电磁感应", flux: "磁通", motor: "电动机",
  generator: "发电机", idealGas: "理想气体", temperature: "温度", pressure: "压强",
  piston: "活塞", cylinder: "气缸", refraction: "折射", refractiveIndex: "折射率",
  incidentAngle: "入射角", lens: "透镜", convexLens: "凸透镜", focalLength: "焦距",
  transverseWave: "横波", mechanicalWave: "机械波", wavelength: "波长", waveSpeed: "波速",
  soundSpeed: "声速", frequency: "频率", doppler: "多普勒", circularMotion: "圆周运动",
  uniformCircular: "匀速圆周", buoyancy: "浮力", float: "漂浮", density: "密度",
  springConstant: "劲度系数", dynamicFriction: "动摩擦因数", speedUnit: "米/秒",
  cmUnit: "厘米", kelvin: "开尔文", pressurePa: "帕", pressureAtm: "大气压",
};

function detectMotion(text: string): MotionType {
  // Most specific / domain-specific patterns first to avoid keyword shadowing.
  const patterns: [MotionType, RegExp[]][] = [
    ["ac_generator", [
      /ac\s*generator|alternating\s*current\s*generator|交流发电|发电机|交流电/i,
    ]],
    ["electric_motor", [
      /electric\s*motor|dc\s*motor|直流电动|电动机|电机|commutator|换向器|motor/i,
    ]],
    ["faraday_law", [
      /faraday|法拉第|电磁感应|感应电动势|magnetic\s*flux|磁通/i,
    ]],
    ["ohms_law", [
      /ohm|欧姆|电压|voltage|电阻|resistor|电流|current/i,
    ]],
    ["coulombs_law", [
      /coulomb|库仑|point\s*charge|点电荷|静电力|electric\s*force|电荷/i,
    ]],
    ["ideal_gas", [
      /ideal\s*gas|理想气体|pV\s*=\s*nRT|isothermal|等温|绝热|气缸|活塞|piston|气体/i,
    ]],
    ["doppler_effect", [
      /doppler|多普勒|approach(?:es|ing)?|reced(?:e|ing)|驶向|驶近|驶离/i,
    ]],
    ["transverse_wave", [
      /transverse\s*wave|横波|机械波|wave\s*speed|波速|波长|wavelength|sound\s*wave/i,
    ]],
    ["lens_optics", [
      /凸透镜|凹透镜|convex\s*lens|concave\s*lens|lens|透镜|焦距|focal\s*length|像距/i,
    ]],
    ["refraction", [
      /refraction|折射|refractive\s*index|折射率|入射角|snell|全反射/i,
    ]],
    ["circular_motion", [
      /circular\s*motion|匀速圆周|圆周运动|centripetal|向心力/i,
    ]],
    ["buoyancy", [
      /buoyancy|buoyant|浮力|漂浮|浮在水面|阿基米德|archimedes|floats?|float|密度|density/i,
    ]],
    ["pendulum", [
      /pendulum|single\s*pendulum|simple\s*pendulum|单摆|摆动/i,
    ]],
    ["spring", [
/spring.?mass|弹簧|振动|SHM|simple\s*harmonic|oscillat|spring|胡克/i,
    ]],
    ["collision", [
      /collision|collide|碰撞|弹性|momentum/i,
    ]],
    ["inclined_plane", [
      /inclined|incline|斜面|滑块|滑下|ramp/i,
    ]],
    ["projectile", [
      /projectile|平抛|斜抛|抛体运动|trajectory|parabolic|parabola/i,
    ]],
    ["free_fall", [
      /free.?fall|自由落体|下落|释放|falling|drop(?:ped)?|falls?\b/i,
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
    voltage: 0, resistance: 0, current: 0, charge: 0, charge2: 0,
    turns: 0, frequency: 0, temperature: 0, pressure: 0,
    focalLength: 0, refractiveIndex: 0, waveSpeed: 0,
  };

  const firstMatch = (patterns: RegExp[]): string | null => {
    for (const re of patterns) {
      const m = text.match(re);
      if (m) return m[1];
    }
    return null;
  };

  // --- height (m-unit pattern must NOT steal m/s speeds) ---
  const height = firstMatch([
    /(\d+(?:\.\d+)?)\s*(?:m|米|meter)(?!\s*[/／])/i,
    /height\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    /h0?\s*[=:]\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.height + "|h)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
    new RegExp("(?:" + CH.drop + "|from)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m|" + CH.meter + ")?", "i"),
  ]);
  if (height) p.height = parseFloat(height);

  // --- mass ---
  const mass = firstMatch([
    /(\d+(?:\.\d+)?)\s*(?:kg|千克|kilogram)/i,
    /mass\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.mass + "|m)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
    /m\s*=\s*(\d+(?:\.\d+)?)\s*(?:kg)?/i,
  ]);
  if (mass) p.mass = parseFloat(mass);

  // --- gravity ---
  const gravity = firstMatch([
    /g\s*(?:取|为|=)\s*(\d+(?:\.\d+)?)/i,
    /gravity\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.gravity + "|g)\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ]);
  if (gravity) p.gravity = parseFloat(gravity);

  // --- velocity (m/s forms first; "=" forms second) ---
  const velocity = firstMatch([
    new RegExp("(?:" + CH.velocity + "|速度|velocity)\\s*(?:of|is|为|是|[=:])?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:m\\s*/\\s*s|" + CH.speedUnit + ")", "i"),
    /(\d+(?:\.\d+)?)\s*m\s*\/\s*s(?:²|2)?/i,
    /v0?\s*=\s*(\d+(?:\.\d+)?)/i,
    /initial\s*velocity\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    /speed\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
  ]);
  if (velocity) p.velocity = parseFloat(velocity);

  // --- angle ---
  const angle = firstMatch([
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:" + CH.degree + "|度|deg|degree)", "i"),
    /angle\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    /(?:倾角|仰角|入射角)\s*(?:为|是)?\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.angle + ")\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ]);
  if (angle) p.angle = parseFloat(angle);

  // --- length ---
  const length = firstMatch([
    /[Ll]\s*=\s*(\d+(?:\.\d+)?)/,
    new RegExp("(?:" + CH.length + "|length)\\s*(?:of|is|[=:])\\s*(\\d+(?:\\.\\d+)?)", "i"),
    new RegExp("摆长\\s*(?:为|是)?\\s*(\\d+(?:\\.\\d+)?)\\s*" + CH.meter + "?", "i"),
  ]);
  if (length) p.length = parseFloat(length);

  // --- friction ---
  const friction = firstMatch([
    /mu\s*=\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.friction + "|" + CH.dynamicFriction + "|friction\\s*coefficient|friction)\\s*(?:为|是|of|[=:])?\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ]);
  if (friction) p.friction = parseFloat(friction);

  // --- spring constant k ---
  const k = firstMatch([
    /[kK]\s*=\s*(\d+(?:\.\d+)?)/,
    /spring\s*constant\s*(?:of|is|[=:])\s*(\d+(?:\.\d+)?)/i,
    new RegExp("(?:" + CH.springConstant + ")\\s*(?:为|是|[=:])?\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ]);
  if (k) p.k = parseFloat(k);

  // --- v3.0: domain parameters ---

  // voltage (V)
  const voltage = firstMatch([
    /(?:voltage|电压)\s*(?:of|across|为|是|[=:])\s*(\d+(?:\.\d+)?)\s*V\b/i,
    /(\d+(?:\.\d+)?)\s*V\b(?!\s*[/／])/i,
  ]);
  if (voltage) p.voltage = parseFloat(voltage);

  // resistance (ohm)
  const resistance = firstMatch([
    /(?:resistance|电阻|阻值)\s*(?:of|为|是|[=:])\s*(\d+(?:\.\d+)?)/i,
    /resistor\s+of\s+(\d+(?:\.\d+)?)\s*(?:ohms?|Ω)/i,
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*(?:Ω|ohm|ohms|欧姆)", "i"),
  ]);
  if (resistance) p.resistance = parseFloat(resistance);

  // current (A)
  const current = firstMatch([
    /(?:current|电流)\s*(?:of|为|是|[=:])\s*(\d+(?:\.\d+)?)\s*A\b/i,
    /(\d+(?:\.\d+)?)\s*A\b/i,
  ]);
  if (current) p.current = parseFloat(current);

  // charge (C / uC) — first and second charge
  const charge = text.match(/(?:q1?|charge|电荷|charges?\s+of)\s*[=:]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:μC|µC|uC|微库|C)?/i);
  if (charge) p.charge = parseFloat(charge[1]);
  const charge2 = text.match(/(?:q2|charge|电荷|charges?\s+of)\s*[=:]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:μC|µC|uC|微库|C)?/i);
  if (charge2) p.charge2 = parseFloat(charge2[1]);

  // turns (coil)
  const turns = firstMatch([
    /(\d+(?:\.\d+)?)\s*(?:turns|匝)\b/i,
    new RegExp("(?:" + CH.turns + ")\\s*(?:为|是|[=:])?\\s*(\\d+(?:\\.\\d+)?)", "i"),
  ]);
  if (turns) p.turns = parseFloat(turns);

  // frequency (Hz)
  const frequency = firstMatch([
    /(?:frequency|频率)\s*(?:of|为|是|[=:])\s*(\d+(?:\.\d+)?)\s*Hz\b/i,
    /\((\d+(?:\.\d+)?)\s*Hz\)/i,
    /(\d+(?:\.\d+)?)\s*Hz\b/i,
  ]);
  if (frequency) p.frequency = parseFloat(frequency);

  // temperature (K)
  const temperature = firstMatch([
    /(?:temperature|温度)\s*(?:of|is|为|是|[=:])\s*(\d+(?:\.\d+)?)\s*K\b/i,
    new RegExp("(\\d+(?:\\.\\d+)?)\\s*K\\b(?![a-zA-Z])", "i"),
  ]);
  if (temperature) p.temperature = parseFloat(temperature);

  // pressure (Pa / atm)
  const pressure = firstMatch([
    new RegExp("(?:" + CH.pressure + "|pressure)\\s*(?:为|是|of|[=:])?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:Pa|" + CH.pressurePa + ")?", "i"),
    /P\s*=\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*atm\b/i,
  ]);
  if (pressure) p.pressure = parseFloat(pressure);

  // focal length (cm / 厘米)
  const focalLength = firstMatch([
    /(?:focal\s*length|焦距)\s*(?:of|为|是|[=:])?\s*(\d+(?:\.\d+)?)/i,
    /f\s*=\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)\b/i,
  ]);
  if (focalLength) p.focalLength = parseFloat(focalLength);

  // refractive index
  const refractiveIndex = firstMatch([
    /(?:refractive\s*index|折射率)\s*(?:of|为|是|[=:])?\s*(\d+(?:\.\d+)?)/i,
  ]);
  if (refractiveIndex) p.refractiveIndex = parseFloat(refractiveIndex);

  // wave speed (m/s with explicit prefix, then generic "at X m/s")
  const waveSpeed = firstMatch([
    new RegExp("(?:" + CH.waveSpeed + "|" + CH.soundSpeed + "|wave\\s*speed|speed\\s*of\\s*sound)\\s*(?:为|是|of|is|[=:])?\\s*(\\d+(?:\\.\\d+)?)\\s*m\\s*/\\s*s", "i"),
    /speed\s+is\s+(\d+(?:\.\d+)?)\s*m\s*\/\s*s/i,
    /at\s+(\d+(?:\.\d+)?)\s*m\s*\/\s*s/i,
  ]);
  if (waveSpeed) p.waveSpeed = parseFloat(waveSpeed);

  return p;
}

/** Apply extracted params to a cloned scene (entities, environment, simulation.params). */
function applyParams(scene: PhysicsScene, p: ExtractedParams, sceneKey: MotionType): void {
  const primaryEntity = scene.entities.find((e) => (e.properties as { mass?: number })?.mass && (e.properties as { mass?: number })?.mass! > 0);

  // Height (free fall) / velocity decomposition (projectile) on the primary entity
  if (primaryEntity) {
    if (sceneKey === "free_fall" && primaryEntity.position) {
      primaryEntity.position[1] = p.height;
    }
    if (sceneKey === "projectile" && primaryEntity.initial_conditions?.velocity) {
      const rad = (p.angle * Math.PI) / 180;
      primaryEntity.initial_conditions.velocity[0] = p.velocity * Math.cos(rad);
      primaryEntity.initial_conditions.velocity[1] = p.velocity * Math.sin(rad);
    }
    // Motion types where a scalar initial speed is meaningful
    if (["collision", "doppler_effect", "circular_motion"].includes(sceneKey) && p.velocity !== 0) {
      primaryEntity.initial_conditions = {
        ...(primaryEntity.initial_conditions ?? {}),
        velocity: [p.velocity, 0, 0],
      };
    }
    // Mass on all entities with mass > 0
    for (const entity of scene.entities) {
      if (entity.properties && typeof entity.properties.mass === "number" && entity.properties.mass > 0) {
        entity.properties.mass = p.mass;
      }
    }
  }

  // Gravity field
  const gravEnv = scene.environment.find((e): e is Environment & { type: "gravity_field" } => e.type === "gravity_field");
  if (gravEnv) gravEnv.properties.acceleration = p.gravity;

  // Incline plane environment
  const inclineEnv = scene.environment.find((e): e is Environment & { type: "incline_plane" } => e.type === "incline_plane");
  if (inclineEnv) {
    if (p.angle !== 0) inclineEnv.properties.angle = p.angle;
    if (p.friction !== 0) inclineEnv.properties.friction_coefficient = p.friction;
    if (p.length !== 0) inclineEnv.properties.length = p.length;
  }

  // Pendulum string length (constraint property)
  if (sceneKey === "pendulum" && p.length !== 0) {
    const c = scene.constraints.find((c) => c.properties && typeof (c.properties as { length?: number }).length === "number");
    if (c) (c.properties as { length: number }).length = p.length;
  }

  // simulation.params merge (only keys the scene actually declares)
  const sim = (scene as unknown as { simulation?: { params?: Record<string, number> } }).simulation;
  if (sim?.params) {
    const set = (key: string, value: number) => {
      if (value !== 0 && isFinite(value) && key in sim.params!) sim.params![key] = value;
    };
    switch (sceneKey) {
      case "free_fall": set("h0", p.height); set("g", p.gravity); set("m", p.mass); break;
      case "projectile": set("v0", p.velocity); set("angle", p.angle); set("h0", p.height); set("g", p.gravity); set("m", p.mass); break;
      case "inclined_plane": set("L", p.length); set("angle", p.angle); set("mu", p.friction); set("g", p.gravity); set("m", p.mass); break;
      case "collision": set("m1", p.mass); set("v1", p.velocity); set("g", p.gravity); break;
      case "spring": set("k", p.k); set("m", p.mass); set("g", p.gravity); break;
      case "pendulum": set("L", p.length); set("g", p.gravity); set("m", p.mass); break;
      case "circular_motion": set("m", p.mass); break;
      case "ohms_law": set("V", p.voltage); set("R", p.resistance); set("I", p.current); break;
      case "coulombs_law": set("q1", p.charge); set("q2", p.charge2); set("m", p.mass); break;
      case "faraday_law": set("N", p.turns); break;
      case "electric_motor": set("N", p.turns); set("I", p.current); set("friction", p.friction); break;
      case "ac_generator": set("N", p.turns); break;
      case "ideal_gas": set("T", p.temperature); set("P", p.pressure); break;
      case "refraction": set("theta1_deg", p.angle); set("n2", p.refractiveIndex); break;
      case "lens_optics": set("f", p.focalLength); break;
      case "transverse_wave": set("v", p.waveSpeed); set("f", p.frequency); break; // sim.k is the wave number, not a spring constant — do not touch
      case "doppler_effect": set("f0", p.frequency); set("vs", p.velocity); set("v_sound", p.waveSpeed); break;
      default: break;
    }
  }
}

function buildScene(params: ExtractedParams, text: string): PhysicsScene {
  const sceneKey = params.motionType === "unknown" ? "free_fall" : params.motionType;
  const template = SCENE_MAP[sceneKey] || FREE_FALL_SCENE;
  const scene = JSON.parse(JSON.stringify(template)) as PhysicsScene;

  // Store user's problem in metadata description
  scene.metadata.description = text;


  // S77 方案a: Chinese problems -> Chinese teaching text (治本)
  if (isChinese(text)) localizeScene(scene);
  applyParams(scene, params, sceneKey);


  // S74: attach generated teaching hints (explicit overlay_hints wins)
  ensureTeachingScript(scene);
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


