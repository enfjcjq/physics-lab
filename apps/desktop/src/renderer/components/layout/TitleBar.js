import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
export function TitleBar() {
    const currentPhaseId = useSimulation((s) => s.currentPhaseId);
    const playing = useSimulation((s) => s.playing);
    const phaseLabels = {
        release: "Release",
        falling: "Falling",
        impact: "Impact",
        bounce: "Bounce",
    };
    return (_jsxs("div", { className: "h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 select-none flex-shrink-0", style: { WebkitAppRegion: "drag" }, children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white", children: "P" }), _jsx("span", { className: "text-sm font-semibold text-white tracking-wide", children: "Physics Lab" }), _jsx("span", { className: "text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded", children: "V0.2" })] }), _jsx("div", { className: "flex-1 flex justify-center", children: _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: `w-2 h-2 rounded-full ${playing ? "bg-green-400 animate-pulse" : "bg-yellow-400"}` }), _jsx("span", { className: "text-slate-400", children: phaseLabels[currentPhaseId] })] }) }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-green-400" }), _jsx("span", { children: "AI Ready" })] })] }));
}
//# sourceMappingURL=TitleBar.js.map