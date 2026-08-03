# PhysicsScene JSON Schema 规范

## 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | Physics Lab |
| 文档类型 | PhysicsScene 完整 JSON Schema 规范 |
| 版本 | v2.0 |
| Schema 版本 | physics-scene/2.0 |
| 最后更新 | 2026-06-24 |

---

## 1. 概述

### 1.1 PhysicsScene 是什么

PhysicsScene 是 Physics AI Engine 的**核心数据结构**，是将物理题目转化为可计算、可渲染、可交互、可动画教学的统一中间表示（Intermediate Representation）。

它是整个系统的"语言"：

```
题目输入 ──→ AI解析 ──→ PhysicsScene ──→ 教学动画引擎（核心：Hybrid 2D+3D）
                                    ├──→ 3D渲染引擎（交互扩展）
                                    ├──→ 学习系统
                                    └──→ 知识图谱
```

> 2026-08-03 定位修正：PhysicsScene 的首要消费方从"3D实验渲染器"修正为"教学动画生成器"。Schema 设计必须优先保证教学动画所需信息完整：阶段化 timeline（phases）、教学步骤（teacher_steps）、受力展示（forces.visual）、公式推导（equations.derivation）、镜头脚本（camera_script）。

### 1.1.1 教学动画支持要求（2026-08-03 新增）

为支撑"输入题目 → 自动生成教学动画"核心主线，PhysicsScene 生产者（AI解析器/插件）应尽可能输出：

| 能力 | 依赖字段 | 用途 |
|------|----------|------|
| 阶段化讲解 | timeline.phases / phase_start / phase_end | 教学动画分幕 |
| 过程解释 | teacher_steps（见 v2.1 扩展） | 讲解文本与动画同步 |
| 受力展示 | forces[].visual（颜色/箭头/标签） | 为什么受力 |
| 公式推导 | equations[].derivation | 公式如何产生 |
| 镜头编排 | camera_script | 教学模式视角切换 |
| 2D/3D视图提示 | （规划）teaching_view 提示字段 | Hybrid 2D+3D：标注各阶段适合的视图（2D讲解 / 3D空间） |

说明：现有 Schema v2.0 不推倒重来；teaching_view 等增量字段按 §13 向前兼容规则作为可选扩展逐步引入。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **唯一数据源** | 所有模块只能读取 PhysicsScene，禁止直接读取原始题目文本 |
| **完整自描述** | PhysicsScene 包含完整信息，不依赖外部上下文即可独立渲染和分析 |
| **可序列化** | 纯 JSON 格式，可存入数据库、通过 API 传输、作为文件导出 |
| **向前兼容** | Schema 版本化，新版可解析旧版数据 |
| **物理准确性** | 所有数值使用 SI 单位制，确保物理计算正确 |

### 1.3 顶层结构

```json
{
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {},
  "entities": [],
  "environment": [],
  "forces": [],
  "constraints": [],
  "equations": [],
  "timeline": [],
  "camera_script": [],
  "ui_controls": [],
  "knowledge_tags": []
}
```

---

## 2. 顶层字段

### 2.1 $schema

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 必填 | 是 |
| 说明 | Schema 版本标识符 URL |

### 2.2 version

| 属性 | 值 |
|------|-----|
| 类型 | `string` |
| 必填 | 是 |
| 说明 | PhysicsScene 格式版本号。当前为 `"2.0"` |
| 可选值 | `"1.0"`, `"2.0"` |

### 2.3 metadata

场景元信息。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| metadata.title | string | 是 | 场景标题，如"自由落体运动" |
| metadata.description | string | 否 | 场景描述，200字以内 |
| metadata.subject | string | 是 | 学科分类 |
| metadata.topic | string | 否 | 具体专题，如"牛顿第二定律" |
| metadata.difficulty | string | 否 | 难度等级 |
| metadata.grade | string | 否 | 适用年级 |
| metadata.sourceExerciseId | string | 否 | 来源题目ID |
| metadata.generatedBy | string | 否 | 生成者：AI模型名称 |
| metadata.generatedAt | string | 否 | 生成时间，ISO 8601 |
| metadata.tags | string[] | 否 | 标签列表 |

**示例：**
```json
{
  "metadata": {
    "title": "自由落体运动",
    "description": "质量为2kg的小球从10m高处自由落下，忽略空气阻力",
    "subject": "mechanics",
    "topic": "free_fall",
    "difficulty": "easy",
    "grade": "senior_high",
    "sourceExerciseId": "ex-abc123",
    "generatedBy": "qwen2.5:7b",
    "generatedAt": "2026-06-24T10:00:12Z",
    "tags": ["自由落体", "匀变速直线运动", "能量守恒"]
  }
}
```

---

## 3. entities

### 3.1 概述

场景中的所有物理实体（物体）。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 是 |
| 最小项数 | 1 |
| 说明 | 至少需要一个实体 |

### 3.2 通用实体字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 实体唯一标识，如 `"ball_1"` |
| type | string | 是 | 实体类型（见 3.3） |
| name | string | 否 | 显示名称，如 `"小球A"` |
| label | string | 否 | 标签文字（显示在3D场景中） |
| position | number[3] | 是 | 初始位置 `[x, y, z]`，单位：米 |
| rotation | number[3] | 否 | 初始旋转 `[rx, ry, rz]`，单位：弧度 |
| scale | number[3] | 否 | 缩放比例，默认 `[1, 1, 1]` |
| properties | object | 是 | 物理属性（按实体类型不同） |
| initial_conditions | object | 否 | 初始条件（速度、加速度等） |
| visual | object | 否 | 视觉表现配置 |
| constraints_refs | string[] | 否 | 关联的约束ID列表 |

### 3.3 实体类型定义

#### 3.3.1 ball（小球/质点）

```json
{
  "type": "ball",
  "properties": {
    "mass": { "type": "number", "unit": "kg", "description": "质量" },
    "radius": { "type": "number", "unit": "m", "description": "半径" },
    "charge": { "type": "number", "unit": "C", "description": "电荷量（可选）" },
    "restitution": { "type": "number", "description": "弹性恢复系数，0~1，默认0.8" }
  },
  "initial_conditions": {
    "velocity": { "type": "number[3]", "unit": "m/s", "description": "初速度向量" },
    "angular_velocity": { "type": "number[3]", "unit": "rad/s", "description": "角速度向量" }
  },
  "visual": {
    "color": { "type": "string", "description": "颜色，hex格式" },
    "material": { "type": "string", "enum": ["standard", "metal", "glass", "rubber"] }
  }
}
```

#### 3.3.2 block（滑块/方块）

```json
{
  "type": "block",
  "properties": {
    "mass": { "type": "number", "unit": "kg" },
    "dimensions": { "type": "number[3]", "unit": "m", "description": "长宽高 [l, w, h]" },
    "friction_coefficient": { "type": "number", "description": "摩擦系数 μ" },
    "charge": { "type": "number", "unit": "C" }
  },
  "initial_conditions": {
    "velocity": { "type": "number[3]", "unit": "m/s" }
  },
  "visual": {
    "color": { "type": "string" },
    "wireframe": { "type": "boolean" }
  }
}
```

#### 3.3.3 pendulum（摆球）

```json
{
  "type": "pendulum",
  "properties": {
    "mass": { "type": "number", "unit": "kg" },
    "radius": { "type": "number", "unit": "m", "description": "摆球半径" },
    "string_length": { "type": "number", "unit": "m", "description": "摆线长度" },
    "pivot": { "type": "number[3]", "unit": "m", "description": "悬挂点位置" }
  },
  "initial_conditions": {
    "angle": { "type": "number", "unit": "rad", "description": "初始摆角" },
    "angular_velocity": { "type": "number", "unit": "rad/s" }
  }
}
```

#### 3.3.4 spring（弹簧）

```json
{
  "type": "spring",
  "properties": {
    "stiffness": { "type": "number", "unit": "N/m", "description": "劲度系数 k" },
    "natural_length": { "type": "number", "unit": "m", "description": "原长" },
    "damping": { "type": "number", "description": "阻尼系数（可选）" },
    "attachment_points": {
      "type": "object",
      "properties": {
        "start_entity": { "type": "string", "description": "起点关联实体ID" },
        "end_entity": { "type": "string", "description": "终点关联实体ID" },
        "start_offset": { "type": "number[3]", "unit": "m" },
        "end_offset": { "type": "number[3]", "unit": "m" }
      }
    }
  },
  "visual": {
    "coils": { "type": "integer", "description": "螺旋圈数，默认10" },
    "color": { "type": "string" },
    "thickness": { "type": "number", "description": "线径" }
  }
}
```

#### 3.3.5 charge（点电荷）

```json
{
  "type": "charge",
  "properties": {
    "charge": { "type": "number", "unit": "C", "description": "电荷量（正值/负值）" },
    "radius": { "type": "number", "unit": "m", "description": "显示半径" }
  },
  "visual": {
    "color": { "type": "string", "description": "正电荷红色，负电荷蓝色" },
    "show_field_lines": { "type": "boolean", "description": "是否显示电场线" }
  }
}
```

#### 3.3.6 conductor_rod（导体棒）

```json
{
  "type": "conductor_rod",
  "properties": {
    "length": { "type": "number", "unit": "m" },
    "resistance": { "type": "number", "unit": "Ω" },
    "mass": { "type": "number", "unit": "kg" }
  },
  "initial_conditions": {
    "velocity": { "type": "number[3]", "unit": "m/s" }
  }
}
```

#### 3.3.7 light_ray（光线）

```json
{
  "type": "light_ray",
  "properties": {
    "wavelength": { "type": "number", "unit": "nm", "description": "波长（用于颜色显示）" },
    "intensity": { "type": "number", "description": "强度 0~1" },
    "origin": { "type": "number[3]", "unit": "m", "description": "光源位置" },
    "direction": { "type": "number[3]", "description": "归一化方向向量" }
  }
}
```

#### 3.3.8 piston（活塞）

```json
{
  "type": "piston",
  "properties": {
    "area": { "type": "number", "unit": "m²", "description": "活塞面积" },
    "mass": { "type": "number", "unit": "kg" },
    "cylinder_length": { "type": "number", "unit": "m", "description": "气缸长度" }
  },
  "initial_conditions": {
    "position_offset": { "type": "number", "unit": "m", "description": "活塞初始位置偏移" }
  }
}
```

### 3.4 实体示例

```json
{
  "entities": [
    {
      "id": "ball_1",
      "type": "ball",
      "name": "小球",
      "position": [0, 10, 0],
      "scale": [1, 1, 1],
      "properties": {
        "mass": 2.0,
        "radius": 0.1,
        "restitution": 0.5
      },
      "initial_conditions": {
        "velocity": [0, 0, 0]
      },
      "visual": {
        "color": "#FF6B6B",
        "material": "metal",
        "show_trail": true,
        "trail_color": "#FF6B6B44",
        "trail_max_points": 500
      }
    },
    {
      "id": "ground",
      "type": "block",
      "name": "地面",
      "position": [0, -0.1, 0],
      "scale": [20, 0.2, 20],
      "properties": {
        "mass": 0,
        "dimensions": [20, 0.2, 20],
        "friction_coefficient": 0.5,
        "is_static": true
      },
      "visual": {
        "color": "#8B7355",
        "material": "standard"
      }
    }
  ]
}
```

---

## 4. environment

### 4.1 概述

场景中的环境要素（场、面、空间）。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否（可为空数组） |

### 4.2 环境类型定义

#### 4.2.1 gravity_field（重力场）

```json
{
  "type": "gravity_field",
  "properties": {
    "acceleration": { "type": "number", "unit": "m/s²", "description": "重力加速度，默认9.8" },
    "direction": { "type": "number[3]", "description": "方向向量，默认 [0, -1, 0]" }
  }
}
```

#### 4.2.2 incline_plane（斜面）

```json
{
  "type": "incline_plane",
  "properties": {
    "angle": { "type": "number", "unit": "°", "description": "斜面倾角" },
    "length": { "type": "number", "unit": "m" },
    "width": { "type": "number", "unit": "m" },
    "friction_coefficient": { "type": "number", "description": "动摩擦因数" },
    "static_friction_coefficient": { "type": "number", "description": "静摩擦因数" },
    "position": { "type": "number[3]", "unit": "m", "description": "斜面底部中心位置" },
    "direction": { "type": "string", "enum": ["left", "right"], "description": "斜面朝向" }
  }
}
```

#### 4.2.3 electric_field（电场）

```json
{
  "type": "electric_field",
  "properties": {
    "strength": { "type": "number", "unit": "N/C 或 V/m", "description": "电场强度" },
    "direction": { "type": "number[3]", "description": "电场方向向量" },
    "type": { "type": "string", "enum": ["uniform", "point_charge", "parallel_plate"] },
    "source_position": { "type": "number[3]", "unit": "m", "description": "场源位置（非匀强电场时）" }
  },
  "visual": {
    "show_field_lines": { "type": "boolean" },
    "line_density": { "type": "integer", "description": "电场线密度" },
    "line_color": { "type": "string" }
  }
}
```

#### 4.2.4 magnetic_field（磁场）

```json
{
  "type": "magnetic_field",
  "properties": {
    "strength": { "type": "number", "unit": "T", "description": "磁感应强度 B" },
    "direction": { "type": "number[3]", "description": "磁场方向向量" },
    "type": { "type": "string", "enum": ["uniform", "current_carrying_wire", "solenoid"] },
    "region": {
      "type": "object",
      "description": "磁场区域范围",
      "properties": {
        "shape": { "type": "string", "enum": ["infinite", "box", "cylinder"] },
        "dimensions": { "type": "number[3]", "unit": "m" }
      }
    }
  },
  "visual": {
    "show_field_indicators": { "type": "boolean" },
    "indicator_color": { "type": "string", "description": "默认蓝色" },
    "indicator_type": { "type": "string", "enum": ["cross_dot", "arrows", "streamlines"] }
  }
}
```

#### 4.2.5 rail（导轨）

```json
{
  "type": "rail",
  "properties": {
    "length": { "type": "number", "unit": "m" },
    "spacing": { "type": "number", "unit": "m", "description": "双轨间距" },
    "position": { "type": "number[3]", "unit": "m" },
    "direction": { "type": "number[3]", "description": "导轨方向向量" },
    "resistance": { "type": "number", "unit": "Ω", "description": "导轨电阻（可选）" }
  }
}
```

#### 4.2.6 lens（透镜）

```json
{
  "type": "lens",
  "properties": {
    "type": { "type": "string", "enum": ["convex", "concave"] },
    "focal_length": { "type": "number", "unit": "m" },
    "position": { "type": "number[3]", "unit": "m" },
    "orientation": { "type": "string", "enum": ["vertical", "horizontal"] },
    "diameter": { "type": "number", "unit": "m" }
  }
}
```

#### 4.2.7 container（容器）

```json
{
  "type": "container",
  "properties": {
    "shape": { "type": "string", "enum": ["cylinder", "box", "sphere"] },
    "dimensions": { "type": "number[3]", "unit": "m" },
    "position": { "type": "number[3]", "unit": "m" },
    "contains": { "type": "string", "enum": ["gas", "liquid", "vacuum"] },
    "pressure": { "type": "number", "unit": "Pa", "description": "内部压强（可选）" },
    "temperature": { "type": "number", "unit": "K", "description": "温度（可选）" }
  }
}
```

---

## 5. forces

### 5.1 概述

作用于实体的力。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 5.2 力的类型

#### 5.2.1 通用力字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 力唯一标识，如 `"gravity_ball_1"` |
| type | string | 是 | 力的类型（见 5.2.2） |
| target_entity | string | 是 | 受力实体ID |
| magnitude | number/string | 是 | 力的大小，数值或表达式 |
| direction | number[3]/string | 是 | 方向向量或表达式 |
| is_constant | boolean | 否 | 是否为恒力，默认 true |
| description | string | 否 | 力的描述文字 |

#### 5.2.2 力类型枚举

| 类型 | 说明 |
|------|------|
| `gravity` | 重力 |
| `normal` | 支持力（法向力） |
| `friction` | 摩擦力 |
| `tension` | 拉力/张力 |
| `spring_force` | 弹力（胡克定律） |
| `buoyancy` | 浮力 |
| `electric_force` | 电场力 |
| `lorentz_force` | 洛伦兹力 |
| `magnetic_force` | 安培力 |
| `applied_force` | 外力（人为施加） |
| `drag_force` | 阻力/空气阻力 |
| `centripetal_force` | 向心力 |

### 5.3 示例

```json
{
  "forces": [
    {
      "id": "gravity_ball_1",
      "type": "gravity",
      "target_entity": "ball_1",
      "magnitude": "mass * g",
      "direction": [0, -1, 0],
      "is_constant": true,
      "description": "重力",
      "visual": {
        "color": "#FF4444",
        "arrow_scale": 0.5,
        "label": "G"
      }
    },
    {
      "id": "normal_ball_1",
      "type": "normal",
      "target_entity": "ball_1",
      "magnitude": "mass * g * cos(theta)",
      "direction": "perpendicular_to_surface",
      "is_constant": false,
      "description": "支持力"
    },
    {
      "id": "friction_block_1",
      "type": "friction",
      "target_entity": "block_1",
      "magnitude": "mu * N",
      "direction": "opposite_to_velocity",
      "is_constant": false,
      "description": "滑动摩擦力"
    }
  ]
}
```

---

## 6. constraints

### 6.1 概述

实体间的物理约束条件。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 6.2 约束类型

#### 6.2.1 通用约束字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 约束唯一标识 |
| type | string | 是 | 约束类型（见 6.2.2） |
| entities | string[] | 是 | 受约束实体ID列表 |
| description | string | 否 | 约束描述 |

#### 6.2.2 约束类型枚举

| 类型 | 说明 |
|------|------|
| `distance` | 固定距离约束 |
| `fixed_point` | 固定点约束（铰链/支点） |
| `fixed_axis` | 固定轴约束 |
| `sliding` | 滑动约束（沿特定方向） |
| `contact` | 接触约束（不穿透） |
| `pulley` | 滑轮约束 |
| `rigid_body` | 刚体约束（多实体固定相对位置） |
| `periodic_boundary` | 周期性边界条件 |

### 6.3 示例

```json
{
  "constraints": [
    {
      "id": "pendulum_pivot",
      "type": "fixed_point",
      "entities": ["pendulum_ball"],
      "properties": {
        "pivot": [0, 5, 0],
        "distance": 2.0
      },
      "description": "摆球悬挂点约束"
    },
    {
      "id": "ground_contact",
      "type": "contact",
      "entities": ["ball_1", "ground"],
      "properties": {
        "restitution": 0.5,
        "friction": 0.3
      },
      "description": "小球与地面的碰撞约束"
    },
    {
      "id": "sliding_on_incline",
      "type": "sliding",
      "entities": ["block_1"],
      "properties": {
        "surface_normal": [0.5, 0.866, 0],
        "friction_coefficient": 0.3
      },
      "description": "滑块沿斜面滑动约束"
    }
  ]
}
```

---

## 7. equations

### 7.1 概述

描述物理量之间数学关系的方程。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 7.2 方程结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 方程唯一标识 |
| name | string | 是 | 方程名称，如"牛顿第二定律" |
| expression | string | 是 | LaTeX 数学表达式 |
| variables | object | 是 | 变量定义映射 |
| derivation | string[] | 否 | 推导步骤（LaTeX数组） |
| type | string | 否 | 方程类型 |

### 7.3 方程类型枚举

| 类型 | 说明 |
|------|------|
| `motion` | 运动学方程 |
| `force` | 动力学方程 |
| `energy` | 能量方程 |
| `momentum` | 动量方程 |
| `electromagnetic` | 电磁学方程 |
| `wave` | 波动方程 |
| `optical` | 光学方程 |
| `thermal` | 热学方程 |
| `target` | 目标方程（待求解） |

### 7.4 示例

```json
{
  "equations": [
    {
      "id": "eq_newton_2",
      "name": "牛顿第二定律",
      "expression": "F = m \\cdot a",
      "variables": {
        "F": { "symbol": "F", "unit": "N", "description": "合外力" },
        "m": { "symbol": "m", "unit": "kg", "description": "质量" },
        "a": { "symbol": "a", "unit": "m/s²", "description": "加速度" }
      },
      "type": "force"
    },
    {
      "id": "eq_free_fall",
      "name": "自由落体位移公式",
      "expression": "h = \\frac{1}{2}gt^2",
      "variables": {
        "h": { "symbol": "h", "unit": "m", "description": "下落高度" },
        "g": { "symbol": "g", "unit": "m/s²", "description": "重力加速度" },
        "t": { "symbol": "t", "unit": "s", "description": "时间" }
      },
      "derivation": [
        "v = gt",
        "h = \\int_0^t v\\,dt = \\int_0^t gt\\,dt",
        "h = \\frac{1}{2}gt^2"
      ],
      "type": "motion"
    },
    {
      "id": "eq_target_velocity",
      "name": "落地速度",
      "expression": "v = \\sqrt{2gh}",
      "variables": {
        "v": { "symbol": "v", "unit": "m/s", "description": "落地速度" },
        "g": { "symbol": "g", "unit": "m/s²" },
        "h": { "symbol": "h", "unit": "m" }
      },
      "type": "target",
      "is_solution": true
    }
  ]
}
```

---

## 8. timeline

### 8.1 概述

描述场景在时间维度上的关键帧和事件序列。渲染引擎根据 timeline 插值生成连续动画。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 8.2 时间线结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeline.total_duration | number | 是 | 总持续时间（秒） |
| timeline.fps | number | 否 | 目标帧率，默认60 |
| timeline.time_scale | number | 否 | 时间缩放因子，默认1.0 |
| timeline.events | array | 是 | 关键事件列表 |

### 8.3 事件结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 事件唯一标识 |
| time | number | 是 | 事件发生时间（秒） |
| type | string | 是 | 事件类型 |
| target | string | 否 | 目标实体ID |
| data | object | 是 | 事件相关数据 |
| description | string | 否 | 事件描述 |

### 8.4 事件类型枚举

| 类型 | 说明 |
|------|------|
| `keyframe` | 关键帧（记录该时刻所有实体状态） |
| `collision` | 碰撞事件 |
| `state_change` | 状态变化（如从滑动变为静止） |
| `force_change` | 力的变化 |
| `trigger` | 触发事件（条件满足时触发） |
| `marker` | 标注点（用于教学说明） |
| `phase_start` | 阶段开始 |
| `phase_end` | 阶段结束 |

### 8.5 示例

```json
{
  "timeline": {
    "total_duration": 5.0,
    "fps": 60,
    "time_scale": 1.0,
    "events": [
      {
        "id": "start",
        "time": 0.0,
        "type": "keyframe",
        "target": "ball_1",
        "data": {
          "position": [0, 10, 0],
          "velocity": [0, 0, 0],
          "acceleration": [0, -9.8, 0]
        },
        "description": "初始状态：小球在10m高处静止"
      },
      {
        "id": "midpoint",
        "time": 1.0,
        "type": "marker",
        "target": "ball_1",
        "data": {
          "position": [0, 5.1, 0],
          "velocity": [0, -9.8, 0],
          "label": "t=1s, h=5.1m, v=9.8m/s"
        },
        "description": "1秒时位置和速度标注"
      },
      {
        "id": "impact",
        "time": 1.43,
        "type": "collision",
        "target": "ball_1",
        "data": {
          "collision_with": "ground",
          "impact_velocity": 14.0,
          "restitution": 0.5,
          "post_collision_velocity": [0, 7.0, 0]
        },
        "description": "小球触地碰撞，反弹速度7.0m/s"
      },
      {
        "id": "end",
        "time": 5.0,
        "type": "phase_end",
        "description": "实验结束"
      }
    ]
  }
}
```

---

## 9. camera_script

### 9.1 概述

定义相机在时间线上的位置、朝向和运动路径。渲染引擎据此控制视角。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 9.2 相机脚本项结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 相机脚本项ID |
| time | number | 是 | 时间点（秒） |
| duration | number | 否 | 过渡时间（秒），默认0 |
| easing | string | 否 | 缓动函数，默认"linear" |
| position | number[3] | 是 | 相机位置 |
| target | number[3] | 是 | 相机注视点 |
| fov | number | 否 | 视场角（度），默认60 |
| description | string | 否 | 镜头说明 |

### 9.3 缓动函数枚举

| 值 | 说明 |
|-----|------|
| `linear` | 线性 |
| `ease_in` | 缓入 |
| `ease_out` | 缓出 |
| `ease_in_out` | 缓入缓出 |
| `smooth` | 平滑（贝塞尔） |

### 9.4 示例

```json
{
  "camera_script": [
    {
      "id": "overview",
      "time": 0.0,
      "duration": 0.0,
      "position": [8, 6, 8],
      "target": [0, 5, 0],
      "fov": 60,
      "description": "初始全景视角"
    },
    {
      "id": "follow_ball",
      "time": 0.5,
      "duration": 1.0,
      "easing": "ease_in_out",
      "position": [3, 8, 3],
      "target": [0, 8, 0],
      "fov": 45,
      "description": "跟踪小球下落"
    },
    {
      "id": "impact_closeup",
      "time": 1.3,
      "duration": 0.5,
      "easing": "ease_in",
      "position": [2, 1, 2],
      "target": [0, 0.5, 0],
      "fov": 35,
      "description": "特写碰撞瞬间"
    }
  ]
}
```

---

## 10. ui_controls

### 10.1 概述

定义可调节的参数控制面板。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 10.2 控件项结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 控件ID |
| parameter | string | 是 | 绑定的参数字段路径（如 `"entities[0].properties.mass"`） |
| type | string | 是 | 控件类型 |
| label | string | 是 | 显示标签 |
| default_value | number | 是 | 默认值 |
| min | number | 是 | 最小值 |
| max | number | 是 | 最大值 |
| step | number | 否 | 步长 |
| unit | string | 否 | 显示单位 |
| group | string | 否 | 分组名称 |

### 10.3 控件类型枚举

| 类型 | 说明 |
|------|------|
| `slider` | 滑块 |
| `number_input` | 数字输入框 |
| `toggle` | 开关 |
| `select` | 下拉选择 |
| `angle` | 角度选择器 |
| `vector3` | 三维向量输入 |

### 10.4 示例

```json
{
  "ui_controls": [
    {
      "id": "ctrl_mass",
      "parameter": "entities[0].properties.mass",
      "type": "slider",
      "label": "质量",
      "default_value": 2.0,
      "min": 0.1,
      "max": 10.0,
      "step": 0.1,
      "unit": "kg",
      "group": "力学参数"
    },
    {
      "id": "ctrl_velocity",
      "parameter": "entities[0].initial_conditions.velocity[1]",
      "type": "slider",
      "label": "初速度（竖直）",
      "default_value": 0.0,
      "min": -20.0,
      "max": 20.0,
      "step": 0.5,
      "unit": "m/s",
      "group": "力学参数"
    },
    {
      "id": "ctrl_time_scale",
      "parameter": "timeline.time_scale",
      "type": "slider",
      "label": "时间流速",
      "default_value": 1.0,
      "min": 0.1,
      "max": 5.0,
      "step": 0.1,
      "unit": "×",
      "group": "模拟控制"
    },
    {
      "id": "ctrl_show_trail",
      "parameter": "entities[0].visual.show_trail",
      "type": "toggle",
      "label": "显示轨迹",
      "default_value": true,
      "group": "显示选项"
    }
  ]
}
```

---

## 11. knowledge_tags

### 11.1 概述

场景关联的物理知识点标签，用于知识图谱构建和学习系统。

| 属性 | 值 |
|------|-----|
| 类型 | `array` |
| 必填 | 否 |

### 11.2 标签项结构

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识点ID |
| name | string | 是 | 知识点名称 |
| category | string | 是 | 学科分类 |
| level | integer | 是 | 知识点层级 |
| importance | number | 否 | 在本场景中的重要程度 0~1 |
| prerequisites | string[] | 否 | 前置知识点ID列表 |
| common_mistakes | string[] | 否 | 常见错误描述 |
| learning_tips | string | 否 | 学习建议 |

### 11.3 示例

```json
{
  "knowledge_tags": [
    {
      "id": "kp_free_fall",
      "name": "自由落体运动",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "prerequisites": ["kp_newton_2", "kp_constant_acceleration"],
      "common_mistakes": [
        "忽略重力加速度的方向",
        "混淆位移和路程"
      ],
      "learning_tips": "注意自由落体的三个特征：初速度为零、只受重力、加速度为g"
    },
    {
      "id": "kp_energy_conservation",
      "name": "机械能守恒定律",
      "category": "mechanics",
      "level": 2,
      "importance": 0.8,
      "prerequisites": ["kp_kinetic_energy", "kp_potential_energy"],
      "common_mistakes": [
        "忘记考虑非保守力做功",
        "零势能面选取不当"
      ]
    },
    {
      "id": "kp_collision",
      "name": "碰撞与反弹",
      "category": "mechanics",
      "level": 3,
      "importance": 0.5,
      "prerequisites": ["kp_momentum", "kp_energy_conservation"]
    }
  ]
}
```

---

## 12. 完整示例

以下是一个完整的自由落体 PhysicsScene：

```json
{
  "$schema": "https://physics-lab.app/schemas/physics-scene/2.0.json",
  "version": "2.0",
  "metadata": {
    "title": "自由落体运动",
    "description": "质量为2kg的小球从10m高处自由落下，忽略空气阻力，g=10m/s²",
    "subject": "mechanics",
    "topic": "free_fall",
    "difficulty": "easy",
    "grade": "senior_high",
    "generatedBy": "qwen2.5:7b",
    "generatedAt": "2026-06-24T10:00:00Z",
    "tags": ["自由落体", "匀变速运动", "能量守恒"]
  },
  "entities": [
    {
      "id": "ball_1",
      "type": "ball",
      "name": "小球",
      "position": [0, 10, 0],
      "properties": {
        "mass": 2.0,
        "radius": 0.15,
        "restitution": 0.6
      },
      "initial_conditions": {
        "velocity": [0, 0, 0]
      },
      "visual": {
        "color": "#FF6B6B",
        "material": "metal",
        "show_trail": true,
        "trail_color": "#FF6B6B44"
      }
    },
    {
      "id": "ground",
      "type": "block",
      "name": "地面",
      "position": [0, -0.1, 0],
      "scale": [10, 0.2, 10],
      "properties": {
        "mass": 0,
        "dimensions": [10, 0.2, 10],
        "is_static": true,
        "friction_coefficient": 0.5
      },
      "visual": {
        "color": "#8B7355",
        "material": "standard"
      }
    }
  ],
  "environment": [
    {
      "type": "gravity_field",
      "properties": {
        "acceleration": 10.0,
        "direction": [0, -1, 0]
      }
    }
  ],
  "forces": [
    {
      "id": "gravity_ball_1",
      "type": "gravity",
      "target_entity": "ball_1",
      "magnitude": 20.0,
      "direction": [0, -1, 0],
      "is_constant": true,
      "description": "重力 G = mg = 2×10 = 20N",
      "visual": {
        "color": "#FF4444",
        "arrow_scale": 0.3,
        "label": "G=20N"
      }
    }
  ],
  "constraints": [
    {
      "id": "ground_collision",
      "type": "contact",
      "entities": ["ball_1", "ground"],
      "properties": {
        "restitution": 0.6,
        "friction": 0.5
      },
      "description": "小球与地面碰撞"
    }
  ],
  "equations": [
    {
      "id": "eq_motion",
      "name": "运动方程",
      "expression": "y(t) = h_0 - \\frac{1}{2}gt^2",
      "variables": {
        "h_0": { "symbol": "h₀", "unit": "m", "description": "初始高度" },
        "g": { "symbol": "g", "unit": "m/s²", "description": "重力加速度" },
        "t": { "symbol": "t", "unit": "s", "description": "时间" }
      },
      "type": "motion"
    },
    {
      "id": "eq_velocity",
      "name": "落地速度",
      "expression": "v = \\sqrt{2gh} = \\sqrt{2 \\times 10 \\times 10} = 10\\sqrt{2} \\approx 14.14\\,\\text{m/s}",
      "variables": {},
      "type": "target",
      "is_solution": true
    }
  ],
  "timeline": {
    "total_duration": 4.0,
    "fps": 60,
    "events": [
      {
        "id": "start",
        "time": 0.0,
        "type": "phase_start",
        "data": { "label": "释放小球" },
        "description": "小球从10m高处开始自由下落"
      },
      {
        "id": "t1s",
        "time": 1.0,
        "type": "marker",
        "target": "ball_1",
        "data": {
          "label": "t=1s",
          "position": [0, 5, 0],
          "velocity": 10.0
        },
        "description": "1秒后：下降5m，速度10m/s"
      },
      {
        "id": "impact",
        "time": 1.414,
        "type": "collision",
        "target": "ball_1",
        "data": {
          "collision_with": "ground",
          "impact_velocity": 14.14
        },
        "description": "小球以14.14m/s的速度撞击地面"
      }
    ]
  },
  "camera_script": [
    {
      "id": "overview",
      "time": 0.0,
      "position": [8, 6, 8],
      "target": [0, 5, 0],
      "fov": 60,
      "description": "全景视角"
    },
    {
      "id": "follow_down",
      "time": 0.3,
      "duration": 0.8,
      "easing": "ease_in_out",
      "position": [4, 6, 4],
      "target": [0, 5, 0],
      "fov": 50,
      "description": "跟随小球下落"
    }
  ],
  "ui_controls": [
    {
      "id": "ctrl_mass",
      "parameter": "entities[0].properties.mass",
      "type": "slider",
      "label": "质量",
      "default_value": 2.0,
      "min": 0.1,
      "max": 10.0,
      "step": 0.1,
      "unit": "kg",
      "group": "物理参数"
    },
    {
      "id": "ctrl_g",
      "parameter": "environment[0].properties.acceleration",
      "type": "slider",
      "label": "重力加速度",
      "default_value": 10.0,
      "min": 0.1,
      "max": 20.0,
      "step": 0.5,
      "unit": "m/s²",
      "group": "物理参数"
    },
    {
      "id": "ctrl_height",
      "parameter": "entities[0].position[1]",
      "type": "slider",
      "label": "初始高度",
      "default_value": 10.0,
      "min": 1.0,
      "max": 50.0,
      "step": 0.5,
      "unit": "m",
      "group": "初始条件"
    }
  ],
  "knowledge_tags": [
    {
      "id": "kp_free_fall",
      "name": "自由落体运动",
      "category": "mechanics",
      "level": 2,
      "importance": 1.0,
      "prerequisites": ["kp_newton_2", "kp_acceleration"],
      "common_mistakes": [
        "忽略自由落体初速度为零的条件",
        "混淆位移与路程"
      ],
      "learning_tips": "自由落体是匀变速直线运动的特例：v₀=0, a=g"
    },
    {
      "id": "kp_energy",
      "name": "机械能守恒",
      "category": "mechanics",
      "level": 2,
      "importance": 0.7,
      "prerequisites": ["kp_kinetic_energy", "kp_potential_energy"]
    }
  ]
}
```

---

## 13. Schema 版本兼容

### 13.1 版本迁移规则

| 迁移路径 | 变更 |
|----------|------|
| v1.0 → v2.0 | `entities[].visual` 从简单 color 字符串扩展为对象；新增 `timeline.events[].type: "phase_start/phase_end"`；新增 `metadata` 对象 |

### 13.2 向前兼容

- 解析器应支持未知字段（保留但不报错）
- 渲染器应优雅降级未知实体类型
- 所有可选字段缺失时使用默认值

---

## 14. 校验规则（非JSON Schema层面）

| 规则 | 说明 |
|------|------|
| 实体引用完整性 | forces 中的 target_entity 必须存在于 entities 中 |
| 约束引用完整性 | constraints 中的 entities 必须存在于 entities 中 |
| 单位一致性 | 所有长度使用米、质量使用千克、时间使用秒、力使用牛顿 |
| 初始条件有效性 | 初始位置不得穿透其他实体 |
| 时间线有序性 | events 按 time 升序排列 |
| UI控件路径有效性 | parameter 路径必须指向实际存在的字段 |

---

## 15. 附录

### 15.1 物理单位规范 (SI)

| 物理量 | 单位 | 符号 |
|--------|------|------|
| 长度 | 米 | m |
| 质量 | 千克 | kg |
| 时间 | 秒 | s |
| 速度 | 米/秒 | m/s |
| 加速度 | 米/秒² | m/s² |
| 力 | 牛顿 | N |
| 能量/功 | 焦耳 | J |
| 角度 | 弧度 | rad |
| 电荷 | 库仑 | C |
| 电压 | 伏特 | V |
| 电流 | 安培 | A |
| 电阻 | 欧姆 | Ω |
| 磁感应强度 | 特斯拉 | T |
| 温度 | 开尔文 | K |
| 压强 | 帕斯卡 | Pa |

### 15.2 参考文档

- [PHYSICS_ENGINE.md](./PHYSICS_ENGINE.md) - 物理引擎设计
- [PRD.md](./PRD.md) - 产品需求文档
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构

### 15.3 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-06-24 | 初始版本，完整Schema规范 | Physics Lab 架构组 |
| v1.1 | 2026-08-03 | 定位修正：PhysicsScene 首要消费方改为教学动画生成器；新增 §1.1.1 教学动画支持要求（不改动 Schema 本体，增量字段按向前兼容规则引入） | 产品架构审查 Agent |
