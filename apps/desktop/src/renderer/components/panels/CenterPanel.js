import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { Scene3D } from "../../features/experiment/components/Scene3D";
import { TeachingOverlay } from "../teaching/TeachingOverlay";
import { useI18n } from "../../core/i18n";
import { useVisualization } from "../../core/visualization.store";
import { pluginRegistry } from "../../core/plugin-registry";
import { useTeaching } from "../../core/teaching.store";
// HTML formula overlay (replaces broken 3D Text)
function FormulaHTML() {
    const currentTime = useSimulation((s) => s.currentTime);
    const scene = useSimulation((s) => s.scene);
    const show = useVisualization((s) => s.toggles.showFormulas);
    const { t } = useI18n();
    if (!show || !scene?.teacher_steps)
        return null;
    const steps = [...scene.teacher_steps].sort((a, b) => a.order - b.order);
    let bestStep = null;
    for (const s of steps) {
        if (s.timeStart <= currentTime && s.formulaKey) {
            bestStep = s;
        }
    }
    if (!bestStep) {
        for (const s of steps) {
            if (s.formulaKey) {
                bestStep = s;
                break;
            }
        }
    }
    if (!bestStep?.formulaKey)
        return null;
    const formula = t(bestStep.formulaKey);
    const lines = formula.split("\n").filter(l => l.trim());
    return (_jsx("div", { className: "absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none", children: _jsx("div", { className: "bg-slate-900/85 backdrop-blur border border-amber-500/30 rounded-xl px-5 py-3 shadow-2xl shadow-amber-900/20", children: lines.map((line, i) => (_jsx("div", { className: "text-sm font-mono text-amber-300 text-center whitespace-nowrap leading-relaxed", children: line.trim() }, i))) }) }));
}
export function CenterPanel() {
    const pluginLoading = useSimulation((s) => s.pluginLoading);
    const activePluginId = useSimulation((s) => s.activePluginId);
    const setActivePlugin = useSimulation((s) => s.setActivePlugin);
    const currentPhaseId = useSimulation((s) => s.currentPhaseId);
    const phases = useSimulation((s) => s.phases);
    const jumpToPhase = useSimulation((s) => s.jumpToPhase);
    const { t } = useI18n();
    const { mode } = useTeaching();
    const currentPhase = phases.find((p) => p.id === currentPhaseId);
    const expIcons = {
        "free-fall": "⬇", "projectile-motion": "↗",
        "inclined-plane": "∠", "collision": "●●",
        "spring-mass": "〰", "pendulum": "⌈"
    };
    return (_jsxs("div", { className: "flex-1 relative min-w-0", children: [_jsx("div", { className: "absolute top-2 left-2 z-20", children: _jsx("div", { className: "flex gap-0.5 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg p-0.5 shadow-lg", children: pluginRegistry.list().map((p) => (_jsxs("button", { onClick: async () => { if (p.id !== activePluginId)
                            await setActivePlugin(p.id); }, className: `px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 flex items-center gap-1 ${p.id === activePluginId
                            ? "bg-sky-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"}`, title: t(p.name), children: [_jsx("span", { className: "text-xs", children: expIcons[p.id] || "?" }), _jsx("span", { className: "hidden sm:inline", children: t(p.name) })] }, p.id))) }) }), pluginLoading && (_jsx("div", { className: "absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm", children: _jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-xs text-slate-400", children: t("ui.loading") })] }) })), _jsx(Scene3D, {}), _jsx(TeachingOverlay, {}), _jsx(FormulaHTML, {}), _jsx("div", { className: "absolute bottom-4 left-4 z-10", children: _jsxs("div", { className: "bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-sky-400" }), _jsx("span", { className: "text-xs text-slate-300", children: currentPhase ? t(currentPhase.label) : currentPhaseId })] }) }), _jsx("div", { className: "absolute top-3 left-1/2 -translate-x-1/2 z-10", children: _jsx("div", { className: "flex items-center gap-0 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-1 py-1 shadow-lg", children: phases.map((p, i) => (_jsxs("div", { className: "flex items-center", children: [_jsxs("button", { onClick: () => jumpToPhase(p.id), className: `flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${currentPhaseId === p.id
                                    ? "bg-sky-600 text-white shadow-md shadow-sky-900/30 scale-105"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`, title: p.description || t(p.label), children: [_jsx("span", { className: `w-1.5 h-1.5 rounded-full ${currentPhaseId === p.id ? "bg-white" : "bg-slate-600"}` }), _jsx("span", { className: "hidden sm:inline", children: t(p.label) })] }), i < phases.length - 1 && (_jsx("div", { className: "w-3 h-px bg-slate-700" }))] }, p.id))) }) })] }));
}
//# sourceMappingURL=CenterPanel.js.map