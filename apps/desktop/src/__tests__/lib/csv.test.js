import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateFrameEnergy, generateCSV, downloadCSV, SAMPLE_RATE, } from "../../renderer/lib/csv";
// ==================== Mock Data ====================
function createMockFrames(count) {
    const frames = [];
    for (let i = 0; i < count; i++) {
        const t = i * (1 / 60); // 60fps
        frames.push({
            time: t,
            ballX: 0,
            ballY: 10 - 4.9 * t * t,
            ball2X: 0,
            ball2Y: 0,
            ballVelocity: -9.8 * t,
            ballAcceleration: -9.8,
            isOnGround: false,
            phaseId: "freefall",
        });
    }
    return frames;
}
const DEFAULT_CTX = { mass: 2, gravity: 9.8 };
// ==================== SAMPLE_RATE 常量 ====================
describe("SAMPLE_RATE", () => {
    it("应为 10", () => {
        expect(SAMPLE_RATE).toBe(10);
    });
});
// ==================== calculateFrameEnergy ====================
describe("calculateFrameEnergy", () => {
    it("应正确计算动能 KE = 0.5 * m * v^2", () => {
        const frame = {
            time: 1, ballX: 0, ballY: 5, ball2X: 0, ball2Y: 0,
            ballVelocity: -10, ballAcceleration: -9.8, isOnGround: false, phaseId: "test",
        };
        const result = calculateFrameEnergy(frame, { mass: 2, gravity: 9.8 });
        // KE = 0.5 * 2 * (-10)^2 = 100
        expect(result.ke).toBeCloseTo(100, 3);
    });
    it("应正确计算势能 PE = m * g * max(0, y)", () => {
        const frame = {
            time: 1, ballX: 0, ballY: 5, ball2X: 0, ball2Y: 0,
            ballVelocity: -10, ballAcceleration: -9.8, isOnGround: false, phaseId: "test",
        };
        const result = calculateFrameEnergy(frame, { mass: 2, gravity: 9.8 });
        // PE = 2 * 9.8 * 5 = 98
        expect(result.pe).toBeCloseTo(98, 3);
    });
    it("y 为负时势能应为 0（地面以下不做功）", () => {
        const frame = {
            time: 5, ballX: 0, ballY: -3, ball2X: 0, ball2Y: 0,
            ballVelocity: -20, ballAcceleration: -9.8, isOnGround: true, phaseId: "test",
        };
        const result = calculateFrameEnergy(frame, { mass: 2, gravity: 9.8 });
        expect(result.pe).toBe(0);
    });
    it("总机械能 TotalE 应等于 KE + PE", () => {
        const frame = {
            time: 1, ballX: 0, ballY: 5, ball2X: 0, ball2Y: 0,
            ballVelocity: -10, ballAcceleration: -9.8, isOnGround: false, phaseId: "test",
        };
        const result = calculateFrameEnergy(frame, { mass: 2, gravity: 9.8 });
        expect(result.totalE).toBeCloseTo(result.ke + result.pe, 6);
    });
    it("静止物体的能量应只有势能（v=0 → KE=0）", () => {
        const frame = {
            time: 0, ballX: 0, ballY: 10, ball2X: 0, ball2Y: 0,
            ballVelocity: 0, ballAcceleration: -9.8, isOnGround: false, phaseId: "test",
        };
        const result = calculateFrameEnergy(frame, { mass: 2, gravity: 9.8 });
        expect(result.ke).toBe(0);
        expect(result.pe).toBeCloseTo(196, 3); // 2 * 9.8 * 10
        expect(result.totalE).toBeCloseTo(196, 3);
    });
});
// ==================== generateCSV ====================
describe("generateCSV", () => {
    it("应以 UTF-8 BOM 开头（确保 Excel 兼容）", () => {
        const frames = createMockFrames(20);
        const csv = generateCSV({ frames, energyContext: DEFAULT_CTX });
        expect(csv.startsWith("\uFEFF")).toBe(true);
    });
    it("应包含正确的表头（含能量列）", () => {
        const frames = createMockFrames(20);
        const csv = generateCSV({ frames, energyContext: DEFAULT_CTX });
        const lines = csv.slice(1).split("\n");
        const header = lines[0];
        expect(header).toContain("time");
        expect(header).toContain("ballY");
        expect(header).toContain("velocity");
        expect(header).toContain("KE (J)");
        expect(header).toContain("PE (J)");
        expect(header).toContain("TotalE (J)");
    });
    it("应包含正确的表头（不含能量列）", () => {
        const frames = createMockFrames(20);
        const csv = generateCSV({
            frames,
            energyContext: DEFAULT_CTX,
            includeEnergy: false,
        });
        const lines = csv.slice(1).split("\n");
        const header = lines[0];
        expect(header).toContain("time");
        expect(header).not.toContain("KE (J)");
        expect(header).not.toContain("PE (J)");
        expect(header).not.toContain("TotalE (J)");
    });
    it("应按 sampleRate 对帧进行采样（默认每 10 帧取 1 帧）", () => {
        const frames = createMockFrames(50); // 50 帧 → 5 行数据
        const csv = generateCSV({ frames, energyContext: DEFAULT_CTX });
        const dataLines = csv
            .slice(1)
            .split("\n")
            .filter((line) => line.trim().length > 0);
        // 1 header + 5 data (indices 0,10,20,30,40)
        expect(dataLines.length).toBe(6);
    });
    it("自定义 sampleRate 应生效", () => {
        const frames = createMockFrames(20);
        const csv = generateCSV({
            frames,
            energyContext: DEFAULT_CTX,
            sampleRate: 5,
        });
        const dataLines = csv
            .slice(1)
            .split("\n")
            .filter((line) => line.trim().length > 0);
        // 20 / 5 = 4 data + 1 header
        expect(dataLines.length).toBe(5);
    });
    it("数值精度应固定为 3 位小数", () => {
        const frames = createMockFrames(15);
        const csv = generateCSV({ frames, energyContext: DEFAULT_CTX });
        const lines = csv.slice(1).split("\n");
        if (lines.length >= 2) {
            const values = lines[1].split(",");
            for (const v of values) {
                const num = parseFloat(v);
                if (!isNaN(num)) {
                    const decimalPart = v.split(".")[1];
                    expect(decimalPart?.length).toBeLessThanOrEqual(3);
                }
            }
        }
    });
    it("空帧数组应只输出表头行", () => {
        const csv = generateCSV({ frames: [], energyContext: DEFAULT_CTX });
        const dataLines = csv
            .slice(1)
            .split("\n")
            .filter((line) => line.trim().length > 0);
        expect(dataLines.length).toBe(1);
    });
    it("能量值应符合物理公式（守恒性检查）", () => {
        const frame = {
            time: 0, ballX: 0, ballY: 10, ball2X: 0, ball2Y: 0,
            ballVelocity: 0, ballAcceleration: -9.8, isOnGround: false, phaseId: "init",
        };
        const csv = generateCSV({ frames: [frame], energyContext: DEFAULT_CTX });
        const lines = csv.slice(1).split("\n");
        const dataLine = lines[1];
        const cols = dataLine.split(",");
        // time,ballX,ballY,velocity,acceleration,phaseId,KE,PE,TotalE
        const ke = parseFloat(cols[6]);
        const pe = parseFloat(cols[7]);
        const totalE = parseFloat(cols[8]);
        expect(ke).toBeCloseTo(0, 3);
        expect(pe).toBeCloseTo(196, 3);
        expect(totalE).toBeCloseTo(196, 3);
    });
});
// ==================== downloadCSV ====================
describe("downloadCSV", () => {
    let mockCreateObjectURL;
    let mockRevokeObjectURL;
    beforeEach(() => {
        mockCreateObjectURL = vi.fn(() => "blob:http://fake-csv-url");
        mockRevokeObjectURL = vi.fn();
        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;
        // mock DOM methods
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
    });
    it("应创建 Blob 并触发下载", () => {
        const csvContent = "\uFEFFtime,ballY\n0.000,10.000";
        downloadCSV(csvContent, "experiment_data.csv");
        expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    });
    it("应使用正确的 MIME 类型 text/csv", () => {
        downloadCSV("\uFEFFdata\n1,2", "test.csv");
        const callArgs = mockCreateObjectURL.mock.calls[0][0];
        expect(callArgs.type).toBe("text/csv;charset=utf-8");
    });
});
//# sourceMappingURL=csv.test.js.map