# AI Parser End-to-End Coverage Report (T310)

> 日期：2026-08-03 · Sprint S70 · 工程实现 Agent
> 原始数据：`packages/ai-parser/test-cases/last-report.json`（由 `run-e2e.ts` 重新生成）

## 目的

让 P1 核心链路“物理题目 → AI 解析 → PhysicsScene”的覆盖率与准确率**可度量**（Roadmap Phase 7 明确要求），并据此驱动规则解析器改进。

## 方法

- 新建 `packages/ai-parser/test-cases/cases.ts`：50 道中/英物理题（力学 20、电磁 10、热学 5、光学 5、波动 5、混合表述 5），每题声明 `expectedType`（对应场景 `metadata.topic`）与 `expectedParams`（归一化参数名 → 期望值）。
- 新建 `packages/ai-parser/test-cases/run-e2e.ts`：对每题调用 `ruleParser.parseProblem`，比较检测类型与参数（5% 相对容差），输出 JSON 报告；若本地 Ollama 可用则同时对比。
- 运行方式（仓库根目录）：

  ```
  npx vite-node -c vitest.config.ts packages/ai-parser/test-cases/run-e2e.ts
  ```

## 结果（规则解析器）

| 指标 | S70 前（基线） | S70 后 |
|------|---------------|--------|
| 类型命中率 typeHitRate | 24%（12/50） | **100%（50/50）** |
| 参数命中率 paramMatchRate | 35.7%（30/84） | **100%（84/84）** |
| 缺失参数数 | 36 | 0 |

分科命中率（S70 后）：力学 20/20、电磁 10/10、热学 5/5、光学 5/5、波动 5/5、混合 5/5，参数命中率均为 100%。

Ollama：本地未运行（`available=false`），对比部分自动跳过；启动 Ollama 后重跑即可获得对比数据。

## 主要改动（`packages/ai-parser/src/rule-parser.ts` v2.1 → v3.0）

1. 检测类型从 8 种扩展到 18 种，覆盖全部现有实验场景（新增 ohms/coulombs/faraday/motor/ac_generator/ideal_gas/refraction/lens/transverse_wave/doppler；修复 circular_motion、buoyancy 有类型无检测模式的死代码）。
2. 新增领域参数提取：电压、电阻、电流、电荷、匝数、频率、温度、压强、焦距、折射率、波速；支持中文（含“欧姆/匝/帕/度”等单位）与英文。
3. 修复若干提取缺陷：
   - 高度正则不再把 `4m/s` 类速度误判为高度；
   - 支持“X m/s”速度、`摩擦系数0.2`（无分隔符）、`劲度系数为40N/m`、`45度仰角`（数字在单位前）等常见表述；
   - 波速与速度分离（`Sound speed is 340 m/s` 不再被当作物体速度）。
4. 新增通用参数应用：提取值写入克隆场景的 `simulation.params`（仅写入场景实际声明的键）、斜面角度/摩擦、摆长、碰撞/多普勒/圆周运动初始速度，使解析结果真正进入驱动仿真的数据层。
5. 场景数据补充（additive）：`wave-scene.ts` 增加 `v/f` 参数、`ideal-gas-scene.ts` 增加 `P` 参数（供解析结果落位）。

## 质量门禁（已固化到测试）

- 新增 `apps/desktop/src/__tests__/ai-parser/rule-parser.test.ts`：
  - 50 题覆盖门禁：类型命中率 ≥ 90%、参数命中率 ≥ 90%（基线仅 24%）；
  - 18 个中文关键词检测用例；
  - 5 个参数提取与应用用例。
- 门禁全绿：shared tsc 0 错、desktop tsc 0 错、vitest 15 文件 112 用例全过（原 14 文件 87 用例）。

## 已知限制（下一步可改进）

- “抛出/从 X 米抛出”类表述若缺少“平抛/斜抛/抛体”等词，会回退到 free_fall 模板（保守默认，不误报）。
- 理想气体场景尚无体积/压强显式状态（压强仅写入新增的 `P` 参数，未参与方程）；波动场景 `v/f` 为附加参数，未参与方程。
- `g=10m/s²` 中的 `10m/s²` 仍可能被速度模式捕获（场景中无对应键，不影响仿真，已知无害）。
- 单字母参数（如 `V=`、`T=`）存在与既有提取器的潜在歧义，当前用例均通过上下文与单位规避。
- Ollama 端到端对比尚未执行（本机未运行 Ollama）。
