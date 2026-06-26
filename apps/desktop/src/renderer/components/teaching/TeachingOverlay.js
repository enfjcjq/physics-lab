import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
export function TeachingOverlay() {
    const currentTime = useSimulation((s) => s.currentTime);
    const currentPhaseId = useSimulation((s) => s.currentPhaseId);
    const phases = useSimulation((s) => s.phases);
    const scene = useSimulation((s) => s.scene);
    const { mode, subMode, overlay: ov, setSubMode } = useTeaching();
    const { t } = useI18n();
    if (mode === "experiment")
        return null;
    // Derive overlay steps from scene teacher_steps (data-driven!)
    const steps = scene?.teacher_steps ?? [];
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    if (sortedSteps.length === 0)
        return null;
    // Find current step based on time
    const currentIdx = (() => {
        for (let i = sortedSteps.length - 1; i >= 0; i--) {
            if (currentTime >= sortedSteps[i].timeStart)
                return i;
        }
        return 0;
    })();
    const step = sortedSteps[currentIdx];
    const nextStep = currentIdx < sortedSteps.length - 1 ? sortedSteps[currentIdx + 1] : null;
    // Get current phase for contextual display
    const currentPhase = phases.find((p) => p.id === currentPhaseId);
    return (_jsx("div", { className: "absolute left-4 bottom-20 z-20 max-w-sm transition-all duration-500", style: { opacity: 1, transform: "translateY(0)" }, children: _jsxs("div", { className: "bg-slate-900/90 backdrop-blur border border-sky-800/40 rounded-xl p-4 shadow-2xl transition-all duration-300", children: [_jsx("div", { className: "flex gap-1 mb-3", children: ["experiment", "teaching", "solving", "explore"].map((m) => (_jsx("button", { onClick: () => setSubMode(m), className: `px-2 py-1 rounded text-[10px] font-medium transition-colors ${subMode === m ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`, children: t("teaching.mode." + m) }, m))) }), _jsx("div", { className: "flex gap-1 mb-3", children: sortedSteps.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-colors duration-300 ${i <= currentIdx ? "bg-sky-500" : "bg-slate-700"}` }, i))) }), _jsxs("div", { className: "mb-1", children: [_jsxs("span", { className: "text-[10px] text-sky-400 uppercase tracking-wider", children: [t("overlay.step"), " ", currentIdx + 1, "/", sortedSteps.length] }), currentPhase && (_jsxs("span", { className: "ml-2 text-[10px] text-slate-500", children: ["| ", t(currentPhase.label)] }))] }), _jsx("h3", { className: "text-sm font-semibold text-white mb-1", children: t(step.titleKey) }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed mb-2", children: t(step.descKey) }), step.formulaKey && ov.showFormulas && (_jsx("div", { className: "px-2 py-1.5 bg-slate-800 rounded-lg text-xs font-mono text-sky-300 animate-in fade-in", children: t(step.formulaKey) })), currentPhase?.description && (_jsxs("div", { className: "mt-2 pt-2 border-t border-slate-800", children: [_jsx("div", { className: "text-[10px] text-slate-500 mb-0.5", children: t("overlay.phase_info") }), _jsx("div", { className: "text-xs text-slate-400", children: currentPhase.description })] })), subMode === "explore" && nextStep && (_jsxs("div", { className: "mt-2 pt-2 border-t border-slate-800", children: [_jsxs("div", { className: "text-[10px] text-slate-600", children: [t("overlay.next"), ":"] }), _jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: t(nextStep.titleKey) })] })), nextStep && nextStep.timeStart - currentTime < 0.3 && nextStep.timeStart > currentTime && (_jsx("div", { className: "mt-2 pt-2 border-t border-slate-800 animate-pulse", children: _jsxs("div", { className: "text-[10px] text-amber-400", children: [t("overlay.upcoming"), ": ", t(nextStep.titleKey)] }) }))] }) }));
}
//# sourceMappingURL=TeachingOverlay.js.map