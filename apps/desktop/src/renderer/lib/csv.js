// ==================== 常量 ====================
/** 统一采样率（解决 Live/Table/CSV 不一致问题） */
export const SAMPLE_RATE = 10;
/** UTF-8 BOM 前缀，确保 Excel 正确识别编码 */
const BOM = "\uFEFF";
// ==================== 公共函数 ====================
/**
 * 计算单帧的动能、势能与总机械能（纯函数）
 * @param frame - 缓存帧数据
 * @param ctx - 能量计算参数（质量、重力加速度）
 * @returns 包含 ke/pe/totalE 的对象，数值保留原始精度
 */
export function calculateFrameEnergy(frame, ctx) {
    const ke = 0.5 * ctx.mass * frame.ballVelocity * frame.ballVelocity;
    const pe = ctx.mass * ctx.gravity * Math.max(0, frame.ballY);
    return { ke, pe, totalE: ke + pe };
}
/**
 * 生成 CSV 字符串（含 UTF-8 BOM）
 * 按 sampleRate 对 frames 进行采样，可选附加能量列
 *
 * @param options - 导出配置
 * @returns 完整的 CSV 字符串（含 BOM）
 */
export function generateCSV(options) {
    const { frames, energyContext, sampleRate = SAMPLE_RATE, includeEnergy = true, } = options;
    // 按采样率筛选帧
    const sampled = frames.filter((_, i) => i % sampleRate === 0);
    // 构建表头
    const headers = ["time", "ballX", "ballY", "velocity", "acceleration", "phaseId"];
    if (includeEnergy) {
        headers.push("KE (J)", "PE (J)", "TotalE (J)");
    }
    const rows = [headers.join(",")];
    // 构建数据行
    for (const f of sampled) {
        const base = [
            f.time.toFixed(3),
            f.ballX.toFixed(3),
            f.ballY.toFixed(3),
            f.ballVelocity.toFixed(3),
            f.ballAcceleration.toFixed(3),
            f.phaseId,
        ];
        if (includeEnergy) {
            const e = calculateFrameEnergy(f, energyContext);
            base.push(e.ke.toFixed(3), e.pe.toFixed(3), e.totalE.toFixed(3));
        }
        rows.push(base.join(","));
    }
    return BOM + rows.join("\n");
}
/**
 * 触发 CSV 文件下载
 * @param csvContent - 已生成的 CSV 字符串
 * @param filename - 下载文件名
 */
export function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
//# sourceMappingURL=csv.js.map