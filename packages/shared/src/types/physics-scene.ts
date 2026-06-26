// ============================================================
// PhysicsScene v2.0 — TypeScript 权威类型定义
// 所有模块引用此文件作为唯一类型来源
// ============================================================

// ---- Meta ----

export interface PhysicsSceneMeta {
  title: string;
  description?: string;
  subject: "mechanics" | "electromagnetism" | "optics" | "thermodynamics" | "waves" | "modern";
  topic?: string;
  difficulty?: "easy" | "medium" | "hard" | "olympiad";
  grade?: "junior_high" | "senior_high" | "college";
  sourceExerciseId?: string;
  generatedBy?: string;
  generatedAt?: string;
  tags?: string[];
}

// ---- Entities ----

export type EntityType = "ball" | "block" | "pendulum" | "spring" | "charge" | "conductor_rod" | "light_ray" | "piston";

export interface BaseEntity {
  id: string;
  type: EntityType;
  name?: string;
  label?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  properties: Record<string, unknown>;
  initial_conditions?: Record<string, unknown>;
  visual?: Record<string, unknown>;
  constraints_refs?: string[];
}

export interface BallEntity extends BaseEntity {
  type: "ball";
  properties: {
    mass: number;
    radius: number;
    charge?: number;
    restitution?: number;
  };
  initial_conditions?: {
    velocity?: [number, number, number];
    angular_velocity?: [number, number, number];
  };
  visual?: {
    color?: string;
    material?: "standard" | "metal" | "glass" | "rubber";
    show_trail?: boolean;
    trail_color?: string;
    trail_max_points?: number;
  };
}

export interface BlockEntity extends BaseEntity {
  type: "block";
  properties: {
    mass: number;
    dimensions: [number, number, number];
    friction_coefficient?: number;
    charge?: number;
    is_static?: boolean;
  };
  initial_conditions?: {
    velocity?: [number, number, number];
  };
  visual?: {
    color?: string;
    wireframe?: boolean;
  };
}

export type Entity = BallEntity | BlockEntity;

// ---- Environment ----

export type EnvironmentType = "gravity_field" | "incline_plane";

export interface GravityField {
  type: "gravity_field";
  properties: {
    acceleration: number;
    direction: [number, number, number];
  };
}

export interface InclinePlane {
  type: "incline_plane";
  properties: {
    angle: number;
    length: number;
    width: number;
    friction_coefficient: number;
    position: [number, number, number];
    direction: "left" | "right";
  };
}

export type Environment = GravityField | InclinePlane;

// ---- Forces ----

export type ForceType = "gravity" | "normal" | "friction" | "tension" | "spring_force"
  | "applied_force" | "drag_force" | "centripetal_force";

export interface Force {
  id: string;
  type: ForceType;
  target_entity: string;
  magnitude: number | string;
  direction: [number, number, number] | string;
  is_constant?: boolean;
  description?: string;
  visual?: {
    color?: string;
    arrow_scale?: number;
    label?: string;
  };
}

// ---- Constraints ----

export type ConstraintType = "contact" | "fixed_point" | "sliding";

export interface Constraint {
  id: string;
  type: ConstraintType;
  entities: string[];
  description?: string;
  properties?: Record<string, unknown>;
}

// ---- Equations ----

export type EquationType = "motion" | "force" | "energy" | "momentum" | "target";

export interface Equation {
  id: string;
  name: string;
  expression: string;
  variables: Record<string, { symbol: string; unit: string; description: string }>;
  derivation?: string[];
  type: EquationType;
  is_solution?: boolean;
}

// ---- Timeline ----

export type TimelineEventType = "keyframe" | "collision" | "state_change"
  | "marker" | "phase_start" | "phase_end";

export interface TimelineEvent {
  id: string;
  time: number;
  type: TimelineEventType;
  target?: string;
  data: Record<string, unknown>;
  description?: string;
}

export interface Timeline {
  total_duration: number;
  fps?: number;
  time_scale?: number;
  events: TimelineEvent[];
}

// ---- Camera Script ----

export type EasingType = "linear" | "ease_in" | "ease_out" | "ease_in_out" | "smooth";

export interface CameraScriptItem {
  id: string;
  time: number;
  duration?: number;
  easing?: EasingType;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  description?: string;
}

// ---- UI Controls ----

export type UIControlType = "slider" | "number_input" | "toggle";

export interface UIControl {
  id: string;
  parameter: string;
  type: UIControlType;
  label: string;
  default_value: number | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  group?: string;
}

// ---- Knowledge Tags ----

export interface KnowledgeTag {
  id: string;
  name: string;
  category: string;
  level: number;
  importance?: number;
  prerequisites?: string[];
  common_mistakes?: string[];
  learning_tips?: string;
}

// ---- PhysicsScene (顶层) ----

export interface PhysicsScene {
  $schema: string;
  version: "2.0";
  metadata: PhysicsSceneMeta;
  entities: Entity[];
  environment: Environment[];
  forces: Force[];
  constraints: Constraint[];
  equations: Equation[];
  timeline: Timeline;
  camera_script: CameraScriptItem[];
  ui_controls: UIControl[];
  knowledge_tags: KnowledgeTag[];
}
