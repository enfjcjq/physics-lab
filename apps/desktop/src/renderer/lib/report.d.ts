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
//# sourceMappingURL=report.d.ts.map