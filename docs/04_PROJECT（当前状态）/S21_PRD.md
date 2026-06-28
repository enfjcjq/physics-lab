# Physics Lab — Sprint S21 增量 PRD

> **文档版本**: v1.0
> **作者**: 许清楚（Xu）— 产品经理
> **日期**: 2026-06-28
> **Sprint**: S21（V2.1 → V2.2 过渡 Sprint）
> **状态**: Draft for Review

---

## 一、项目信息

| 字段 | 内容 |
|------|------|
| 项目名称 | physics-lab |
| 当前版本 | V2.1 (S20) → 目标 V2.2 (S21) |
| 技术栈 | Electron + React + TypeScript + Three.js + Zustand + Vite + Monorepo |
| 语言 | TypeScript / 中文 UI (i18n: zh-CN + en) |
| 原始需求 | 基于 NEXT_SPRINT.md 规划，完成导出系统增强、数据面板增强、工程化基础建设 |

### 现状摘要（S20 结束时）

- **666 模块**，**6 个实验插件**，零 TypeScript 错误
- `report.ts` 已实现 Markdown/HTML 报告生成 + `captureScreenshot()`，但 **PDF 导出缺失**
- `DataPanel.tsx` 已实现 Live/Table 视图切换 + CSV 导出按钮 + 实时数据显示
- **零测试文件**，无测试框架配置（Vitest/Jest 均未搭建）
- 文档标注 V2.0(S02)，实际已是 V2.1(S20)，严重过时

---

## 二、竞品与市场调研

### 2.1 调研范围

本次调研覆盖 6 类竞品/参考产品：
1. PhET Interactive Simulations — 学术级开源仿真
2. Physlet — 教学交互式物理动画
3. Algodoo — 商业物理沙盒
4. Crosti / 移动端物理仿真 App
5. 国内竞品：NOBOOK 虚拟实验室等
6. AI+教育赛道：Khanmigo、Photomath 等

### 2.2 竞品详细分析

#### ① PhET Interactive Simulations

| 维度 | 详情 |
|------|------|
| **开发商** | Colorado 大学 Boulder 分校（诺贝尔奖得主 Carl Wieman 创立） |
| **技术栈** | HTML5/JavaScript（原 Flash 迁移） |
| **核心功能** | 160+ 互动仿真，覆盖物理/化学/生物/数学/地球科学；支持 109 种语言；基于"探究式学习"研究设计 |
| **导出能力** | ❌ 无报告/PDF 导出；❌ 无数据 CSV 导出；⚠️ 仅支持 Embed/分享链接 |
| **优势** | 学术权威性极强；完全免费开源；教育研究背书；社区庞大；多语言支持 |
| **不足** | **无 AI 驱动**——无法将题目自动转化为实验；每个仿真是独立项目，无统一数据面板；无报告生成能力；界面偏学术，不够现代 |
| **差异化机会** | Physics Lab 的 **AI Parser（题目→实验自动转化）** 是核武器级差异点 |

#### ② Physlet

| 维度 | 详情 |
|------|------|
| **开发商** | Davidson College 物理系 |
| **技术栈** | Java Applet（已淘汰）→ HTML5/JavaScript 迁移中 |
| **核心功能** | 交互式物理动画库；侧重概念可视化；配套教学资源丰富 |
| **导出能力** | ❌ 无导出功能 |
| **优势** | 深度教学整合；有大量配套习题和课程包 |
| **不足** | 技术架构老化；UI 极简甚至简陋；更新缓慢；无现代 Web 能力 |
| **差异化机会** | Physics Lab 的 3D 渲染 + Electron 桌面体验远超 Physlet 的 2D Web 动画 |

#### ③ Algodoo

| 维度 | 详情 |
|------|------|
| **开发商** | 瑞典 Algoryx Simulation AB |
| **技术栈** | C++ / 2D 物理引擎（专有） |
| **商业模式** | 免费下载（个人版），教育版收费 |
| **核心功能** | 2D 物理沙盒；用户可自由绘制形状并赋予物理属性；碰撞/流体/弹簧/电机等丰富元件 |
| **导出能力** | ⚠️ 支持截图和场景文件保存；❌ 无 PDF 报告；❌ 无结构化数据导出 |
| **优势** | 创意自由度极高；物理引擎精度高；"玩中学"体验好；商业产品 polished 程度高 |
| **不足** | **纯 2D**；无 AI 能力；偏向玩具而非教学工具；无课程对齐；无学习追踪 |
| **差异化机会** | Physics Lab = **3D + AI + 课程对齐** vs Algodoo = 2D 沙盒玩具。目标人群不同，不直接竞争 |

#### ④ Crosti / 移动端物理仿真 App（牛顿摆等）

| 维度 | 详情 |
|------|------|
| **代表产品** | Crosti（牛顿摆/链式反应）、Physics Toolbox Suite、Pocket Physics |
| **技术栈** | Native iOS/Android 或 Unity |
| **核心功能** | 轻量级单现象演示；手机传感器集成（加速度计/陀螺仪） |
| **导出能力** | ❌ 几乎全部不支持导出 |
| **优势** | 便携；利用手机硬件；即开即用 |
| **不足** | 功能单一；无系统性学习路径；广告多（免费版）；数据精度有限 |
| **差异化机会** | Physics Lab 定位桌面深度学习工具，与移动端轻量 App 不在同一层级竞争 |

#### ⑤ NOBOOK 虚拟实验室（国内竞品）

| 维度 | 详情 |
|------|------|
| **开发商** | 北京亚泰盛华科技有限公司（NOBOOK） |
| **技术栈** | 自研引擎（疑似 WebGL/Canvas） |
| **商业模式** | B2B 向学校/教育局销售 + C端 APP 付费 |
| **核心功能** | 物理/化学/生物虚拟实验全覆盖（小初高教材同步）；3D 实验器材操作；教师备课工具 |
| **导出能力** | ⚠️ 支持实验报告生成（B2B 版）；C端能力未知 |
| **优势** | **教材同步是杀手锏**——直接对标中考/高考实验考点；B2B 渠道强；本土化好 |
| **不足** | 闭源商业软件，社区弱；无 AI 解题能力；C端体验参差；价格不透明 |
| **差异化机会** | Physics Lab 的 **AI 自动化**（输入题目→输出实验）vs NOBOOK 的 **人工预设实验库**。AI 路线长期更有扩展性 |

#### ⑥ AI+教育赛道参考

| 产品 | 核心能力 | 实验可视化？ |
|------|---------|-------------|
| **Khanmigo** (Khan Academy) | GPT 驱动的个性化辅导；苏格拉底式对话引导；作文批改 | ❌ 无——纯文本/语音交互 |
| **Photomath** | 拍照识题→逐步解题→数学公式识别 | ⚠️ 有数学图形渲染但非物理实验 |
| **Microsoft Math Solver** | 类似 Photomath，支持手写识别 | ❌ 无 |
| **ChatGPT + Code Interpreter** | 通用 AI，可用 Python 做物理模拟 | ⚠️ 需编程能力，门槛高 |

**关键发现**：**整个 AI+教育赛道目前没有任何产品实现了"AI 解题 → 3D 物理实验 → 结构化报告导出"的完整闭环。** 这是 Physics Lab 独有的蓝海定位。

### 2.3 竞品矩阵总结

```
                    高教学深度
                      ↑
     NOBOOK ●        |         PhET ●
              \       |       /
               \      |      /
    Algodoo ·····●----+----●····· Physics Lab ★（我们的位置）
                 /     |     \
                /      |      \
    Mobile Apps ···●   |    ···● Khanmigo
                      |
低 AI 能力 ←————————————————→ 高 AI 能力
```

### 2.4 差异化竞争策略（S21 及后续）

| 战略方向 | 具体行动 | 竞争壁垒 |
|---------|---------|---------|
| **AI 闭环独占** | 题目 → 实验 → 数据 → 报告 全自动化 | 已有 Rule-Based Parser，后续接 LLM 更强 |
| **报告导出能力** | PDF/Markdown/CSV 多格式导出 | 竞品几乎全部空白 |
| **3D 沉浸体验** | Three.js 渲染 vs 竞品的 2D/伪 3D | Electron 原生性能 |
| **开源透明度** | MIT 开源 vs NOBOOK/Algodoo 闭源 | 社区信任 + 贡献者生态 |

---

## 三、S21 增量需求定义

### 3.1 Product Goals（本 Sprint 目标）

1. **补齐导出最后一公里**：让用户能将实验成果以 PDF/MD/CSV 三种格式带走，形成"做实验 → 拿结果"完整闭环
2. **数据可见性增强**：从"看动画"升级为"读数据"，让学生能定量分析物理规律
3. **工程健康度归零**：消除"零测试"技术债，建立可持续的质量保障体系

### 3.2 User Stories

| # | User Story | Priority |
|---|-----------|----------|
| US-01 | As a 中学生, I want 将我的实验结果导出为 PDF 报告, so that 我可以提交给老师或放入学习档案 | P0 |
| US-02 | As a 教师, I want 批量导出学生实验数据的 CSV 文件, so that 我可以用 Excel 进一步分析班级整体表现 | P0 |
| US-03 | As a 学生, I want 在表格视图中看到每一帧的位置/速度/能量数据, so that 我可以验证物理公式的正确性 | P1 |
| US-04 | As a 开发者/贡献者, I want 核心模块有单元测试覆盖, so that 我可以放心重构而不引入回归缺陷 | P2 |
| US-05 | As a 用户, I want 截图包含在导出报告中, so that 我的报告图文并茂更专业 | P0 |

---

## 四、技术规范

### 4.1 P0：导出系统增强

#### 4.1.1 PDF 报告导出

**需求描述**：扩展现有 `report.ts`，新增 PDF 导出能力。

**技术方案建议**：

| 方案 | 库 | 优点 | 缺点 | 推荐度 |
|------|-----|------|------|--------|
| A | `jspdf` + `html2canvas` | 成熟稳定；Electron 兼容好；社区大 | 中文需额外字体处理 | ⭐⭐⭐ **首选** |
| B | `pdf-lib` | 纯 JS，无依赖 | 需手动排版复杂布局 | ⭐⭐ 备选 |
| C | Electron `webContents.printToPDF()` | 原生能力，质量最高 | 需主进程通信；异步流程复杂 | ⭐⭐ 可行但不优先 |
| D | `@react-pdf/renderer` | React 组件化 PDF | 学习成本；与现有 report.ts 架构不一致 | ⭐ 不推荐 |

**推荐方案 A**：`jspdf` + `html2canvas`

**Acceptance Criteria**：
- [ ] 点击"Export PDF"按钮后，生成包含以下内容的 PDF 文件：
  - [ ] 实验标题 + 元信息（学科/难度/年级）
  - [ ] 3D 视口截图（复用已有 `captureScreenshot()`）
  - [ ] 参数表（初速度、重力加速度等）
  - [ ] 当前时刻的状态快照（t, y, v, a）
  - [ ] 公式列表
  - [ ] 知识点摘要
- [ ] PDF 文件名格式：`{实验名称}_{时间戳}.pdf`
- [ ] 支持中文字体渲染（不乱码）
- [ ] PDF 导出耗时 < 3 秒（常规实验）

**涉及文件修改**：
- `apps/desktop/src/renderer/lib/report.ts` — 新增 `generatePDFReport()`, `downloadPDFReport()`
- `apps/desktop/src/renderer/components/panels/` — 可能需要新增 ExportButton 组件或嵌入 RightPanel

#### 4.1.2 Markdown 导出验证与完善

**现状分析**：`generateMarkdownReport()` 已实现（97 行），`downloadReport()` 已实现。

**需要验证/完善的项目**：
- [ ] 验证 Markdown 导出的实际可用性（点击下载是否正常工作）
- [ ] 确认 i18n 下中英文切换是否正确
- [ ] 检查导出的 Markdown 在典型编辑器（Typora、VS Code、GitHub）中的渲染效果
- [ ] 如有问题，修复 Bug 即可（非重写）

**验收标准**：Markdown 导出功能正常，内容完整，中英文均可正确导出

#### 4.1.3 CSV 图表数据导出验证

**现状分析**：`DataPanel.tsx` 已实现 `exportCSV()` 函数（第 22-37 行），包含：
- 每 10 帧采样一次
- 导出字段：time, ballX, ballY, velocity, acceleration, phaseId
- 固定文件名 `physics-lab-data.csv`

**需要验证/完善的项目**：
- [ ] 验证 CSV 导出按钮点击是否触发下载
- [ ] 验证 frameCache 是否在所有 6 个实验插件中被正确填充
- [ ] **改进**：文件名动态化为 `{实验名}_data.csv`
- [ ] **改进**：增加能量列（KE, PE, TotalE）到 CSV
- [ ] **改进**：添加 UTF-8 BOM 以确保 Excel 正确打开中文

**验收标准**：CSV 导出正常，包含完整物理量数据，Excel 打开不乱码

#### 4.1.4 3D 视口截图

**现状分析**：`captureScreenshot()` 已实现（第 114-118 行），使用 `canvas.toDataURL('image/png')`。

**需要验证的项目**：
- [ ] 验证在 Electron Renderer 进程中是否能正确获取 Three.js Canvas
- [ ] 验证截图分辨率是否足够用于 PDF 嵌入（建议 ≥ 1280×720）
- [ ] 验证截图是否包含完整的 3D 场景（物体、坐标轴、地面等）

**潜在问题**：如果 Canvas 存在 CORS/taint 问题导致 `toDataURL()` 失败，需要改用 Electron 主进程的 `nativeImage` API。

**验收标准**：截图功能正常，图片清晰可嵌入 PDF/HTML 报告

### 4.2 P1：数据面板增强

#### 4.2.1 实时数据表增强

**现状**：Table 视图已实现（第 96-121 行），显示 t/y/v/a 四列，每 6 帧采样，最多 50 行。

**增量需求**：

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| 增加能量列 | Table 新增 KE / PE / TotalE 三列 | P1 |
| 增加相位列 | 显示当前 phaseId 对应的阶段名称（如"上升段"、"下落段"）| P1 |
| 虚拟滚动 | 当 frameCache > 1000 条时启用虚拟滚动，避免 DOM 性能问题 | P2 |
| 高亮当前帧 | 当前播放时刻对应的行高亮（已部分实现，需验证效果） | P1 |
| 列宽可调 | 用户可拖拽调整列宽 | P2 |

**验收标准**：Table 视图显示完整物理量数据（位置/速度/加速度/能量/相位），数据实时更新

#### 4.2.2 图表/表格视图切换优化

**现状**：Live/Table 双视图切换已实现。

**增量需求**：

| 需求项 | 描述 | 优先级 |
|--------|------|--------|
| Chart 视图 | 新增第三种视图：内嵌折线图（y-t, v-t, E-t 曲线）| P1（降为 S22） |
| 视图记忆 | 记住用户上次选择的视图模式（localStorage）| P2 |
| 全屏数据面板 | 支持展开 DataPanel 为独立浮动窗口 | P2 |

**说明**：Chart 视图涉及图表库选型（recharts / chart.js / lightweight-charts），工作量较大，**建议移至 S22 实现**。S21 专注于验证和优化已有的 Live/Table 视图。

### 4.3 P2：代码优化与工程化

#### 4.3.1 Vitest 测试框架搭建

**需求描述**：从零搭建前端单元测试基础设施。

**实施步骤**：

```bash
# 1. 安装依赖
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom

# 2. 创建配置文件
# vitest.config.ts / vitest.workspace.ts
```

**配置要点**：
- 使用 `jsdom` 环境（非 happy-dom，因为 React 测试生态更成熟）
- 配置路径别名（`@physics-lab/*`）
- 设置 coverage 阈值（初期目标：核心模块 ≥ 60%）
- 添加 `test` script 到 package.json

**验收标准**：`pnpm test` 可运行，基础配置通过 smoke test

#### 4.3.2 核心模块单元测试

**首批覆盖模块**（按 ROI 排序）：

| 序号 | 模块 | 文件路径 | 测试重点 | 目标覆盖率 |
|------|------|---------|---------|-----------|
| 1 | report.ts | `lib/report.ts` | generateMarkdownReport / downloadReport / captureScreenshot / generateHTMLReport | 90% |
| 2 | experiment.store.ts | `features/experiment/experiment.store.ts` | 状态初始化 / action dispatch / FrameCache 操作 | 70% |
| 3 | DataPanel.tsx | `components/panels/DataPanel.tsx` | CSV 导出 / 视图切换 / 数值计算 | 80% |
| 4 | i18n | `core/i18n` | locale 切换 / key 存在性检查 | 60% |
| 5 | parser | `features/parser/` | 正则匹配规则 / PhysicsScene 生成 | 70% |

**验收标准**：
- [ ] 至少 3 个核心模块有测试文件
- [ ] 总测试用例数 ≥ 20
- [ ] 所有测试通过（CI 绿色）

#### 4.3.3 清理临时文件和过时文档

| 清理项 | 操作 |
|--------|------|
| TODO.md（标注 V2.0/S02） | 更新至 V2.1/S20 状态，或删除合并入 PROJECT_STATUS.md |
| .gitattributes 缺失 | 新增 `.gitattributes`（`* text=auto eol=lf`）解决 LF/CRLF 警告 |
| node_modules 中的残留临时文件 | gitignore 补全检查 |
| 未使用的 import/变量 | TypeScript strict 模式下应已报错，如有遗漏则清理 |

#### 4.3.4 代码质量审查建议

基于 S20 代码走读发现的改进方向（供架构师参考，不一定在本 Sprint 全部实施）：

| # | 问题 | 建议 | 严重程度 |
|---|------|------|---------|
| 1 | `captureScreenshot()` 用 `document.querySelector("canvas")` 选择器过于宽泛 | 改为选择特定 id/class 的 canvas，或通过参数传入 ref | Medium |
| 2 | CSV 导出逻辑硬编码在组件内 | 抽取到 `lib/csv.ts` 工具函数，便于复用和测试 | Low |
| 3 | `frameCache` 采样策略分散（CSV 每 10 帧，Table 每 6 帧） | 统一为可配置的采样率常量 | Low |
| 4 | DataPanel 中物理量计算（KE/PE）直接写在组件内 | 考虑抽取为纯函数 `calculateEnergy(state)` 便于测试 | Low |
| 5 | 无 Error Boundary | 为 DataPanel 和 CenterPanel 添加错误边界 | Medium |

---

## 五、UI 设计草案

### 5.1 导出功能入口设计

**位置**：RightPanel（右侧面板）顶部区域，新增 "Export" 按钮组

```
┌──────────────────────────────┐
│  ⚙️ Parameters          [→]  │
│  📊 Data                  [→] │
│  📝 Export  ▼             ← 新增│
│     ├── 📄 PDF Report         │
│     ├── 📝 Markdown           │
│     ├── 📊 CSV Data           │
│     └── 🖼️ Screenshot Only    │
└──────────────────────────────┘
```

### 5.2 PDF 报告模板布局

```
╔══════════════════════════════════════╗
║  Physics Lab 实验报告                  ║
║  ────────────────────────────────     ║
║  自由落体实验 | 2026-06-28 10:30      ║
║                                        ║
║  ┌─────────────────────────────┐       ║
║  │                             │       ║
║  │    [3D 视口截图]            │       ║
║  │                             │       ║
║  └─────────────────────────────┘       ║
║                                        ║
║  ## 实验概述                           ║
║  - 题目: 自由落体运动                   ║
║  - 学科: 物理                          ║
║  - 难度: 初级                          ║
║                                        ║
║  ## 实验参数                           ║
║  | 参数 | 数值 | 单位 |               ║
║  | g    | 9.8  | m/s²|               ║
║  | h₀   | 10.0 | m   |               ║
║                                        ║
║  ## 公式                               ║
║  y = y₀ - ½gt²                         ║
║  v = gt                                ║
║                                        ║
║  ## 知识点                             ║
║  💡 重力加速度 g ≈ 9.8 m/s²            ║
╚══════════════════════════════════════╝
```

---

## 六、Open Questions

| # | 问题 | 影响 | 建议 | 负责人确认 |
|---|------|------|------|-----------|
| Q1 | PDF 中文字体方案？Electron 环境下系统字体可用性 | 影响方案 A 的可行性 | 优先尝试系统字体（Microsoft YaHei / PingFang SC），备选嵌入 NotoSansSC 子集 | 待确认 |
| Q2 | PDF 导出是否需要用户选择内容范围？（仅截图 / 完整报告 / 含数据分析） | 影响 UI 复杂度 | S21 先只做"完整报告"一种模式，后续迭代 | 待确认 |
| Q3 | Vitest 配置放在 monorepo root 还是 apps/desktop？ | 影响共享代码测试策略 | root 层放 vitest.config.ts，各 app 可 override | 建议 root |
| Q4 | CSV 编码方案：UTF-8 BOM vs GBK？ | 影响国内 Excel 兼容性 | UTF-8 BOM（兼容 WPS / Office 2016+）| 推荐 BOM |
| Q5 | S21 是否纳入 Chart 视图（折线图）？ | 影响范围 | 基于工作量评估，建议移至 S22 | 建议延后 |

---

## 七、S21 任务拆解（建议 WBS）

### Phase 1: P0 导出系统（预计 60% 工作量）

| Task ID | 任务 | 依赖 | 估时 |
|---------|------|------|------|
| T2.1.1 | 安装 jspd f + html2canvas 依赖 | - | 0.5h |
| T2.1.2 | 实现 `generatePDFReport()` 函数（含中文支持） | T2.1.1 | 4h |
| T2.1.3 | 验证 Markdown 导出端到端流程 | - | 1h |
| T2.1.4 | 完善 CSV 导出（动态文件名 + 能量列 + BOM） | - | 2h |
| T2.1.5 | 验证 `captureScreenshot()` 并修复问题 | - | 2h |
| T2.1.6 | 实现 RightPanel 导出按钮 UI | T2.1.2 | 2h |
| T2.1.7 | 导出功能端到端联调 | T2.1.2-T2.1.6 | 2h |

### Phase 2: P1 数据面板（预计 20% 工作量）

| Task ID | 任务 | 依赖 | 估时 |
|---------|------|------|------|
| T2.2.1 | Table 视图增加 KE/PE/TotalE 列 | - | 1h |
| T2.2.2 | Table 视图增加相位名称显示 | - | 1h |
| T2.2.3 | 当前帧高亮效果优化 | - | 1h |
| T2.2.4 | DataPanel 组件单元测试 | Phase 3 搭建完成后 | 2h |

### Phase 3: P2 工程化（预计 20% 工作量）

| Task ID | 任务 | 依赖 | 估时 |
|---------|------|------|------|
| T2.3.1 | Vitest 框架安装 + 配置 | - | 2h |
| T2.3.2 | report.ts 单元测试 | T2.3.1 | 2h |
| T2.3.3 | experiment.store.ts 单元测试 | T2.3.1 | 3h |
| T2.3.4 | parser 单元测试 | T2.3.1 | 2h |
| T2.3.5 | 文档清理 + .gitattributes | - | 1h |
| T2.3.6 | 代码质量问题清单输出 | - | 1h |

**总计预估**: ~29.5h（1 人约 4 个工作日，或 2 人并行约 2-3 天）

---

## 八、成功指标（Definition of Done）

- [ ] PDF 导出功能可用，生成的 PDF 包含截图+参数+公式，中文正常显示
- [ ] Markdown 导出经验证无 Bug
- [ ] CSV 导出包含能量数据，Excel 打开不乱码
- [ ] DataPanel Table 视图新增能量列和相位列
- [ ] Vitest 框架搭建完成，`pnpm test` 可运行
- [ ] 至少 3 个核心模块有测试覆盖，总用例 ≥ 20
- [ ] TODO.md 更新至 V2.1/S20 或归档
- [ ] .gitattributes 就位，LF/CRLF 警告消失
- [ ] 零 TypeScript 编译错误（保持 S20 标准）
- [ ] 零已知 regression（6 个实验插件功能不变）

---

## 九、风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Electron 中 jspdf 中文渲染异常 | 中 | 高 | 预研阶段先做 spike；备选方案 printToPDF |
| html2canvas 截取 Three.js Canvas 时跨域失败 | 低 | 高 | 已有 `captureScreenshot()` 直接调用 `toDataURL()` 作为 fallback |
| Vitest 与现有 Vite/Electron 配置冲突 | 中 | 中 | 参考 electron-vite 模板的测试配置最佳实践 |
| S21 范围蔓延（加入过多新特性） | 中 | 中 | 严格按 P0>P1>P2 优先级执行，P2 可裁剪 |

---

*本文档由产品经理许清楚（Xu）基于 NEXT_SPRINT.md + 现状代码审计 + 竞品调研输出，供团队 S21 Planning 使用。*
