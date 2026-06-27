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
/** Capture Three.js canvas as PNG data URL */
export declare function captureScreenshot(): string | null;
/** Generate HTML report with embedded screenshot */
export declare function generateHTMLReport(data: ReportData, locale: string): string;
export declare function downloadFile(content: string, filename: string, mimeType: string): void;
//# sourceMappingURL=report.d.ts.map