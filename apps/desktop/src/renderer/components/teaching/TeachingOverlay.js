import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
const STEPS = [
    { time: 0.0, titleKey: "overlay.step.release", contentKey: "overlay.step.content.release", formulaKey: "overlay.step.formula.release" },
    { time: 0.3, titleKey: "overlay.step.gravity", contentKey: "overlay.step.content.gravity", formulaKey: "overlay.step.formula.gravity" },
    { time: 0.6, titleKey: "overlay.step.accelerating", contentKey: "overlay.step.content.accelerating", formulaKey: "overlay.step.formula.accelerating" },
    { time: 1.0, titleKey: "overlay.step.midpoint", contentKey: "overlay.step.content.midpoint", formulaKey: "overlay.step.formula.midpoint" },
    { time: 1.4, titleKey: "overlay.step.impact", contentKey: "overlay.step.content.impact", formulaKey: "overlay.step.formula.impact" },
    { time: 1.5, titleKey: "overlay.step.rebound", contentKey: "overlay.step.content.rebound", formulaKey: "overlay.step.formula.rebound" },
    { time: 2.5, titleKey: "overlay.step.second_fall", contentKey: "overlay.step.content.second_fall", formulaKey: "overlay.step.formula.second_fall" },
];
export function TeachingOverlay() {
    const currentTime = useSimulation((s) => s.currentTime);
    const { mode, subMode, overlay: ov, setSubMode } = useTeaching();
    const { t } = useI18n();
    if (mode === "experiment")
        return null;
    const currentStep = [...STEPS].reverse().find((s) => currentTime >= s.time) ?? STEPS[0];
    const nextStep = STEPS.find((s) => s.time > currentTime);
    const stepIndex = STEPS.indexOf(currentStep);
    return (_jsx("div", { className: "absolute left-4 bottom-20 z-20 max-w-sm", children: _jsxs("div", { className: "bg-slate-900/90 backdrop-blur border border-sky-800/40 rounded-xl p-4 shadow-2xl transition-all duration-300", children: [_jsx("div", { className: "flex gap-1 mb-3", children: ["experiment", "teaching", "solving", "explore"].map((m) => (_jsx("button", { onClick: () => setSubMode(m), className: `px-2 py-1 rounded text-[10px] font-medium transition-colors ${subMode === m ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`, children: t("teaching.mode." + m) }, m))) }), _jsx("div", { className: "flex gap-1 mb-3", children: STEPS.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-sky-500" : "bg-slate-700"}` }, i))) }), _jsx("div", { className: "mb-1", children: _jsxs("span", { className: "text-[10px] text-sky-400 uppercase tracking-wider", children: [t("overlay.step"), " ", stepIndex + 1, "/", STEPS.length] }) }), _jsx("h3", { className: "text-sm font-semibold text-white mb-1", children: t(currentStep.titleKey) }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed mb-2", children: t(currentStep.contentKey) }), currentStep.formulaKey && ov.showFormulas && (_jsx("div", { className: "px-2 py-1.5 bg-slate-800 rounded-lg text-xs font-mono text-sky-300", children: t(currentStep.formulaKey) })), subMode === "explore" && nextStep && (_jsxs("div", { className: "mt-2 pt-2 border-t border-slate-800", children: [_jsxs("div", { className: "text-[10px] text-slate-600", children: [t("overlay.next"), ":"] }), _jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: t(nextStep.titleKey) })] }))] }) }));
}
//# sourceMappingURL=TeachingOverlay.js.map