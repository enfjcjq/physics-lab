// ============================================================
// PhysicsScene v2.1 -- TypeScript authoritative type definitions
// ALL modules read from this as the single source of truth.
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

/** A phase is a continuous segment of the timeline. */
export interface TimelinePhase {
  id: string;
  label: string;            // i18n key
  icon: string;
  timeRange: [number, number];
  color?: string;
  description?: string;
  cameraPresetId?: string;
}

export interface Timeline {
  total_duration: number;
  fps?: number;
  time_scale?: number;
  events: TimelineEvent[];
  /** v2.1: phases for Timeline display */
  phases?: TimelinePhase[];
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

// ============================================================
// v2.1: Teacher & Charts - data-driven teaching and visualization
// ============================================================

/** One teaching step in the pedagogical flow */
export interface TeacherStep {
  id: string;
  /** Order in the sequence */
  order: number;
  /** i18n key for the title */
  titleKey: string;
  /** i18n key for the description */
  descKey: string;
  /** Optional i18n key for a formula */
  formulaKey?: string;
  /** Time in the experiment when this step becomes active */
  timeStart: number;
}

/** Chart definition */
export type ChartType = "position_time" | "velocity_time" | "acceleration_time"
  | "kinetic_energy" | "potential_energy" | "mechanical_energy" | "momentum";

export interface ChartDef {
  id: string;
  type: ChartType;
  label: string;            // i18n key or display label
  xAxis: { label: string; unit: string; key: string };
  yAxis: { label: string; unit: string; key: string };
  color?: string;
}

// ---- PhysicsScene (top level) ----

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
  /** v2.1: teaching steps */
  teacher_steps?: TeacherStep[];
  /** v2.1: chart definitions */
  charts?: ChartDef[];
}
