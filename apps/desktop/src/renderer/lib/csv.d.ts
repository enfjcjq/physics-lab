import type { CachedFrame } from "../features/experiment/experiment.store";
/** CSV 列配置 */
export interface CSVColumnConfig {
    key: string;
    header: string;
    precision: number;
    /** 可选的值转换函数（如能量计算） */
    transform?: (frame: CachedFrame, ctx: CSVEnergyContext) => number;
}
/** 能量计算上下文 */
export interface CSVEnergyContext {
    mass: number;
    gravity: number;
}
/** CSV 导出选项 */
export interface CSVExportOptions {
    frames: CachedFrame[];
    energyContext: CSVEnergyContext;
    sampleRate?: number;
    includeEnergy?: boolean;
    filenamePrefix?: string;
}
/** 单帧能量结果 */
export interface FrameEnergy {
    ke: number;
    pe: number;
    totalE: number;
}
/** 统一采样率（解决 Live/Table/CSV 不一致问题） */
export declare const SAMPLE_RATE = 10;
/**
 * 计算单帧的动能、势能与总机械能（纯函数）
 * @param frame - 缓存帧数据
 * @param ctx - 能量计算参数（质量、重力加速度）
 * @returns 包含 ke/pe/totalE 的对象，数值保留原始精度
 */
export declare function calculateFrameEnergy(frame: CachedFrame, ctx: CSVEnergyContext): FrameEnergy;
/**
 * 生成 CSV 字符串（含 UTF-8 BOM）
 * 按 sampleRate 对 frames 进行采样，可选附加能量列
 *
 * @param options - 导出配置
 * @returns 完整的 CSV 字符串（含 BOM）
 */
export declare function generateCSV(options: CSVExportOptions): string;
/**
 * 触发 CSV 文件下载
 * @param csvContent - 已生成的 CSV 字符串
 * @param filename - 下载文件名
 */
export declare function downloadCSV(csvContent: string, filename: string): void;
//# sourceMappingURL=csv.d.ts.map