import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import { useI18n } from "../../core/i18n";
import { useTeaching } from "../../core/teaching.store";
const TEACHER_STEPS = [
    {
        time: 0.0,
        phase: "release",
        messageKey: "teacher.step.release",
        formula: "v_0 = 0, h_0 = 10 m",
    },
    {
        time: 0.2,
        phase: "falling",
        messageKey: "teacher.step.gravity_only",
        formula: "F = mg, a = g \\downarrow",
    },
    {
        time: 0.5,
        phase: "falling",
        messageKey: "teacher.step.accelerating",
        formula: "v(t) = gt, h(t) = h_0 - \\frac{1}{2}gt^2",
    },
    {
        time: 1.0,
        phase: "falling",
        messageKey: "teacher.step.midpoint",
        formula: "t = 1.0s, v \\approx 9.8 m/s",
    },
    {
        time: 1.35,
        phase: "impact",
        messageKey: "teacher.step.approaching_ground",
        formula: "v \\rightarrow v_{max}",
    },
    {
        time: 1.4,
        phase: "impact",
        messageKey: "teacher.step.impact",
        formula: "v_{impact} = \\sqrt{2gh_0} = 14 m/s",
    },
    {
        time: 1.5,
        phase: "bounce",
        messageKey: "teacher.step.bounce",
        formula: "v_{rebound} = 0.6 \\cdot v_{impact}",
    },
    {
        time: 2.0,
        phase: "bounce",
        messageKey: "teacher.step.second_peak",
        formula: "h_{peak} = \\frac{v_{rebound}^2}{2g}",
    },
];
export function TeacherPanel() {
    const currentTime = useSimulation((s) => s.currentTime);
    const currentPhase = useSimulation((s) => s.currentPhase);
    const ballY = useSimulation((s) => s.ballY);
    const ballVelocity = useSimulation((s) => s.ballVelocity);
    const mass = useSimulation((s) => s.mass);
    const gravity = useSimulation((s) => s.gravity);
    const height = useSimulation((s) => s.height);
    const { mode } = useTeaching();
    const { t } = useI18n();
    // Find current step
    const currentStepIndex = (() => {
        for (let i = TEACHER_STEPS.length - 1; i >= 0; i--) {
            if (currentTime >= TEACHER_STEPS[i].time)
                return i;
        }
        return 0;
    })();
    const currentStep = TEACHER_STEPS[currentStepIndex];
    const phase = PHASES.find((p) => p.id === currentPhase);
    // Physical values for display
    const ke = 0.5 * mass * ballVelocity * ballVelocity;
    const pe = mass * gravity * ballY;
    const totalE = ke + pe;
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "px-4 pt-3 pb-2 flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDC68\u200D\uD83C\uDFEB" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: t("teacher.title") }), _jsx("span", { className: "ml-auto px-2 py-0.5 rounded text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-700/30", children: t("teacher.auto") })] }), _jsx("div", { className: "px-4 pb-2 flex gap-1", children: TEACHER_STEPS.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-all duration-300 ${i < currentStepIndex
                        ? "bg-emerald-500"
                        : i === currentStepIndex
                            ? "bg-emerald-400 shadow-sm shadow-emerald-500/50"
                            : "bg-slate-700"}` }, i))) }), _jsxs("div", { className: "px-4 text-[10px] text-slate-500 mb-3", children: ["Step ", currentStepIndex + 1, "/", TEACHER_STEPS.length, phase && _jsx("span", { className: "ml-2 text-sky-400", children: t(phase.label) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 space-y-3", children: [_jsxs("div", { className: "bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-4", children: [_jsx("p", { className: "text-sm text-slate-200 leading-relaxed", children: t(currentStep.messageKey) }), currentStep.formula && (_jsx("div", { className: "mt-3 px-3 py-2 bg-slate-900/80 rounded-lg text-sm font-mono text-sky-300", children: currentStep.formula }))] }), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.live_data") }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(DataBadge, { label: t("teacher.height"), value: `${ballY.toFixed(2)} m` }), _jsx(DataBadge, { label: t("teacher.velocity"), value: `${ballVelocity.toFixed(2)} m/s` }), _jsx(DataBadge, { label: "KE", value: `${ke.toFixed(1)} J` }), _jsx(DataBadge, { label: "PE", value: `${pe.toFixed(1)} J` })] }), _jsx("div", { className: "mt-2 pt-2 border-t border-slate-700/30", children: _jsx(DataBadge, { label: t("teacher.total_energy"), value: `${totalE.toFixed(1)} J`, highlight: true }) })] }), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.current_phase") }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-8 h-8 rounded-full bg-sky-900/50 border border-sky-700/50 flex items-center justify-center text-lg", children: phase?.icon ?? "?" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium text-white", children: phase ? t(phase.label) : "—" }), _jsx("div", { className: "text-[10px] text-slate-500", children: phase ? `${phase.timeRange[0].toFixed(1)}s - ${phase.timeRange[1].toFixed(1)}s` : "" })] })] })] })] }), _jsx("div", { className: "px-4 py-3 border-t border-slate-800", children: _jsxs("div", { className: "text-[10px] text-slate-600 leading-relaxed", children: ["\uD83D\uDCA1 ", t("teacher.hint")] }) })] }));
}
function DataBadge({ label, value, highlight }) {
    return (_jsxs("div", { className: `px-2 py-1.5 rounded-lg text-xs ${highlight
            ? "bg-sky-900/30 border border-sky-700/30"
            : "bg-slate-900/50"}`, children: [_jsx("span", { className: "text-slate-500", children: label }), _jsx("span", { className: `ml-1.5 font-mono ${highlight ? "text-sky-300" : "text-slate-300"}`, children: value })] }));
}
//# sourceMappingURL=TeacherPanel.js.map