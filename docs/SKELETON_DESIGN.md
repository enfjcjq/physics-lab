# Physics Lab MVP — 项目骨架设计

## 文档信息

| 项目 | 内容 |
|------|------|
| 阶段 | Phase 1 MVP |
| 范围 | 自由落体题目 → PhysicsScene → 可交互3D实验 |
| 版本 | v0.1.0 |
| 日期 | 2026-06-24 |

---

## 1. Monorepo 目录结构

```
physics-lab/
├── package.json                    # 根 package.json (pnpm workspace)
├── pnpm-workspace.yaml             # pnpm workspace 配置
├── turbo.json                      # Turborepo 流水线
├── tsconfig.base.json              # 共享 TypeScript 基础配置
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
│
├── apps/
│   └── desktop/                    # Electron 桌面应用
│       ├── package.json
│       ├── tsconfig.json
│       ├── electron-builder.yml    # 打包配置
│       ├── vite.config.ts          # Vite 构建配置
│       ├── index.html              # HTML 入口
│       │
│       ├── src/
│       │   ├── main/               # Electron 主进程
│       │   │   ├── index.ts        # 主进程入口
│       │   │   ├── window.ts       # 窗口管理
│       │   │   ├── ipc/            # IPC 路由
│       │   │   │   ├── index.ts    # 路由注册
│       │   │   │   ├── exercise.ts # 题目相关IPC
│       │   │   │   └── analysis.ts # 解析相关IPC
│       │   │   └── services/       # 主进程服务
│       │   │       ├── ollama.ts   # Ollama API 封装
│       │   │       └── storage.ts  # 本地存储 (JSON文件)
│       │   │
│       │   ├── preload/            # Preload 脚本
│       │   │   └── index.ts        # contextBridge 暴露 API
│       │   │
│       │   └── renderer/           # React 渲染进程
│       │       ├── main.tsx        # React 入口
│       │       ├── App.tsx         # 根组件 + 路由
│       │       ├── index.css       # Tailwind + 全局样式
│       │       │
│       │       ├── components/     # 通用UI组件
│       │       │   ├── ui/         # 基础UI (Button, Input, Slider...)
│       │       │   └── layout/     # 布局组件 (Sidebar, MainArea...)
│       │       │
│       │       ├── features/       # 业务功能模块 (MVP只有2个)
│       │       │   ├── problem-input/
│       │       │   │   ├── ProblemInput.tsx        # 题目输入主组件
│       │       │   │   └── ProblemInput.store.ts   # Zustand store
│       │       │   │
│       │       │   └── experiment/
│       │       │       ├── ExperimentView.tsx       # 实验主视图
│       │       │       ├── components/
│       │       │       │   ├── Scene3D.tsx          # Three.js 场景
│       │       │       │   ├── ControlPanel.tsx     # 参数调节面板
│       │       │       │   ├── DataPanel.tsx        # 数据曲线面板
│       │       │       │   ├── SolutionPanel.tsx    # 解题步骤面板
│       │       │       │   └── StatusBar.tsx        # 底部状态栏
│       │       │       └── experiment.store.ts      # 实验状态 store
│       │       │
│       │       ├── hooks/          # 通用 hooks
│       │       │   ├── useIPC.ts   # IPC 通信 hook
│       │       │   └── useAnimationLoop.ts  # requestAnimationFrame 封装
│       │       │
│       │       └── lib/            # 工具函数
│       │           ├── physics-scene.types.ts  # PhysicsScene 类型定义
│       │           └── sample-scenes.ts        # 自由落体示例数据
│       │
│       └── resources/              # Electron 资源
│           └── icon.png
│
├── packages/
│   └── shared/                     # 共享类型和工具 (为未来多app准备)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   └── physics-scene.ts  # PhysicsScene 权威类型定义
│           └── constants/
│               └── free-fall-scene.ts # 自由落体 PhysicsScene 示例
│
├── docs/                           # 设计文档
│   ├── PRODUCT_VISION.md.txt
│   ├── ARCHITECTURE.md.txt
│   ├── ROADMAP.md.txt
│   ├── REQUIREMENTS.md.txt
│   ├── PHYSICS_ENGINE.md.txt
│   ├── MVP_SCOPE.md.txt
│   ├── PRD.md
│   ├── DATABASE.md
│   ├── API_SPEC.md
│   ├── PHYSICSSCENE_SCHEMA.md
│   ├── MVP_TASKS.md
│   └── SKELETON_DESIGN.md          # 本文件
│
├── assets/                         # 静态资源
│   └── models/                     # 3D 模型 (glTF/glb)
│
└── scripts/                        # 开发脚本
    └── dev.mjs                     # 统一启动脚本
```

---

## 2. Electron 项目初始化方案

### 2.1 根目录配置

**`package.json`**
```json
{
  "name": "physics-lab",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.x",
    "typescript": "^5.x",
    "prettier": "^3.x",
    "eslint": "^8.x"
  }
}
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`turbo.json`**
```json
{
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "clean": { "cache": false }
  }
}
```

**`tsconfig.base.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### 2.2 Electron 应用配置

**`apps/desktop/package.json`** (关键依赖)
```json
{
  "name": "@physics-lab/desktop",
  "private": true,
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "package": "electron-builder"
  },
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "three": "^0.170.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "zustand": "^4.x",
    "echarts": "^5.x",
    "echarts-for-react": "^3.x",
    "katex": "^0.16.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@types/three": "^0.170.x",
    "@vitejs/plugin-react": "^4.x",
    "electron": "^31.x",
    "electron-builder": "^24.x",
    "vite": "^5.x",
    "vite-plugin-electron": "^0.28.x",
    "vite-plugin-electron-renderer": "^0.14.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

**`apps/desktop/vite.config.ts`**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  plugins: [
    react(),
    electron([
      { entry: "src/main/index.ts" },
      { entry: "src/preload/index.ts", onstart(args) { args.reload(); } },
    ]),
    renderer(),
  ],
});
```

**`apps/desktop/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/*"],
      "@shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src/**/*", "../../packages/shared/src/**/*"]
}
```

### 2.3 主进程骨架

**`apps/desktop/src/main/index.ts`**
- 创建 BrowserWindow (1280×800)
- 注册所有 IPC handler
- 启动时检测 Ollama 服务状态
- 窗口关闭时隐藏到托盘

**`apps/desktop/src/main/window.ts`**
- 窗口创建工厂函数
- 开发/生产环境区分加载
- 窗口尺寸记忆与恢复

**`apps/desktop/src/main/ipc/index.ts`**
- 自动扫描 `./ipc/` 目录下所有 handler
- 统一注册到 `ipcMain.handle()`
- 统一错误捕获与格式化

### 2.4 Preload 脚本骨架

**`apps/desktop/src/preload/index.ts`**
```ts
import { contextBridge, ipcRenderer } from "electron";

// 暴露给渲染进程的安全 API
contextBridge.exposeInMainWorld("physicsLab", {
  // 题目相关
  exercise: {
    parse: (text: string) => ipcRenderer.invoke("exercise:parse", text),
  },
  // 解析相关
  analysis: {
    getScene: (id: string) => ipcRenderer.invoke("analysis:getScene", id),
    onProgress: (cb: (data: any) => void) => {
      ipcRenderer.on("analysis:progress", (_e, data) => cb(data));
    },
  },
  // AI 状态
  ai: {
    getStatus: () => ipcRenderer.invoke("ai:status"),
  },
  // 平台信息
  platform: process.platform,
});
```

---

## 3. React 项目结构

### 3.1 路由设计 (仅2个页面)

```
/                 → ProblemInput  (题目输入页)
/experiment       → ExperimentView (实验页)
```

无 React Router — 用 Zustand 状态驱动页面切换（MVP极简）。

### 3.2 组件树

```
App
├── Sidebar
│   ├── Logo
│   └── NavItems (仅"实验")
│
└── MainArea
    ├── [route=input] ProblemInput
    │   ├── TextArea (题目文字输入)
    │   ├── ModelStatusBadge (AI状态指示灯)
    │   └── SubmitButton (开始解析)
    │
    └── [route=experiment] ExperimentView
        ├── Toolbar
        │   ├── PlayPauseButton
        │   ├── ResetButton
        │   ├── SpeedControl (0.5x/1x/2x)
        │   └── ThemeToggle
        ├── Scene3D (Three.js)
        │   ├── CoordinateAxes
        │   ├── Ground Plane
        │   ├── Ball (mesh + trail)
        │   ├── ForceArrows
        │   └── CameraControls (OrbitControls)
        ├── ControlPanel (右侧面板)
        │   ├── Slider: 初始高度
        │   ├── Slider: 质量
        │   └── Slider: 重力加速度
        ├── DataPanel (底部可折叠)
        │   ├── Chart: v-t 图
        │   ├── Chart: s-t 图
        │   └── Chart: 能量图
        └── SolutionPanel (底部可折叠)
            ├── StepList (解题步骤)
            └── FinalAnswer (答案 + LaTeX 公式)
```

### 3.3 Zustand Store 设计

**`problemInput.store.ts`**
```ts
interface ProblemInputState {
  text: string;              // 题目文字
  status: "idle" | "parsing" | "done" | "error";
  progressMessage: string;   // "正在进行实体识别..."
  progressPercent: number;   // 0-100
  result: {
    sceneJSON: string;       // PhysicsScene JSON
    solution: string;        // 解题步骤 Markdown
  } | null;
  error: string | null;
}
```

**`experiment.store.ts`**
```ts
interface ExperimentState {
  // 从 PhysicsScene 加载的原始数据
  scene: PhysicsScene | null;

  // 用户可调的参数
  params: {
    mass: number;            // 质量 (kg)
    height: number;          // 初始高度 (m)
    gravity: number;         // 重力加速度 (m/s²)
  };

  // 播放控制
  playing: boolean;
  timeScale: number;         // 0.5 | 1 | 2
  currentTime: number;       // 当前模拟时间 (s)

  // 实时数据 (每帧更新)
  liveData: {
    position: [number, number, number];
    velocity: [number, number, number];
    kineticEnergy: number;
    potentialEnergy: number;
  };

  // 轨迹记录
  trailPoints: Array<{ time: number; y: number; vy: number }>;
}
```

### 3.4 数据流

```
用户输入题目文字
       │
       ▼
ProblemInput ──IPC──▶ Main Process (Ollama API)
       │                     │
       │  progress event ◀───┘
       │                     │
       ▼                     ▼
  physicsScene JSON    solution Markdown
       │                     │
       ▼                     ▼
ExperimentView ◀─────────────┘
       │
       ├──▶ Scene3D      (渲染小球+地面+轨迹)
       ├──▶ ControlPanel (修改 params → 实时重新计算)
       ├──▶ DataPanel    (echarts 渲染曲线)
       └──▶ SolutionPanel (渲染解题步骤)
```

### 3.5 关键样式约定

- TailwindCSS `darkMode: "class"` 支持暗色/亮色
- 主色调: `sky` (蓝色系)
- 字体: 系统默认中文字体
- 代码/公式: `JetBrains Mono` + KaTeX
- 3D 场景背景: 渐变深色 (#0f172a → #1e1b4b)

---

## 4. PhysicsScene TypeScript 类型定义

**`packages/shared/src/types/physics-scene.ts`** (权威来源)

```ts
// ============================================================
// PhysicsScene v2.0 TypeScript 类型定义
// 所有模块必须引用此文件作为唯一类型来源
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

export type EntityType = "ball" | "block" | "pendulum" | "spring" | "charge"
  | "conductor_rod" | "light_ray" | "piston";

export interface Vec3 {
  x: number; y: number; z: number;
}
// 在JSON中序列化为 [x, y, z]，但在TS层转为对象使用

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

// MVP 阶段只实现 BallEntity 和 BlockEntity
// 其余类型按需在后续迭代中添加

export type Entity = BallEntity | BlockEntity;

// ---- Environment ----

export type EnvironmentType = "gravity_field" | "incline_plane" | "electric_field"
  | "magnetic_field" | "rail" | "lens" | "container";

export interface GravityField {
  type: "gravity_field";
  properties: {
    acceleration: number;      // m/s²
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
    static_friction_coefficient?: number;
    position: [number, number, number];
    direction: "left" | "right";
  };
}

export type Environment = GravityField | InclinePlane;

// ---- Forces ----

export type ForceType = "gravity" | "normal" | "friction" | "tension"
  | "spring_force" | "buoyancy" | "electric_force" | "lorentz_force"
  | "magnetic_force" | "applied_force" | "drag_force" | "centripetal_force";

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

export type ConstraintType = "distance" | "fixed_point" | "fixed_axis"
  | "sliding" | "contact" | "pulley" | "rigid_body" | "periodic_boundary";

export interface Constraint {
  id: string;
  type: ConstraintType;
  entities: string[];
  description?: string;
  properties?: Record<string, unknown>;
}

// ---- Equations ----

export type EquationType = "motion" | "force" | "energy" | "momentum"
  | "electromagnetic" | "wave" | "optical" | "thermal" | "target";

export interface Equation {
  id: string;
  name: string;
  expression: string;          // LaTeX
  variables: Record<string, {
    symbol: string;
    unit: string;
    description: string;
  }>;
  derivation?: string[];
  type: EquationType;
  is_solution?: boolean;
}

// ---- Timeline ----

export type TimelineEventType = "keyframe" | "collision" | "state_change"
  | "force_change" | "trigger" | "marker" | "phase_start" | "phase_end";

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

export type UIControlType = "slider" | "number_input" | "toggle" | "select" | "angle" | "vector3";

export interface UIControl {
  id: string;
  parameter: string;           // 路径，如 "entities[0].properties.mass"
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
```

---

## 5. 自由落体 PhysicsScene 示例

**`packages/shared/src/constants/free-fall-scene.ts`**

```ts
import type { PhysicsScene } from "../types/physics-scene";

export const FREE_FALL_SCENE: PhysicsScene = {
  $schema: "https://physics-lab.app/schemas/physics-scene/2.0.json",
  version: "2.0",
  metadata: {
    title: "自由落体运动",
    description: "小球从高处自由落下，忽略空气阻力",
    subject: "mechanics",
    topic: "free_fall",
    difficulty: "easy",
    grade: "senior_high",
    tags: ["自由落体", "匀变速运动", "能量守恒"],
  },
  entities: [
    {
      id: "ball_1",
      type: "ball",
      name: "小球",
      position: [0, 10, 0],
      properties: {
        mass: 2.0,
        radius: 0.15,
        restitution: 0.6,
      },
      initial_conditions: {
        velocity: [0, 0, 0],
      },
      visual: {
        color: "#FF6B6B",
        material: "metal",
        show_trail: true,
        trail_color: "#FF6B6B44",
        trail_max_points: 500,
      },
    },
    {
      id: "ground",
      type: "block",
      name: "地面",
      position: [0, -0.1, 0],
      scale: [10, 0.2, 10],
      properties: {
        mass: 0,
        dimensions: [10, 0.2, 10],
        is_static: true,
        friction_coefficient: 0.5,
      },
      visual: {
        color: "#334155",
      },
    },
  ],
  environment: [
    {
      type: "gravity_field",
      properties: {
        acceleration: 9.8,
        direction: [0, -1, 0],
      },
    },
  ],
  forces: [
    {
      id: "gravity_ball_1",
      type: "gravity",
      target_entity: "ball_1",
      magnitude: "mass * g",
      direction: [0, -1, 0],
      is_constant: true,
      description: "重力",
      visual: {
        color: "#EF4444",
        arrow_scale: 0.3,
        label: "G",
      },
    },
  ],
  constraints: [
    {
      id: "ground_collision",
      type: "contact",
      entities: ["ball_1", "ground"],
      properties: {
        restitution: 0.6,
        friction: 0.5,
      },
      description: "地面碰撞检测",
    },
  ],
  equations: [
    {
      id: "eq_motion",
      name: "运动方程",
      expression: "y(t) = h_0 - \\frac{1}{2}gt^2",
      variables: {
        h_0: { symbol: "h₀", unit: "m", description: "初始高度" },
        g: { symbol: "g", unit: "m/s²", description: "重力加速度" },
        t: { symbol: "t", unit: "s", description: "时间" },
      },
      type: "motion",
    },
    {
      id: "eq_velocity",
      name: "落地速度",
      expression: "v = \\sqrt{2gh} \\approx 14\\,\\text{m/s}",
      variables: {},
      type: "target",
      is_solution: true,
    },
  ],
  timeline: {
    total_duration: 4.0,
    fps: 60,
    events: [
      {
        id: "start",
        time: 0.0,
        type: "phase_start",
        data: { label: "释放小球" },
        description: "小球从10m高处自由下落",
      },
      {
        id: "impact",
        time: 1.43,
        type: "collision",
        target: "ball_1",
        data: {
          collision_with: "ground",
          impact_velocity: 14.0,
        },
        description: "小球触地",
      },
    ],
  },
  camera_script: [
    {
      id: "overview",
      time: 0.0,
      position: [8, 6, 8],
      target: [0, 5, 0],
      fov: 60,
      description: "全景视角",
    },
    {
      id: "follow",
      time: 0.3,
      duration: 1.0,
      easing: "ease_in_out",
      position: [4, 6, 4],
      target: [0, 5, 0],
      fov: 50,
      description: "跟随小球",
    },
  ],
  ui_controls: [
    {
      id: "ctrl_mass",
      parameter: "entities[0].properties.mass",
      type: "slider",
      label: "质量",
      default_value: 2.0,
      min: 0.1,
      max: 10.0,
      step: 0.1,
      unit: "kg",
      group: "物理参数",
    },
    {
      id: "ctrl_gravity",
      parameter: "environment[0].properties.acceleration",
      type: "slider",
      label: "重力加速度",
      default_value: 9.8,
      min: 0.1,
      max: 20.0,
      step: 0.5,
      unit: "m/s²",
      group: "物理参数",
    },
    {
      id: "ctrl_height",
      parameter: "entities[0].position[1]",
      type: "slider",
      label: "初始高度",
      default_value: 10.0,
      min: 1.0,
      max: 50.0,
      step: 0.5,
      unit: "m",
      group: "初始条件",
    },
  ],
  knowledge_tags: [
    {
      id: "kp_free_fall",
      name: "自由落体运动",
      category: "mechanics",
      level: 2,
      importance: 1.0,
      common_mistakes: [
        "忽略自由落体初速度为零的条件",
        "混淆位移与路程",
      ],
    },
  ],
};
```

---

## 6. MVP 开发顺序

### 总览：5个阶段，预计2~3周

```
Stage 0 ──▶ Stage 1 ──▶ Stage 2 ──▶ Stage 3 ──▶ Stage 4
 基础       AI+数据      3D渲染      交互面板     打磨
 2天        3天          4天         3天         2天
```

### Stage 0: 项目脚手架 (2天)

该阶段只有脚手架搭建，代码量极少，主要是配置文件。

| # | 任务 | 产出物 | 估时 |
|---|------|--------|------|
| 0.1 | 初始化 Monorepo | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore` | 1h |
| 0.2 | 初始化 `packages/shared` | `tsconfig.json`, 空 `src/index.ts` | 0.5h |
| 0.3 | 初始化 `apps/desktop` 骨架 | `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` | 1h |
| 0.4 | 主进程最小实现 | `src/main/index.ts` (打开窗口), `src/preload/index.ts` (空壳) | 1h |
| 0.5 | React 渲染进程最小实现 | `src/renderer/main.tsx`, `App.tsx` (显示 "Hello Physics Lab") | 0.5h |
| 0.6 | TailwindCSS 配置 | `tailwind.config.js`, `postcss.config.js`, `index.css` | 0.5h |
| 0.7 | 验证 `pnpm dev` 能启动 Electron 窗口 | 窗口正常显示 | 0.5h |

**Stage 0 产出**: Electron 窗口运行，显示空白 React 页面。

### Stage 1: 类型定义 + 示例数据 + AI调用 (3天)

| # | 任务 | 产出物 | 估时 |
|---|------|--------|------|
| 1.1 | 定义 PhysicsScene TypeScript 类型 | `packages/shared/src/types/physics-scene.ts` (按本文4章节) | 2h |
| 1.2 | 编写自由落体 PhysicsScene 示例 | `packages/shared/src/constants/free-fall-scene.ts` (按本文5章节) | 1h |
| 1.3 | 实现 Ollama 服务封装 | `src/main/services/ollama.ts` (检测状态、调用API) | 3h |
| 1.4 | 实现 exercise IPC handler | `src/main/ipc/exercise.ts` (接收文字 → 构造Prompt → 调用Ollama → 返回JSON) | 3h |
| 1.5 | 实现 Prompt 模板 | 硬编码在 `exercise.ts` 中，指示AI输出 PhysicsScene JSON | 2h |
| 1.6 | 实现 Preload API 暴露 | `src/preload/index.ts` → `window.physicsLab.exercise.parse()` | 1h |
| 1.7 | 实现前端 IPC hook | `src/renderer/hooks/useIPC.ts` | 1h |
| 1.8 | 端到端验证 | 前端输入文字 → 主进程调用Ollama → 返回PhysicsScene JSON | 2h |

**Stage 1 产出**: 能从文字输入得到 PhysicsScene JSON（或用本地示例数据兜底）。

### Stage 2: 3D 渲染 (4天)

该阶段是MVP核心，代码量最大。

| # | 任务 | 产出物 | 估时 |
|---|------|--------|------|
| 2.1 | 初始化 Three.js 场景 | `Scene3D.tsx` (Canvas + 灯光 + 背景) | 1h |
| 2.2 | 实现三维坐标系 | `CoordinateAxes` 组件 (X红/Y绿/Z蓝 + 刻度) | 2h |
| 2.3 | 实现静态地面 | `Ground` mesh (plane geometry + 颜色) | 0.5h |
| 2.4 | 实现小球渲染 | `Ball` mesh (sphere geometry + 材质 + 颜色) | 1h |
| 2.5 | 实现 OrbitControls | 旋转/缩放/平移 | 1h |
| 2.6 | 实现自由落体物理计算 | 核心算法: `y(t) = h0 - 0.5*g*t²`, `v(t) = -g*t` | 2h |
| 2.7 | 实现动画循环 | `useAnimationLoop` → 每帧更新小球位置 → requestAnimationFrame | 2h |
| 2.8 | 实现运动轨迹拖尾 | Line geometry 动态追加顶点 | 2h |
| 2.9 | 实现受力箭头 | `ForceArrows` (Arrow geometry，显示重力G) | 2h |
| 2.10 | 实现播放/暂停/重置 | 工具栏按钮，控制动画循环 | 1h |

**Stage 2 产出**: 自由落体小球在3D场景中运动，可旋转视角，有轨迹和受力箭头。

### Stage 3: 交互面板 (3天)

| # | 任务 | 产出物 | 估时 |
|---|------|--------|------|
| 3.1 | 实现 ExperimentView 布局 | 主区域3D + 右侧面板 + 底部面板的三栏布局 | 1.5h |
| 3.2 | 实现参数调节滑块 | `ControlPanel` 组件 (高度/质量/g滑块，修改 Zustand store) | 2h |
| 3.3 | 实现参数热更新 | 滑块变化 → store 更新 → 物理计算重新初始化 → 3D即时响应 | 2h |
| 3.4 | 实现数据图表面板 | `DataPanel` 组件 (v-t图、s-t图，用 ECharts) | 4h |
| 3.5 | 实现解题步骤面板 | `SolutionPanel` 组件 (渲染 PhysicsScene.equations) | 2h |
| 3.6 | 实现 ProblemInput 页面 | 输入框 + "开始解析"按钮 → 跳转到实验页 | 2h |
| 3.7 | 实现底栏状态 | AI状态指示灯、Ollama连接状态、帧率显示 | 1h |

**Stage 3 产出**: 完整可交互的自由落体实验应用。

### Stage 4: 打磨 (2天)

| # | 任务 | 产出物 | 估时 |
|---|------|--------|------|
| 4.1 | 暗色/亮色主题切换 | Tailwind dark mode + 切换按钮 | 1.5h |
| 4.2 | 速度控制 (0.5x/1x/2x) | 时间缩放因子 | 1h |
| 4.3 | 响应式布局适配 | 窗口缩放时3D场景自适应 | 1.5h |
| 4.4 | 错误处理与加载态 | AI调用超时/失败的UI反馈 | 2h |
| 4.5 | 性能优化 | 小球轨迹点上限、低帧率时降级渲染 | 2h |
| 4.6 | 电子打包配置 | `electron-builder.yml` → 生成 Windows `.exe` | 3h |
| 4.7 | MVP自测 | 完整流程走通3遍，修复P0 Bug | 3h |

**Stage 4 产出**: 可打包发布的 MVP。

---

## 7. MVP 开发约束

| 约束 | 说明 |
|------|------|
| **无依赖 Ollama** | AI 调用失败时自动降级为本地示例数据 (`FREE_FALL_SCENE`) |
| **无数据库** | 不引入 SQLite/Prisma，数据全在内存 + Zustand |
| **无 React Router** | 仅 2 个页面，Zustand 驱动切换 |
| **无 UI 组件库** | 手写 Button/Slider/Input，保持零外部UI依赖 |
| **类型优先** | 所有文件 `.ts` / `.tsx`，严格模式，零 `any` |
| **单实体类型** | 仅实现 `BallEntity` 和 `BlockEntity(is_static)` |
| **单环境类型** | 仅实现 `GravityField` |

---

## 8. 关键文件清单 (按创建顺序)

```
第1天 (Stage 0):
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  .gitignore / .prettierrc / .eslintrc.cjs
  packages/shared/package.json
  packages/shared/tsconfig.json
  packages/shared/src/index.ts
  apps/desktop/package.json
  apps/desktop/tsconfig.json
  apps/desktop/vite.config.ts
  apps/desktop/index.html
  apps/desktop/tailwind.config.js
  apps/desktop/postcss.config.js
  apps/desktop/src/main/index.ts
  apps/desktop/src/main/window.ts
  apps/desktop/src/preload/index.ts
  apps/desktop/src/renderer/main.tsx
  apps/desktop/src/renderer/App.tsx
  apps/desktop/src/renderer/index.css

第2-3天 (Stage 1):
  packages/shared/src/types/physics-scene.ts
  packages/shared/src/constants/free-fall-scene.ts
  apps/desktop/src/main/services/ollama.ts
  apps/desktop/src/main/ipc/index.ts
  apps/desktop/src/main/ipc/exercise.ts
  apps/desktop/src/renderer/hooks/useIPC.ts

第4-7天 (Stage 2):
  apps/desktop/src/renderer/hooks/useAnimationLoop.ts
  apps/desktop/src/renderer/features/experiment/experiment.store.ts
  apps/desktop/src/renderer/features/experiment/ExperimentView.tsx
  apps/desktop/src/renderer/features/experiment/components/Scene3D.tsx
  apps/desktop/src/renderer/features/experiment/components/CoordinateAxes.tsx (可内联)
  apps/desktop/src/renderer/features/experiment/components/ForceArrows.tsx (可内联)
  apps/desktop/src/renderer/features/experiment/components/Toolbar.tsx (可内联)

第8-10天 (Stage 3):
  apps/desktop/src/renderer/features/problem-input/ProblemInput.store.ts
  apps/desktop/src/renderer/features/problem-input/ProblemInput.tsx
  apps/desktop/src/renderer/features/experiment/components/ControlPanel.tsx
  apps/desktop/src/renderer/features/experiment/components/DataPanel.tsx
  apps/desktop/src/renderer/features/experiment/components/SolutionPanel.tsx
  apps/desktop/src/renderer/features/experiment/components/StatusBar.tsx

第11-14天 (Stage 4):
  apps/desktop/electron-builder.yml
  (其余为修改现有文件)
```
