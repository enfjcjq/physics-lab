import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { useState } from "react";
import { generateCSV, downloadCSV, SAMPLE_RATE, calculateFrameEnergy } from "../../lib/csv";
export function DataPanel() {
    const currentTime = useSimulation(s => s.currentTime);
    const totalDuration = useSimulation(s => s.totalDuration);
    const ballX = useSimulation(s => s.ballX);
    const ballY = useSimulation(s => s.ballY);
    const ballVelocity = useSimulation(s => s.ballVelocity);
    const ballAcceleration = useSimulation(s => s.ballAcceleration);
    const mass = useSimulation(s => s.mass);
    const gravity = useSimulation(s => s.gravity);
    const frameCache = useSimulation(s => s.frameCache);
    const phases = useSimulation(s => s.phases);
    const { t } = useI18n();
    const [viewMode, setViewMode] = useState("live");
    const ke = 0.5 * mass * ballVelocity * ballVelocity;
    const pe = mass * gravity * Math.max(0, ballY);
    const totalE = ke + pe;
    /** 根据 phaseId 查找相位名称 */
    const getPhaseName = (phaseId) => {
        const phase = phases.find(p => p.id === phaseId);
        return phase?.label ?? phaseId;
    };
    /** CSV 导出：统一调用 csv.ts 模块 */
    const exportCSV = () => {
        if (frameCache.length === 0)
            return;
        const csvContent = generateCSV({
            frames: frameCache,
            energyContext: { mass, gravity },
            sampleRate: SAMPLE_RATE,
            includeEnergy: true,
        });
        downloadCSV(csvContent, `physics-lab-data.csv`);
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0", children: [_jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("panel.data") }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => setViewMode("live"), className: `px-2 py-0.5 rounded text-[10px] transition-colors ${viewMode === "live" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-300"}`, children: "Live" }), _jsx("button", { onClick: () => setViewMode("table"), className: `px-2 py-0.5 rounded text-[10px] transition-colors ${viewMode === "table" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-300"}`, children: "Table" }), _jsx("button", { onClick: exportCSV, className: "px-2 py-0.5 rounded text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors", children: "CSV \\u2193" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-3 pb-3", children: viewMode === "live" ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-[10px] text-slate-500", children: t("timeline.current_time") }), _jsxs("span", { className: "text-sm font-mono text-sky-400", children: [currentTime.toFixed(3), " s"] })] }), _jsx("div", { className: "w-full h-1 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all duration-75", style: { width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` } }) })] }), _jsx(DataRow, { label: "X", value: ballX.toFixed(3), unit: "m", color: "text-red-400" }), _jsx(DataRow, { label: "Y", value: ballY.toFixed(3), unit: "m", color: "text-emerald-400" }), _jsx("div", { className: "border-t border-slate-800 pt-2 mt-2" }), _jsx(DataRow, { label: t("teacher.velocity"), value: ballVelocity.toFixed(3), unit: "m/s", color: "text-sky-400", highlight: true }), _jsx(DataRow, { label: t("chart.acceleration"), value: ballAcceleration.toFixed(2), unit: "m/s\\u00B2", color: "text-amber-400" }), _jsx("div", { className: "border-t border-slate-800 pt-2 mt-2" }), _jsx(DataRow, { label: "KE", value: ke.toFixed(1), unit: "J", color: "text-amber-400" }), _jsx(DataRow, { label: "PE", value: pe.toFixed(1), unit: "J", color: "text-emerald-400" }), _jsx(DataRow, { label: t("teacher.total_energy"), value: totalE.toFixed(1), unit: "J", color: "text-violet-400", highlight: true })] })) : (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full text-[10px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-slate-500 border-b border-slate-800", children: [_jsx("th", { className: "text-left py-1.5 px-2 font-medium", children: "t (s)" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "y (m)" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "v (m/s)" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "a (m/s\\u00B2)" }), _jsx("th", { className: "text-left py-1.5 px-2 font-medium", children: "Phase" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "KE (J)" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "PE (J)" }), _jsx("th", { className: "text-right py-1.5 px-2 font-medium", children: "TotalE (J)" })] }) }), _jsx("tbody", { children: frameCache.filter((_, i) => i % SAMPLE_RATE === 0).slice(0, 50).map((f, i) => {
                                        const e = calculateFrameEnergy(f, { mass, gravity });
                                        return (_jsxs("tr", { className: `border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${Math.abs(f.time - currentTime) < 0.05 ? "bg-sky-900/20" : ""}`, children: [_jsx("td", { className: "py-1 px-2 font-mono text-slate-400", children: f.time.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-emerald-400", children: f.ballY.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-sky-400", children: f.ballVelocity.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-amber-400", children: f.ballAcceleration.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-slate-500", children: getPhaseName(f.phaseId) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-amber-400", children: e.ke.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-emerald-400", children: e.pe.toFixed(2) }), _jsx("td", { className: "py-1 px-2 font-mono text-right text-violet-400", children: e.totalE.toFixed(2) })] }, i));
                                    }) })] }), frameCache.length === 0 && (_jsx("div", { className: "text-center py-8 text-xs text-slate-600", children: t("ui.no_data") }))] })) })] }));
}
function DataRow({ label, value, unit, color, highlight }) {
    return (_jsxs("div", { className: `rounded-lg px-3 py-2 flex items-center justify-between ${highlight ? "bg-slate-800/60 border border-slate-700/40" : ""}`, children: [_jsx("span", { className: "text-[10px] text-slate-500", children: label }), _jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: `text-sm font-mono tabular-nums ${color}`, children: value }), _jsx("span", { className: "text-[9px] text-slate-600", children: unit })] })] }));
}
//# sourceMappingURL=DataPanel.js.map