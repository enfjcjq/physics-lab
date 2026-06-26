import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
const STEPS = [
    {
        time: 0.0,
        title: "Release",
        content: "The ball is released from rest at height h0. Initial velocity is zero.",
        formula: "v0 = 0,  y = h0",
    },
    {
        time: 0.3,
        title: "Gravity",
        content: "Only gravity acts on the ball. Acceleration is constant: g = 9.8 m/s^2 downward.",
        formula: "F = mg,  a = g",
    },
    {
        time: 0.6,
        title: "Velocity Increases",
        content: "Velocity increases linearly with time. After 0.6s, v = 5.88 m/s.",
        formula: "v(t) = g * t",
    },
    {
        time: 1.0,
        title: "Midpoint",
        content: "At t = 1.0s, the ball has fallen 4.9m and reaches 9.8 m/s.",
        formula: "y = h0 - 1/2 * g * t^2",
    },
    {
        time: 1.4,
        title: "Impact",
        content: "The ball hits the ground. Impact velocity is about 14 m/s.",
        formula: "v_impact = sqrt(2*g*h0) = 14 m/s",
    },
    {
        time: 1.5,
        title: "Rebound",
        content: "The ball bounces back with 60% of impact speed due to energy loss.",
        formula: "v_rebound = 0.6 * v_impact",
    },
    {
        time: 2.5,
        title: "Second Fall",
        content: "The ball reaches a lower peak and falls again.",
        formula: "h_peak = v_rebound^2 / (2g)",
    },
];
export function TeachingOverlay() {
    const currentTime = useSimulation((s) => s.currentTime);
    const { mode, subMode, overlay: ov, setSubMode } = useTeaching();
    const { t } = useI18n();
    // In experiment app mode, hide overlay completely
    if (mode === "experiment")
        return null;
    const currentStep = [...STEPS].reverse().find((s) => currentTime >= s.time) ?? STEPS[0];
    const nextStep = STEPS.find((s) => s.time > currentTime);
    const stepIndex = STEPS.indexOf(currentStep);
    return (_jsx("div", { className: "absolute left-4 bottom-20 z-20 max-w-sm", children: _jsxs("div", { className: "bg-slate-900/90 backdrop-blur border border-sky-800/40 rounded-xl p-4 shadow-2xl transition-all duration-300", children: [_jsx("div", { className: "flex gap-1 mb-3", children: ["experiment", "teaching", "solving", "explore"].map((m) => (_jsx("button", { onClick: () => setSubMode(m), className: `px-2 py-1 rounded text-[10px] font-medium transition-colors ${subMode === m
                            ? "bg-sky-600 text-white"
                            : "bg-slate-800 text-slate-500 hover:text-slate-300"}`, children: t("teaching.mode." + m) }, m))) }), _jsx("div", { className: "flex gap-1 mb-3", children: STEPS.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-colors ${i <= stepIndex ? "bg-sky-500" : "bg-slate-700"}` }, i))) }), _jsx("div", { className: "mb-1", children: _jsxs("span", { className: "text-[10px] text-sky-400 uppercase tracking-wider", children: ["Step ", stepIndex + 1, "/", STEPS.length] }) }), _jsx("h3", { className: "text-sm font-semibold text-white mb-1", children: currentStep.title }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed mb-2", children: currentStep.content }), currentStep.formula && ov.showFormulas && (_jsx("div", { className: "px-2 py-1.5 bg-slate-800 rounded-lg text-xs font-mono text-sky-300", children: currentStep.formula })), subMode === "explore" && nextStep && (_jsxs("div", { className: "mt-2 pt-2 border-t border-slate-800", children: [_jsx("div", { className: "text-[10px] text-slate-600", children: "Next:" }), _jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: nextStep.title })] }))] }) }));
}
//# sourceMappingURL=TeachingOverlay.js.map