# Agent Handoff：Physics AI Engine 工程实现 Agent 交接（2026-08-23）

> 由前任工程实现 Agent 生成，供下一任工程实现 Agent 接手。
> 仓库根目录：`D:\AIProjects\physics-lab`（Electron + React + TS + Three.js monorepo）
> 本文件为**完整交接**：请先通读，再按第 2 节开始协同。

---

## 1. 角色与项目

- 你的角色：**工程实现 Agent**（负责软件实现 / Physics Engine / AI 接入 / 工程质量）。
- 项目：**Physics AI Engine（产品名 Physics Lab）** —— AI 物理教学动画生成引擎。
- 核心主线（唯一）：`输入题目（文字/OCR/PDF） → AI 解析 → PhysicsScene → 教学动画（Hybrid 2D+3D） → 学生理解物理`。
- 优先级：P1 闭环 > P2 教学体验 > P3 交互 > P4 实验室扩展。
- 禁止：改 01_FOUNDATION、改产品定位、为短期效果破坏架构、删除核心设计。

## 2. 协同协议（重要）

- 与「产品体验与视觉设计 Agent」通过两个文件问答协作（由项目负责人中转）：
  - 我的留言区：`D:\AIProjects\disicussion\工程实现.txt`
  - 对方留言区：`D:\AIProjects\disicussion\产品体验与视觉设计交流.txt`
- 流程：读对方留言 → 需要沟通就写入我的文件 → 读完对方留言在对方文件留「收到」→
  **确认自己留言被读（对方回复/收到）后才能推进下一轮**；无问题则写「本轮没有问题」。
- 每轮问答双方定轮次并闭环后再推进；收到用户「继续」= 开始读取流程。

## 3. 开工必读（按序）

- `docs/00_AI_SYSTEM/00_AI_SYSTEM.md.txt`（总规则，先读）
- `docs/01_FOUNDATION(只读）/` 全部（VISION / PRINCIPLES / ARCHITECTURE / DEV_RULES / PLUGIN_SPEC / UI_GUIDELINES / WORKFLOW）
- `docs/02_PRODUCT（产品设计）/`（PRD / REQUIREMENTS / TEACHING_LAYER_SPEC / TEACHING_SCRIPT_GENERATOR_SPEC / UX_AUDIT_AI_ENGINE / HAMMERATH_STYLE_STUDY）
- `docs/03_ENGINE（引擎设计）/`（PHYSICSSCENE_SCHEMA / API_SPEC / DATABASE / PHYSICS_ENGINE）
- `docs/04_PROJECT（当前状态）/`（CURRENT_MILESTONE / PROJECT_STATUS / TODO / NEXT_SPRINT / DESIGN_STATUS / MENTOR_STATUS）
- `docs/05_HISTORY/`（CHANGELOG / DESIGN_DECISIONS）

## 4. 当前状态（V6.0+，Sprint S87 快修包已实现，待设计走查）

- 最近提交：`e93832d`（S87 收尾 4 项修复）→ `ba98f3e`（S87 节奏+相机快修包）→ `75e794d`（S86 动画质感）→ `5ef2225`(S85) → `1dfeac3`(S84) → `f8c33c9`(S82+S83) → `7c00cd7`(S81) → S80/79/78/77/76/75/74/73/72/71/70 全部完成。
- S70-S86 全部交付并经产品/UX Agent 验收通过；**P2 结构目标达成**（模式概念退出 UI）。
- 门禁基线：shared tsc 0 错 / ai-parser tsc 0 错 / desktop tsc 0 错 / vitest **26 文件 179 用例** / `npm run build` 成功。

## 5. 验证门禁（每次改动后必须全绿）

```bash
npm run typecheck            # shared 包 tsc --noEmit
cd apps/desktop && npx tsc --noEmit
cd D:\AIProjects\physics-lab && npx vitest --run
cd apps/desktop && npm run build   # 生产构建
```

## 6. 工程坑（务必注意）

1. **`npm run build`（desktop）会向 src 输出 .js/.d.ts/.map 编译产物**，会遮蔽 .ts 源（导致旧代码被加载、单测假结果）。
   - 构建后**必须清理**：删除未跟踪的 `*.js / *.js.map / *.d.ts / *.d.ts.map`（保留 `vite-env.d.ts` 与源文件）。
   - 清理脚本模式（PowerShell，通过脚本文件执行）见历史；或 `git ls-files --others --exclude-standard` 过滤后删。
   - 提交前检查 `git diff --cached --name-only` 无产物。
2. **locale JSON 用 `\uXXXX` 转义存储**（zh-CN / en-US），改后两端键数必须一致（i18n 测试校验）。
3. **不要动 tsconfig / package.json 依赖**（除非确有必要，如曾加 pdfjs-dist）。
4. `prefers-reduced-motion` 降级链要保持（S86 已加全局 media 覆盖）。
5. 打点（usage.store）保留，不删；MenuBar 导出使用数据在 帮助→开发者 子菜单。

## 7. 关键文件地图

- 解析：`packages/ai-parser/src/rule-parser.ts`（18 类型 + 诚实失败守卫）、`ollama-provider.ts`、`cloud-provider.ts`（OpenAI 兼容）、`localize.ts`（中文教学文本）
- 场景数据源：`packages/shared/src/constants/*-scene.ts`（18 个）、`types/physics-scene.ts`（overlay_hints）
- 教学脚本：`packages/shared/src/teaching/teaching-script-generator.ts`（generate/validate/ensure）
- 渲染教学层：`apps/desktop/src/renderer/features/experiment/components/teaching/`（TeachingLayer / PhaseCard / FormulaStrip / ForceCallout / EventPulse / formula-beautify / formula-evaluator / teaching-layer-data）
- 导出：`apps/desktop/src/renderer/lib/report.ts`（Markdown→HTML、i18n、sim 驱动参数/状态）、`lib/pdf.ts`、`lib/ocr.ts`、`lib/teaching-script-ai.ts`（AI 润色）
- 状态：`core/panel-manager.store.ts`（FIFO）、`core/teaching.store.ts`、`core/usage.store.ts`（打点）、`stores/ai-provider.store.ts`（三态+偏好）、`components/layout/SettingsDialog.tsx`
- 首页：`features/home/HomePage.tsx`；场景：`features/experiment/`（Scene3D、experiment.store）；布局：`components/layout/AppShell.tsx`、`MenuBar.tsx`、`panels/*`

## 8. 待办 / 下一步

- **S87**：快修包 + 收尾全部完成并经验收，第 18 轮已收官。
- **P2 收口确认重走查**：S82-S87 后项目负责人重做（无模式痕迹/四功能可发现/菜单可读/画布不扎堆/公式排版）。
- **Ollama 解析 e2e 全量对比**：`npx vite-node -c vitest.config.ts packages/ai-parser/test-cases/run-e2e.ts`（E2E_MAX 已支持限量，长窗口运行）。
- **S88+（2D 动画系统，下一主线）**：S88-A 已完整走查（P0 播放冻结已修复，能量条右缘已对齐 padding）；S88-B 排期已确认，B1（公共 2D 原语 + 平面类默认 2D 路由 + PhaseCard/FormulaStrip）开工中，B2 三场景（projectile/inclined_plane/ohms_law）布局规格已交付。
- 独立主线：S85 云 AI 真实题目实测——已闭环（5/5 复测通过，0 错误动画）。遗留 P1 清单（假设声明/简化提示/云端间歇性失败/润色后台回归/topic 枚举）已记录。

## 9. 并行 Agent 现状（勿动其文件）

- 产品/UX Agent 未提交文件：`docs/02_PRODUCT（产品设计）/UX_AUDIT_AI_ENGINE.md`、`TEACHING_LAYER_SPEC.md`、`TEACHING_SCRIPT_GENERATOR_SPEC.md`、`HAMMERATH_STYLE_STUDY.md`、`docs/04_PROJECT（当前状态）/DESIGN_STATUS.md`、`MENTOR_STATUS.md`、`docs/05_HISTORY/DESIGN_DECISIONS.md`、`.playwright-cli/`、`temp/` —— 留待其自行处理，**不要提交**。
- 我的提交边界：只提交自己改动的源文件与 docs/04_PROJECT、docs/05_HISTORY/CHANGELOG。
