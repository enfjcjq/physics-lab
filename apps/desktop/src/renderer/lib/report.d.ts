import type { PhysicsScene } from "@physics-lab/shared";
export interface ReportData {
    scene: PhysicsScene;
    params: Record<string, number>;
    currentTime: number;
    ballY: number;
    ballVelocity: number;
}
export declare function generateMarkdownReport(data: ReportData, locale: string): string;
export declare function downloadReport(content: string, filename: string): void;
/**
 * 捕获 Three.js 画布为 PNG data URL
 * @param selector - 目标 canvas 的 CSS 选择器，默认 #physics-canvas
 * @returns PNG data URL 字符串；canvas 不存在或 tainted 时返回 null
 */
export declare function captureScreenshot(selector?: string): string | null;
/** Generate HTML report with embedded screenshot */
export declare function generateHTMLReport(data: ReportData, locale: string): string;
export declare function downloadFile(content: string, filename: string, mimeType: string): void;
/**
 * 使用 html2canvas + jsPDF 生成 PDF 报告
 * 采用图片嵌入法：将 HTML 渲染为 Canvas 再插入 PDF，解决 CJK 字体问题
 *
 * @param data - 报告数据
 * @param locale - 语言标识 ("zh-CN" | "en")
 * @param options - 可选配置
 * @returns Promise<Blob> — PDF 文件的 Blob 对象
 */
export declare function generatePDFReport(data: ReportData, locale: string, options?: {
    canvasSelector?: string;
    quality?: number;
}): Promise<Blob>;
/**
 * 生成 PDF 并触发下载
 * @param data - 报告数据
 * @param locale - 语言标识
 * @param filename - 文件名，默认 "{实验名}_{timestamp}.pdf"
 */
export declare function downloadPDFReport(data: ReportData, locale: string, filename?: string): Promise<void>;
//# sourceMappingURL=report.d.ts.map