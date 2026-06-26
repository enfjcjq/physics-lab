import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import { useI18n } from "../../core/i18n";
const PEDAGOGICAL_STEPS = [
    {
        icon: "○",
        titleKey: "teacher.step1.title",
        descKey: "teacher.step1.desc",
        timeStart: 0.0,
    },
    {
        icon: "↓",
        titleKey: "teacher.step2.title",
        descKey: "teacher.step2.desc",
        formulaKey: "teacher.step2.formula",
        timeStart: 0.3,
    },
    {
        icon: "Σ",
        titleKey: "teacher.step3.title",
        descKey: "teacher.step3.desc",
        formulaKey: "teacher.step3.formula",
        timeStart: 0.6,
    },
    {
        icon: "≈",
        titleKey: "teacher.step4.title",
        descKey: "teacher.step4.desc",
        formulaKey: "teacher.step4.formula",
        timeStart: 1.0,
    },
    {
        icon: "√",
        titleKey: "teacher.step5.title",
        descKey: "teacher.step5.desc",
        formulaKey: "teacher.step5.formula",
        timeStart: 1.4,
    },
    {
        icon: "✓",
        titleKey: "teacher.step6.title",
        descKey: "teacher.step6.desc",
        timeStart: 1.5,
    },
    {
        icon: "★",
        titleKey: "teacher.step7.title",
        descKey: "teacher.step7.desc",
        timeStart: 2.0,
    },
];
export function TeacherPanel() {
    const currentTime = useSimulation((s) => s.currentTime);
    const currentPhase = useSimulation((s) => s.currentPhase);
    const ballY = useSimulation((s) => s.ballY);
    const ballVelocity = useSimulation((s) => s.ballVelocity);
    const mass = useSimulation((s) => s.mass);
    const gravity = useSimulation((s) => s.gravity);
    const jumpToTime = useSimulation((s) => s.jumpToTime);
    const { t } = useI18n();
    // Find current pedagogical step
    const currentStepIndex = (() => {
        for (let i = PEDAGOGICAL_STEPS.length - 1; i >= 0; i--) {
            if (currentTime >= PEDAGOGICAL_STEPS[i].timeStart)
                return i;
        }
        return 0;
    })();
    const step = PEDAGOGICAL_STEPS[currentStepIndex];
    const phase = PHASES.find((p) => p.id === currentPhase);
    // Physical values
    const ke = 0.5 * mass * ballVelocity * ballVelocity;
    const pe = mass * gravity * ballY;
    const totalE = ke + pe;
    const isPast = (i) => i < currentStepIndex;
    const isCurrent = (i) => i === currentStepIndex;
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0", children: [_jsx("span", { className: "text-base", children: t("teacher.icon") }), _jsx("h2", { className: "text-sm font-semibold text-white", children: t("teacher.title") }), _jsxs("span", { className: "ml-auto text-[10px] text-slate-600", children: [currentStepIndex + 1, "/", PEDAGOGICAL_STEPS.length] })] }), _jsx("div", { className: "px-4 pb-3 flex gap-1 flex-shrink-0", children: PEDAGOGICAL_STEPS.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-all duration-500 ${isPast(i)
                        ? "bg-emerald-500"
                        : isCurrent(i)
                            ? "bg-emerald-400 shadow-sm shadow-emerald-500/50"
                            : "bg-slate-700"}` }, i))) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 space-y-2.5", children: [_jsxs("div", { className: "bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-3.5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: step.icon }), _jsx("h3", { className: "text-sm font-semibold text-white", children: t(step.titleKey) }), isPast(currentStepIndex) && (_jsx("span", { className: "ml-auto text-emerald-400 text-xs", children: t("teacher.done") }))] }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed", children: t(step.descKey) }), step.formulaKey && (_jsx("div", { className: "mt-2.5 px-3 py-2 bg-slate-900/80 rounded-lg text-xs font-mono text-sky-300", children: t(step.formulaKey) }))] }), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.live_data") }), _jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [_jsx(LiveBadge, { label: t("teacher.height"), value: ballY.toFixed(2), unit: "m" }), _jsx(LiveBadge, { label: t("teacher.velocity"), value: ballVelocity.toFixed(2), unit: "m/s" }), _jsx(LiveBadge, { label: "KE", value: ke.toFixed(1), unit: "J" }), _jsx(LiveBadge, { label: "PE", value: pe.toFixed(1), unit: "J" })] }), _jsx("div", { className: "mt-1.5 pt-1.5 border-t border-slate-700/30", children: _jsx(LiveBadge, { label: t("teacher.total_energy"), value: totalE.toFixed(1), unit: "J", highlight: true }) })] }), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.steps") }), _jsx("div", { className: "space-y-0.5", children: PEDAGOGICAL_STEPS.map((s, i) => (_jsxs("button", { onClick: () => jumpToTime(s.timeStart), className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${isCurrent(i)
                                        ? "bg-emerald-900/30 border border-emerald-700/30"
                                        : "hover:bg-slate-800/60"}`, children: [_jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isPast(i)
                                                ? "bg-emerald-600 text-white"
                                                : isCurrent(i)
                                                    ? "bg-emerald-900/50 border border-emerald-600 text-emerald-400"
                                                    : "bg-slate-800 border border-slate-700 text-slate-600"}`, children: isPast(i) ? "✓" : i + 1 }), _jsx("span", { className: "text-sm flex-shrink-0", children: s.icon }), _jsx("span", { className: `text-xs ${isPast(i) ? "text-emerald-400" : isCurrent(i) ? "text-white" : "text-slate-500"}`, children: t(s.titleKey) }), _jsxs("span", { className: "text-[9px] text-slate-600 ml-auto", children: [s.timeStart.toFixed(1), "s"] })] }, i))) })] })] }), _jsx("div", { className: "px-4 py-3 border-t border-slate-800 flex-shrink-0", children: _jsx("div", { className: "text-[10px] text-slate-600 leading-relaxed", children: t("teacher.hint") }) })] }));
}
function LiveBadge({ label, value, unit, highlight, }) {
    return (_jsxs("div", { className: `px-2 py-1.5 rounded-lg text-xs ${highlight
            ? "bg-sky-900/30 border border-sky-700/30"
            : "bg-slate-900/50"}`, children: [_jsx("span", { className: "text-slate-500", children: label }), _jsx("span", { className: `ml-1.5 font-mono tabular-nums ${highlight ? "text-sky-300" : "text-slate-300"}`, children: value }), _jsx("span", { className: "text-[9px] text-slate-600 ml-0.5", children: unit })] }));
}
//# sourceMappingURL=TeacherPanel.js.map