# S21 增量系统设计文档

> **版本**: v1.0 | **日期**: 2026-06-28 | **基于**: S21_PRD.md + 现状代码审计

---

## 1. 技术选型

| 包名 | 版本 | 安装位置 | 理由 |
|------|------|---------|------|
| `jspdf` | ^2.5.2 | apps/desktop (deps) | PDF 生成核心库，Electron 兼容性好，社区活跃 |
| `html2canvas` | ^1.4.1 | apps/desktop (deps) | DOM → Canvas 截图，配合 jsPDF 实现富文本 PDF |
| `vitest` | ^2.1.0 | root (devDeps) | Vite 原生测试框架，与现有 Vite5 配置零冲突 |
| `@testing-library/react` | ^16.1.0 | apps/desktop (devDeps) | React 组件测试事实标准 |
| `@testing-library/jest-dom` | ^6.6.0 | apps/desktop (devDeps) | DOM 断言扩展（toBeInTheDocument 等） |
| `jsdom` | ^25.0.0 | root (devDeps) | 测试环境模拟浏览器 DOM |

---

## 2. 文件变更清单

| 路径 | 操作 | 说明 |
|------|------|------|
| `apps/desktop/src/renderer/lib/report.ts` | **修改** | 新增 `generatePDFReport()` / `downloadPDFReport()`；修复 `captureScreenshot()` 选择器 |
| `apps/desktop/src/renderer/lib/csv.ts` | **新建** | 从 DataPanel 抽出的 CSV 导出逻辑：`generateCSV()` / `downloadCSV()` |
| `apps/desktop/src/renderer/components/panels/DataPanel.tsx` | **修改** | Table 视图加能量列/相位列；CSV 按钮改调 csv.ts；统一采样率 |
| `apps/desktop/src/renderer/components/panels/RightPanel.tsx` | **修改** | 新增 Export 按钮组（PDF / MD / CSV / 截图） |
| `vitest.config.ts` | **新建** | root 层测试配置（jsdom 环境、路径别名、coverage 阈值） |
| `apps/desktop/src/__tests__/lib/report.test.ts` | **新建** | report.ts 单元测试（generateMarkdownReport / generateHTMLReport / downloadReport） |
| `apps/desktop/src/__tests__/lib/csv.test.ts` | **新建** | csv.ts 单元测试（generateCSV / BOM 编码 / 能量列计算） |
| `apps/desktop/package.json` | **修改** | 加 jspdf+html2canvas 依赖 + test script |
| `package.json` (root) | **修改** | 加 vitest + jsdom + test script |
| `docs/04_PROJECT（当前状态）/TODO.md.txt` | **修改** | 更新至 V2.1 S20 状态 |

---

## 3. 详细设计

### 3.1 PDF 导出模块 (`lib/report.ts`)

```typescript
// ---- 新增依赖 ----
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// ---- 核心函数签名 ----

/** 使用 html2canvas + jsPDF 生成 PDF 报告 */
export async function generatePDFReport(
  data: ReportData,
  locale: string,
  options?: {
    canvasSelector?: string;    // 默认 "#physics-canvas"
    fontName?: string;           // 默认 "Microsoft YaHei"（Win）/ "PingFang SC"（macOS）
    quality?: number;            // 默认 2（高分辨率）
  }
): Promise<Blob>;

/** 生成 PDF Blob 并触发下载 */
export async function downloadPDFReport(
  data: ReportData,
  locale: string,
  filename?: string              // 默认 "{实验名}_{timestamp}.pdf"
): Promise<void>;
```

**核心逻辑**：
1. 先调用 `generateHTMLReport(data, locale)` 生成 HTML 字符串
2. 将 HTML 注入隐藏 `<div id="pdf-render-target">`
3. 用 `html2capture(div, { scale: 2 })` 渲染为 Canvas
4. 用 `jsPDF('p', 'mm', 'a4')` 创建 PDF，逐页添加 Canvas 图片
5. 清理隐藏 div，返回 Blob

**中文方案**：
- jsPDF 默认不支持 CJK，采用**图片嵌入法**（html2canvas 将文字渲染为像素后插入 PDF）
- 备选：若图片法质量不足，改用 Electron 主进程 `webContents.printToPDF()`

### 3.2 截图修复 (`lib/report.ts` 第 114-118 行)

```typescript
// ---- 当前代码（有问题） ----
export function captureScreenshot(): string | null {
  const canvas = document.querySelector("canvas");  // ⚠️ 选择器太宽泛
}

// ---- 修复后 ----
const CANVAS_SELECTOR = "#physics-canvas"; // Three.js Canvas 的固定 ID

export function captureScreenshot(
  selector: string = CANVAS_SELECTOR
): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>(selector);
  if (!canvas) return null;
  try {
    return canvas.toDataURL("image/png");
  } catch {
    // CORS/taint fallback: 返回空但不抛异常
    console.warn("[report] Canvas tainted, screenshot unavailable");
    return null;
  }
}
```

### 3.3 CSV 导出模块 (`lib/csv.ts`) — 新文件

```typescript
import type { CachedFrame } from "../features/experiment/experiment.store";

/** CSV 列配置 */
export interface CSVColumnConfig {
  key: string;
  header: string;
  precision: number;
  /** 可选的值转换函数（如能量计算） */
  transform?: (frame: CachedFrame, ctx: CSVEnergyContext) => number;
}

export interface CSVEnergyContext {
  mass: number;
  gravity: number;
}

export interface CSVExportOptions {
  frames: CachedFrame[];
  energyContext: CSVEnergyContext;
  sampleRate?: number;        // 默认 SAMPLE_RATE
  includeEnergy?: boolean;    // 默认 true
  filenamePrefix?: string;   // 默认 "physics-lab-data"
}

/** 统一采样率常量（解决 Live/Table/CSV 不一致问题） */
export const SAMPLE_RATE = 10;

/** 生成 CSV 字符串（含 UTF-8 BOM） */
export function generateCSV(options: CSVExportOptions): string;

/** 触发 CSV 文件下载 */
export function downloadCSV(csvContent: string, filename: string): void;

/** 计算单帧能量值（纯函数，可独立测试） */
export function calculateFrameEnergy(
  frame: CachedFrame,
  ctx: CSVEnergyContext
): { ke: number; pe: number; totalE: number };
```

**核心逻辑 — generateCSV**：
```
1. 按 sampleRate 采样 frames
2. 构建 header 行：time,ballX,ballY,velocity,acceleration,phaseId[,(KE),(PE),(TotalE)]
3. 每帧调用 calculateFrameEnergy 计算 energy（如果 includeEnergy）
4. 所有数值 toFixed(3)
5. 前置 UTF-8 BOM (\uFEFF)，确保 Excel 正确识别编码
6. join("\n") 返回完整字符串
```

### 3.4 DataPanel Table 视图增强 (`DataPanel.tsx` 第 96-121 行)

**变更点**：
- Table `<thead>` 新增 3 列：`KE (J)` / `PE (J)` / `TotalE (J)`
- `<tbody>` 每行对应位置追加 3 个 `<td>`
- 采样率从硬编码 `i % 6 === 0` 改为引用 `SAMPLE_RATE`（来自 csv.ts）
- phaseId 显示改为映射相位名称（从 store 的 `phases` 数组查找）
- 高亮行阈值放宽：`Math.abs(f.time - currentTime) < 0.05`
- CSV 按钮点击改为调用 `downloadCSV(generateCSV(opts), filename)`

### 3.5 RightPanel 导出按钮组 (`RightPanel.tsx`)

**新增 UI 结构**（在 TAB 区域下方、内容区上方）：

```tsx
{/* Export Button Group — 仅当 scene 存在时显示 */}
{scene && (
  <div className="px-3 py-2 border-t border-slate-800">
    <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1.5">Export</div>
    <div className="grid grid-cols-4 gap-1">
      <ExportButton label="PDF" icon="📄" onClick={handleExportPDF} />
      <ExportButton label="MD" icon="📝" onClick={handleExportMD} />
      <ExportButton label="CSV" icon="📊" onClick={handleExportCSV} />
      <ExportButton label="截图" icon="🖼️" onClick={handleScreenshot} />
    </div>
  </div>
)}
```

每个按钮调用对应的 lib 函数：
- PDF → `downloadPDFReport(buildReportData(), locale)`
- MD → `downloadReport(generateMarkdownReport(...), filename)`
- CSV → `downloadCSV(generateCSV({...}), filename)`
- 截图 → `captureScreenshot()` + 触发图片下载

### 3.6 Vitest 测试配置 (`root/vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["apps/desktop/src/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@physics-lab/shared": path.resolve(__dirname, "packages/shared/src"),
      "@physics-lab/ai-parser": path.resolve(__dirname, "packages/ai-parser/src"),
    },
  },
});
```

---

## 4. 任务分解表

| ID | 描述 | 文件 | 验收标准 | 依赖 |
|----|------|------|---------|------|
| T21-01 | 安装新依赖 (jspdf/html2canvas/vitest/jsdom/testing-library) | package.json (×2) | `pnpm install` 无报错；`pnpm test -- --run` 输出 vitest 启动信息 | - |
| T21-02 | 创建 vitest.config.ts 并通过 smoke test | root/vitest.config.ts | `pnpm test -- --run` 无错误退出 | T21-01 |
| T21-03 | 修复 captureScreenshot 选择器 | lib/report.ts | 接受可选 selector 参数；默认 `#physics-canvas`; 单元测试覆盖正常/异常路径 | - |
| T21-04 | 实现 lib/csv.ts（generateCSV/downloadCSV/calculateFrameEnergy） | lib/csv.ts (new) | 3 个函数均有完整签名和实现；UTF-8 BOM 正确前置；能量计算纯函数 | - |
| T21-05 | 实现 generatePDFReport / downloadPDFReport | lib/report.ts | 异步函数；返回 Promise\<Blob\>; 包含截图+参数+公式；中文渲染正常 | T21-01 |
| T21-06 | DataPanel 重构：Table 加能量列/相位列；CSV 调用迁移到 csv.ts | DataPanel.tsx | Table 7 列（原4+KE+PE+TotalE）；phaseId 映射名称；CSV 按钮调用 lib 函数 | T21-04 |
| T21-07 | RightPanel 新增导出按钮组 UI | RightPanel.tsx | 4 个按钮可见可点击；各按钮触发正确导出函数 | T21-05, T21-06 |
| T21-08 | 编写 report.ts 单元测试 | __tests__/lib/report.test.ts | 覆盖 generateMarkdownReport 中英文 / generateHTMLReport / downloadReport / captureScreenshot | T21-02 |
| T21-09 | 编写 csv.ts 单元测试 | __tests__/lib/csv.test.ts | 覆盖 generateCSV (含/不含 energy) / BOM 编码验证 / calculateFrameEnergy 数值精度 | T21-02 |
| T21-10 | TODO.md 更新 + 临时文件清理 | docs/.../TODO.md.txt | 版本号更新为 V2.1/S20；删除过时条目 | - |

**推荐执行顺序**：T21-01 → T21-02 → [T21-03 || T21-04] → T21-05 → T21-06 → T21-07 → [T21-08 || T21-09] → T21-10

---

## 5. 公共 TypeScript 接口定义

```typescript
// ==================== lib/report.ts ====================

export interface ReportData {
  scene: PhysicsScene;
  params: Record<string, number>;
  currentTime: number;
  ballY: number;
  ballVelocity: number;
}

// ==================== lib/csv.ts ====================

import type { CachedFrame } from "../features/experiment/experiment.store";

export interface CSVColumnConfig {
  key: string;
  header: string;
  precision: number;
  transform?: (frame: CachedFrame, ctx: CSVEnergyContext) => number;
}

export interface CSVEnergyContext {
  mass: number;
  gravity: number;
}

export interface CSVExportOptions {
  frames: CachedFrame[];
  energyContext: CSVEnergyContext;
  sampleRate?: number;        // 默认 10
  includeEnergy?: boolean;    // 默认 true
  filenamePrefix?: string;   // 默认 "physics-lab-data"
}

export interface FrameEnergy {
  ke: number;       // 动能 = 0.5 * m * v²
  pe: number;       // 势能 = m * g * max(0, y)
  totalE: number;   // 总机械能
}
```

---

## 6. 注意事项

### 6.1 Electron 兼容性
- `html2canvas` 在 Electron renderer 进程中运行正常（已有成功案例），但需确保 Three.js Canvas 未被 taint（无跨域纹理加载）
- `jspdf` 在 Node.js/Electron 环境中无需额外 polyfill
- `Blob` / `URL.createObjectURL` 在 Electron renderer 中原生可用

### 6.2 中文方案（优先级排序）
1. **首选**：html2canvas 将中文渲染为像素 → jsPDF 插入图片（零字体依赖，但不可选中文字）
2. **备选 A**：jsPDF 嵌入系统字体（需读取 `%APPDATA%/fonts` 或 `/System/Library/Fonts`，增加复杂度）
3. **备选 B**：Electron 主进程 `webContents.printToPDF({ printBackground: true })`（质量最佳，需 IPC 通信）

S21 采用方案 1，后续 Sprint 可升级为方案 B。

### 6.3 回滚策略
- 每个任务对应独立 commit，message 格式：`S21-Txx: 描述`
- 所有新功能通过 feature flag 控制（可选，建议至少对 PDF 导出加 flag）
- 若 PDF 中文渲染失败严重，可快速回退到仅 MD/CSV 导出状态
- csv.ts 作为独立模块抽取，不影响原有 DataPanel 内联逻辑（渐进式替换）

### 6.4 已知风险缓解
| 风险 | 缓解措施 |
|------|---------|
| Canvas toDataURL 因 taint 失败 | captureScreenshot 已做 try-catch；PDF 自动跳过截图区域 |
| Vitest 与 electron-vite 冲突 | 测试文件放 `src/__tests__/` 而非根目录 tests/；避免 import main process 模块 |
| 采样率变更影响性能 | SAMPLE_RATE=10 为保守值（60fps 下每秒 6 条记录）；1000 帧实验约 166 行 CSV |

---

*文档结束 — 共约 260 行，可用于直接指导编码实施*
