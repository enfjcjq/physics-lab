import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { CollapseHandle } from "../layout/CollapseHandle";
import { KnowledgeGraph } from "../teaching/KnowledgeGraph";
import { generateMarkdownReport, downloadReport, downloadPDFReport, captureScreenshot, } from "../../lib/report";
import { generateCSV, downloadCSV } from "../../lib/csv";
export function RightPanel() {
    const rightOpen = usePanelManager((s) => s.panels.analysis?.isOpen ?? true);
    const toggleRight = () => usePanelManager.getState().toggle("analysis");
    const scene = useSimulation((s) => s.scene);
    const mass = useSimulation((s) => s.mass);
    const gravity = useSimulation((s) => s.gravity);
    const currentTime = useSimulation((s) => s.currentTime);
    const ballY = useSimulation((s) => s.ballY);
    const ballVelocity = useSimulation((s) => s.ballVelocity);
    const frameCache = useSimulation((s) => s.frameCache);
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState("force");
    const TABS = [
        { id: "force", labelKey: "analysis.force" },
        { id: "motion", labelKey: "analysis.motion" },
        { id: "formula", labelKey: "analysis.formula" },
        { id: "knowledge", labelKey: "analysis.knowledge" },
        { id: "tips", labelKey: "analysis.tips" },
        { id: "graph", labelKey: "analysis.graph" },
    ];
    const forces = scene?.forces ?? [];
    const equations = scene?.equations ?? [];
    const knowledgeTags = scene?.knowledge_tags ?? [];
    /** 构建当前实验的 ReportData */
    const buildReportData = () => {
        if (!scene)
            return null;
        return {
            scene,
            params: { mass, gravity },
            currentTime,
            ballY,
            ballVelocity,
        };
    };
    // 导出按钮处理函数
    const handleExportPDF = async () => {
        const data = buildReportData();
        if (!data)
            return;
        await downloadPDFReport(data, "zh-CN");
    };
    const handleExportMD = () => {
        const data = buildReportData();
        if (!data)
            return;
        const md = generateMarkdownReport(data, "zh-CN");
        downloadReport(md, `${scene?.metadata?.title || "report"}.md`);
    };
    const handleExportCSV = () => {
        if (frameCache.length === 0)
            return;
        const csvContent = generateCSV({
            frames: frameCache,
            energyContext: { mass, gravity },
            includeEnergy: true,
        });
        downloadCSV(csvContent, `physics-lab-data.csv`);
    };
    const handleScreenshot = () => {
        const dataUrl = captureScreenshot();
        if (!dataUrl)
            return;
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `screenshot-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    return (_jsx("div", { className: `relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${rightOpen ? "w-[340px]" : "w-0"}`, children: _jsxs("div", { className: "w-[340px] h-full bg-slate-900/95 border-l border-slate-800 flex flex-col", children: [_jsx(CollapseHandle, { side: "right", open: rightOpen, onToggle: toggleRight }), _jsx("div", { className: "px-4 pt-4 pb-2", children: _jsx("h2", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: t("panel.analysis") }) }), _jsxs("div", { className: "px-3 pb-3", children: [_jsx("div", { className: "flex bg-slate-800/30 rounded-xl p-0.5", children: TABS.slice(0, 4).map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `flex-1 py-1.5 text-[11px] rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"}`, children: t(tab.labelKey) }, tab.id))) }), _jsx("div", { className: "flex mt-1 gap-1", children: TABS.slice(4).map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `flex-1 py-1 text-[10px] rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-slate-700/50 text-slate-300 border border-slate-600/30"
                                    : "text-slate-600 hover:text-slate-400"}`, children: t(tab.labelKey) }, tab.id))) })] }), scene && (_jsxs("div", { className: "px-3 py-2 border-t border-slate-800", children: [_jsx("div", { className: "text-[9px] text-slate-600 uppercase tracking-wider mb-1.5", children: t("export.label") }), _jsxs("div", { className: "grid grid-cols-4 gap-1", children: [_jsx("button", { onClick: handleExportPDF, className: "px-1.5 py-1 rounded text-[9px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-0.5", children: _jsx("span", { children: "PDF" }) }), _jsx("button", { onClick: handleExportMD, className: "px-1.5 py-1 rounded text-[9px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-0.5", children: _jsx("span", { children: "MD" }) }), _jsx("button", { onClick: handleExportCSV, className: "px-1.5 py-1 rounded text-[9px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-0.5", children: _jsx("span", { children: "CSV" }) }), _jsx("button", { onClick: handleScreenshot, className: "px-1.5 py-1 rounded text-[9px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center gap-0.5", children: _jsx("span", { children: "Screenshot" }) })] })] })), _jsx("div", { className: "border-t border-slate-800" }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 py-3", children: [activeTab === "force" && (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: t("analysis.force_title") }), forces.map((f, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-sm font-medium text-white", children: f.description || f.type }), _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded ${f.is_constant ? "bg-sky-900/40 text-sky-400" : "bg-amber-900/40 text-amber-400"}`, children: f.is_constant ? t("analysis.constant") : t("analysis.variable") })] }), _jsxs("div", { className: "text-xs text-slate-400 space-y-1", children: [_jsxs("div", { children: [t("analysis.direction"), ": [", String(f.direction), "]"] }), _jsx("div", { className: "font-mono text-sky-300", children: String(f.magnitude) })] })] }, i)))] })), activeTab === "motion" && (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: t("analysis.motion_title") }), equations.filter(e => e.type === "motion").map((eq, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", children: [_jsx("div", { className: "text-sm font-medium text-white mb-1", children: eq.name }), _jsx("div", { className: "px-2 py-1.5 bg-slate-900 rounded text-xs font-mono text-sky-300", children: eq.expression }), Object.entries(eq.variables).map(([k, v]) => (_jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [v.symbol, ": ", v.description, " (", v.unit, ")"] }, k)))] }, i)))] })), activeTab === "formula" && (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: t("analysis.formula_title") }), equations.map((eq, i) => (_jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3 border border-slate-700/50", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "w-5 h-5 rounded-full bg-sky-900/50 border border-sky-700/50 flex items-center justify-center text-[10px] text-sky-400", children: i + 1 }), _jsx("span", { className: "text-sm font-medium text-white", children: eq.name }), eq.is_solution && _jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400", children: t("analysis.solution") })] }), _jsx("div", { className: "px-2 py-1.5 bg-slate-900 rounded text-xs font-mono text-sky-300", children: eq.expression }), eq.derivation && eq.derivation.map((d, j) => (_jsx("div", { className: "text-xs text-slate-500 mt-1", children: d }, j)))] }, i)))] })), activeTab === "knowledge" && (_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: t("analysis.knowledge_title") }), _jsx("div", { className: "space-y-2", children: knowledgeTags.map((kp, i) => (_jsxs("div", { className: "bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30 hover:border-sky-700/30 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "w-5 h-5 rounded-md bg-sky-900/30 flex items-center justify-center text-[10px] text-sky-400", children: i + 1 }), _jsx("span", { className: "text-xs font-medium text-slate-200", children: kp.name }), _jsx("span", { className: "text-[9px] text-slate-600 ml-auto", children: kp.category })] }), kp.learning_tips && (_jsx("p", { className: "text-[10px] text-slate-500 ml-7", children: kp.learning_tips }))] }, kp.id))) }), knowledgeTags.some(k => k.common_mistakes) && (_jsxs("div", { className: "mt-3", children: [_jsx("h4", { className: "text-[10px] text-amber-400 uppercase tracking-wider mb-2", children: t("analysis.mistakes") }), knowledgeTags.filter(k => k.common_mistakes).map((k, i) => (k.common_mistakes?.map((m, j) => (_jsxs("div", { className: "flex items-start gap-2 bg-amber-900/10 border border-amber-800/20 rounded-lg p-2 mb-1", children: [_jsx("span", { className: "text-amber-500 text-xs", children: "!" }), _jsx("span", { className: "text-xs text-slate-300", children: m })] }, `${i}-${j}`)))))] }))] })), activeTab === "graph" && _jsx(KnowledgeGraph, {}), activeTab === "tips" && (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-200", children: t("analysis.tips_title") }), knowledgeTags.filter(k => k.learning_tips).map((k, i) => (_jsxs("div", { className: "flex items-start gap-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg p-2.5", children: [_jsx("span", { className: "text-emerald-500 text-xs", children: ">" }), _jsxs("div", { children: [_jsx("span", { className: "text-xs text-slate-300", children: k.learning_tips }), _jsx("div", { className: "text-[10px] text-slate-600 mt-0.5", children: k.name })] })] }, i)))] }))] })] }) }));
}
//# sourceMappingURL=RightPanel.js.map