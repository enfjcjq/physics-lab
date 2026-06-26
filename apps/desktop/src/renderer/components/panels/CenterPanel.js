import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import { Scene3D } from "../../features/experiment/components/Scene3D";
import { TeachingOverlay } from "../teaching/TeachingOverlay";
export function CenterPanel() {
    const currentPhase = useSimulation((s) => s.currentPhase);
    const jumpToPhase = useSimulation((s) => s.jumpToPhase);
    return (_jsxs("div", { className: "flex-1 relative min-w-0", children: [_jsx(Scene3D, {}), _jsx(TeachingOverlay, {}), _jsx("div", { className: "absolute bottom-4 left-4 z-10", children: _jsxs("div", { className: "bg-slate-900/80 backdrop-blur border border-slate-700/50\r\n          rounded-lg px-3 py-1.5 flex items-center gap-2", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-sky-400" }), _jsx("span", { className: "text-xs text-slate-300", children: PHASES.find((p) => p.id === currentPhase)?.label ?? currentPhase })] }) }), _jsx("div", { className: "absolute top-3 right-3 z-10 flex gap-1", children: PHASES.map((p) => (_jsxs("button", { onClick: () => jumpToPhase(p.id), className: `px-2 py-1 rounded text-[10px] font-medium transition-all ${currentPhase === p.id
                        ? "bg-sky-600/30 text-sky-300 border border-sky-600/40"
                        : "bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-slate-700/30"}`, children: [p.icon, " ", p.label] }, p.id))) })] }));
}
//# sourceMappingURL=CenterPanel.js.map