# Agent Handoff: Physics Lab 并行开发任务包

> 交接给另一个开发 agent 的任务说明。项目：AI 物理实验桌面应用（Electron + React + Three.js + TypeScript，npm workspaces monorepo）。
> 仓库根目录：`D:\AIProjects\physics-lab`

## 0. 开工前必读（环境事实，别踩坑）

1. **验证门禁**：任何改动后必须保持以下三条全绿，否则视为未完成：
   ```bash
   npm run typecheck          # shared 包 tsc --noEmit，基线 0 错误
   cd apps/desktop && npx tsc --noEmit   # desktop tsc，基线 0 错误
   npx vitest --run           # 14 个测试文件 87 个测试全过
   ```
2. **不要动 tsconfig**。`node_modules/@physics-lab` 的 junction 在本机被安全策略阻断，workspace 包解析靠 tsconfig `paths` 映射，已配置好。
3. **locale 文件的坑**：`apps/desktop/src/renderer/locales/*.json` 中所有非 ASCII 字符以字面 `\uXXXX` 转义序列存储（不是真字符）。编辑时保持一致风格。
4. `apps/desktop/src/renderer/locales/zh-CN.json` **不在你的边界内**（另一个 agent 持有）。你需要的所有中文 i18n 新键写入 `docs/i18n-additions.zh-CN.json`（新建），集成时由 CTO 合并。

## 1. 文件边界（严格遵守）

**你拥有（可创建/修改）：**
- `apps/desktop/src/renderer/locales/en-US.json`（仅翻译既有值，禁止新增/删除键）
- `packages/shared/src/constants/` 下你新建的 `*-scene.ts`
- `packages/shared/src/index.ts`（仅追加 export 行）
- `apps/desktop/src/renderer/plugins/extra-scenes.ts`（仅在函数体内追加注册行）
- `packages/ai-parser/test-cases/`（新建目录，归你全权）
- `docs/01_FOUNDATION(只读）`、`docs/02_PRODUCT（产品设计）`、`docs/03_ENGINE（引擎设计）`、`docs/05_HISTORY` 内的文档
- `docs/i18n-additions.zh-CN.json`（新建）

**禁止触碰：**
- `apps/desktop/src/renderer/App.tsx`、`Scene3D.tsx`、`components/`、`features/`、`stores/`、`core/`、`lib/`
- `zh-CN.json`、任何 tsconfig、`package.json` 依赖
- `docs/04_PROJECT（当前状态）` 内的状态文件

## 2. 任务清单

### 任务 A：en-US 文案债务清偿（优先级最高）

背景：`apps/desktop/src/renderer/locales/en-US.json` 中 S66 时期新增的约 40 个 `teacher.*` 键是占位英文（如 `"teacher.faraday.step1": "Step1"`、`"teacher.faraday.step1_desc": "Step1 Desc"`）。

要求：
1. 找出所有值为占位文本（`StepN`、`StepN Desc`、`FormulaN` 模式）的键
2. 参照 `zh-CN.json` 中同键的中文文案，翻译成**地道、简洁的英文**（面向中学生，物理术语准确，如 EMF、flux、torque、piston、isothermal）
3. 只改值，不改键；保持 JSON 合法；en-US 全 ASCII 无需转义（除 ° 等符号可用 \uXXXX）
4. 完成后跑验证门禁

### 任务 B：两个新实验场景（变压器 + 简谐振动）

参照模板 `packages/shared/src/constants/ac-generator-scene.ts`（最新、最完整的范例）：

1. 新建 `transformer-scene.ts`：理想变压器 U1/U2 = N1/N2。实体：primary_coil、secondary_coil。simulation.params：N1、N2、V1、f（频率）、R（负载）。equations 输出：v1、v2、i1、i2、磁通。timeline 3-4 个 phases。teacher_steps 4 步（通电原线圈→铁芯磁通→副线圈感应→匝数比变压）。knowledge_tags 3-4 个。
2. 新建 `shm-detailed-scene.ts`：简谐振动详解 x = A·sin(ωt + φ)。实体：oscillator。params：A、m、k、phi。equations：x、v、a、ke、pe、total_e（突出能量转化）。phases：四分之一周期分段。teacher_steps 突出「回复力 F = -kx」与「KE↔PE 转化」。
3. `packages/shared/src/index.ts` 追加导出；`extra-scenes.ts` 函数体内追加注册（文件顶部有注释说明格式）。
4. i18n：英文键直接加进 `en-US.json`（`plugin.<topic>.name`、`phase.*`、`teacher.transformer.*`、`teacher.shm.*`、`ctrl.*` 如有新参数）；中文键写入 `docs/i18n-additions.zh-CN.json`（同结构的 JSON 片段）。
5. 场景 metadata.topic 必须与插件 id 一致（`transformer`、`shm_detailed`）。
6. **不需要**写 3D 可视化组件（通用渲染器会画实体小球；定制可视化由 CTO 后续补）。

### 任务 C：Ollama 端到端解析测试集（T310）

1. 新建 `packages/ai-parser/test-cases/`：50 个中文/英文物理题 JSON（每题含 `id`、`text`、`expectedType`（如 free_fall、projectile）、`expectedParams` 关键参数），覆盖：力学 20、电磁 10、热学 5、光学 5、波动 5、混合表述 5。
2. 新建 `packages/ai-parser/test-cases/run-e2e.ts`：用规则解析器（`ruleParser`）跑全部用例，输出类型命中率与参数偏差报告（JSON 打印到 stdout）。Ollama 若可用则对比，不可用则跳过并提示。
3. 提供 npm script 不方便（package.json 禁改），在 README 注释中写明运行方式 `npx tsx test-cases/run-e2e.ts`。
4. 报告结论写入 `docs/05_HISTORY/` 新建文件。

### 任务 D：文档卫生

1. `docs/02_PRODUCT（产品设计）/`、`docs/04_PROJECT（当前状态）` 下存在 `.md` 与 `.md.txt` 重复文件对（如 `ROADMAP.md` / `ROADMAP.md.txt`）。以**较新内容**为准合并，删除重复，保留 `.md` 后缀。`04_PROJECT` 下的状态文件（PROJECT_STATUS/CURRENT_MILESTONE/TODO/NEXT_SPRINT）**不要动**。
2. `docs/05_HISTORY/` 新建 `S68-S69.md`：从 `docs/04_PROJECT（当前状态）/PROJECT_STATUS.md.txt` 提取这两个 Sprint 的完成项归档。

## 3. 交付标准

- 验证门禁三条全绿（见第 0 节）
- 不越界修改任何文件
- 每个任务完成后在 `docs/05_HISTORY/agent-b-log.md`（新建）追加一段：做了什么、改了哪些文件、验证结果
