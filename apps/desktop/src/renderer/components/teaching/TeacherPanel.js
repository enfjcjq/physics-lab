import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { useTeaching } from "../../core/teaching.store";
import { useState, useRef, useEffect } from "react";
const STEP_ICONS = ["\uD83D\uDC41\uFE0F", "\uD83D\uDCA1", "\uD83D\uDCD0", "\uD83D\uDCC8", "\uD83E\uDDE0", "\u2705", "\uD83C\uDF1F"];
const QUIZ_MAP = {
    "free-fall": {
        2: { questionKey: "quiz.freefall.q1", options: ["quiz.freefall.q1.a", "quiz.freefall.q1.b", "quiz.freefall.q1.c"], correctIndex: 0, explanationKey: "quiz.freefall.q1.exp" },
        4: { questionKey: "quiz.freefall.q2", options: ["quiz.freefall.q2.a", "quiz.freefall.q2.b", "quiz.freefall.q2.c"], correctIndex: 0, explanationKey: "quiz.freefall.q2.exp" },
    },
    "projectile-motion": {
        2: { questionKey: "quiz.projectile.q1", options: ["quiz.projectile.q1.a", "quiz.projectile.q1.b", "quiz.projectile.q1.c"], correctIndex: 0, explanationKey: "quiz.projectile.q1.exp" },
        4: { questionKey: "quiz.projectile.q2", options: ["quiz.projectile.q2.a", "quiz.projectile.q2.b", "quiz.projectile.q2.c"], correctIndex: 0, explanationKey: "quiz.projectile.q2.exp" },
    },
    "inclined-plane": {
        2: { questionKey: "quiz.incline.q1", options: ["quiz.incline.q1.a", "quiz.incline.q1.b", "quiz.incline.q1.c"], correctIndex: 0, explanationKey: "quiz.incline.q1.exp" },
        4: { questionKey: "quiz.incline.q2", options: ["quiz.incline.q2.a", "quiz.incline.q2.b", "quiz.incline.q2.c"], correctIndex: 0, explanationKey: "quiz.incline.q2.exp" },
    },
    "collision": {
        2: { questionKey: "quiz.collision.q1", options: ["quiz.collision.q1.a", "quiz.collision.q1.b", "quiz.collision.q1.c"], correctIndex: 0, explanationKey: "quiz.collision.q1.exp" },
        4: { questionKey: "quiz.collision.q2", options: ["quiz.collision.q2.a", "quiz.collision.q2.b", "quiz.collision.q2.c"], correctIndex: 0, explanationKey: "quiz.collision.q2.exp" },
    },
    "spring-mass": {
        2: { questionKey: "quiz.spring.q1", options: ["quiz.spring.q1.a", "quiz.spring.q1.b", "quiz.spring.q1.c"], correctIndex: 0, explanationKey: "quiz.spring.q1.exp" },
        4: { questionKey: "quiz.spring.q2", options: ["quiz.spring.q2.a", "quiz.spring.q2.b", "quiz.spring.q2.c"], correctIndex: 0, explanationKey: "quiz.spring.q2.exp" },
    },
    "pendulum": {
        2: { questionKey: "quiz.pendulum.q1", options: ["quiz.pendulum.q1.a", "quiz.pendulum.q1.b", "quiz.pendulum.q1.c"], correctIndex: 0, explanationKey: "quiz.pendulum.q1.exp" },
        4: { questionKey: "quiz.pendulum.q2", options: ["quiz.pendulum.q2.a", "quiz.pendulum.q2.b", "quiz.pendulum.q2.c"], correctIndex: 0, explanationKey: "quiz.pendulum.q2.exp" },
    },
};
export function TeacherPanel() {
    const currentTime = useSimulation((s) => s.currentTime);
    const currentPhaseId = useSimulation((s) => s.currentPhaseId);
    const ballY = useSimulation((s) => s.ballY);
    const ballVelocity = useSimulation((s) => s.ballVelocity);
    const mass = useSimulation((s) => s.mass);
    const gravity = useSimulation((s) => s.gravity);
    const scene = useSimulation((s) => s.scene);
    const phases = useSimulation((s) => s.phases);
    const activePluginId = useSimulation((s) => s.activePluginId);
    const jumpToTime = useSimulation((s) => s.jumpToTime);
    const jumpToPhase = useSimulation((s) => s.jumpToPhase);
    const play = useSimulation((s) => s.play);
    const togglePhaseLoop = useSimulation((s) => s.togglePhaseLoop);
    const stopPhaseLoop = useSimulation((s) => s.stopPhaseLoop);
    const loopPhaseActive = useSimulation((s) => s.loopPhaseActive);
    const { t } = useI18n();
    const { subMode } = useTeaching();
    const steps = scene?.teacher_steps ?? [];
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const isExplore = subMode === "explore";
    const currentIdx = (() => {
        for (let i = sortedSteps.length - 1; i >= 0; i--) {
            if (currentTime >= sortedSteps[i].timeStart)
                return i;
        }
        return 0;
    })();
    const step = sortedSteps[currentIdx] ?? null;
    const phase = phases.find((p) => p.id === currentPhaseId);
    // Auto-scroll step list to current step
    const stepListRef = useRef(null);
    const currentStepRef = useRef(null);
    useEffect(() => {
        if (currentStepRef.current) {
            currentStepRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [currentIdx]);
    const ke = 0.5 * mass * ballVelocity * ballVelocity;
    const pe = mass * gravity * ballY;
    const totalE = ke + pe;
    const isPast = (i) => i < currentIdx;
    const isCurrent = (i) => i === currentIdx;
    // Quiz state per phase (explore mode)
    const [phaseQuizAnswers, setPhaseQuizAnswers] = useState({});
    const currentPhaseQuizAnswer = phaseQuizAnswers[currentPhaseId];
    const quizSet = QUIZ_MAP[activePluginId] || QUIZ_MAP["free-fall"] || {};
    const phaseQuiz = quizSet[currentIdx] ?? null;
    const phaseQuizCorrect = phaseQuiz && currentPhaseQuizAnswer === phaseQuiz.correctIndex;
    const handlePhaseQuizAnswer = (idx) => {
        setPhaseQuizAnswers((prev) => ({ ...prev, [currentPhaseId]: idx }));
        if (phaseQuiz && idx === phaseQuiz.correctIndex) {
            // Loop the current phase animation while showing explanation
            if (currentPhaseId) {
                togglePhaseLoop(currentPhaseId);
            }
        }
    };
    const handleRetryQuiz = () => {
        setPhaseQuizAnswers((prev) => ({ ...prev, [currentPhaseId]: null }));
        stopPhaseLoop();
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0", children: [_jsx("span", { className: "text-base", children: isExplore ? "\uD83D\uDD0D" : "\uD83D\uDC68\u200D\uD83C\uDFEB" }), _jsx("h2", { className: "text-sm font-semibold text-white", children: isExplore ? t("teaching.mode.explore") : t("teacher.title") }), loopPhaseActive && isExplore && _jsx("span", { className: "text-[10px] text-amber-400 animate-pulse ml-1", children: "\\uD83D\\uDD01" }), _jsxs("span", { className: "ml-auto text-[10px] text-slate-600", children: [currentIdx + 1, "/", sortedSteps.length] })] }), _jsx("div", { className: "px-4 pb-3 flex gap-1 flex-shrink-0", children: sortedSteps.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-all duration-500 ${isPast(i) ? "bg-emerald-500" : isCurrent(i) ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-700"}` }, i))) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 space-y-2.5", children: [isExplore && phaseQuiz && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/30 rounded-xl p-3.5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: "\\u2753" }), _jsx("h3", { className: "text-sm font-semibold text-amber-300", children: t("quiz.title") })] }), _jsx("p", { className: "text-xs text-slate-300 mb-3", children: t(phaseQuiz.questionKey) }), _jsx("div", { className: "space-y-1.5", children: phaseQuiz.options.map((opt, i) => {
                                            const isSelected = currentPhaseQuizAnswer === i;
                                            const isWrong = isSelected && i !== phaseQuiz.correctIndex;
                                            return (_jsxs("button", { onClick: () => handlePhaseQuizAnswer(i), disabled: currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined, className: `w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${isSelected
                                                    ? (i === phaseQuiz.correctIndex ? "border-emerald-500/60 bg-emerald-900/30 text-emerald-300" : "border-red-500/60 bg-red-900/30 text-red-300")
                                                    : "border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60"} ${currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined ? "cursor-default" : "cursor-pointer"}`, children: [_jsxs("span", { className: "inline-block w-5 text-slate-500 font-mono", children: [String.fromCharCode(65 + i), "."] }), t(opt), isSelected && i === phaseQuiz.correctIndex && _jsx("span", { className: "ml-2", children: "\\u2705" }), isWrong && _jsx("span", { className: "ml-2", children: "\\u274C" })] }, i));
                                        }) })] }), currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined && (_jsxs("div", { className: `rounded-xl p-3.5 border ${phaseQuizCorrect ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-lg", children: phaseQuizCorrect ? "\u2705" : "\u274C" }), _jsx("h3", { className: `text-sm font-semibold ${phaseQuizCorrect ? "text-emerald-300" : "text-red-300"}`, children: phaseQuizCorrect ? t("quiz.correct") : t("quiz.incorrect") })] }), _jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: t(phaseQuiz.explanationKey) }), phaseQuizCorrect && step?.formulaKey && (_jsx("div", { className: "mt-2.5 px-3 py-2 bg-slate-900/80 rounded-lg text-xs font-mono text-sky-300 whitespace-pre-wrap", children: t(step.formulaKey) })), !phaseQuizCorrect && (_jsx("button", { onClick: handleRetryQuiz, className: "mt-2 text-xs text-sky-400 hover:text-sky-300", children: t("quiz.retry") }))] }))] })), !isExplore && step && (_jsxs("div", { className: "bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-3.5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: STEP_ICONS[currentIdx % STEP_ICONS.length] }), _jsx("h3", { className: "text-sm font-semibold text-white", children: t(step.titleKey) })] }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed", children: t(step.descKey) }), step.formulaKey && (_jsx("div", { className: "mt-2.5 px-3 py-2 bg-slate-800 rounded-lg", children: _jsx("div", { className: "text-xs font-mono text-sky-300 whitespace-pre-wrap", children: t(step.formulaKey) }) }))] })), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.live_data") }), _jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [_jsx(LiveBadge, { label: t("teacher.height"), value: ballY.toFixed(2), unit: "m" }), _jsx(LiveBadge, { label: t("teacher.velocity"), value: ballVelocity.toFixed(2), unit: "m/s" }), _jsx(LiveBadge, { label: "KE", value: ke.toFixed(1), unit: "J" }), _jsx(LiveBadge, { label: "PE", value: pe.toFixed(1), unit: "J" })] }), _jsx("div", { className: "mt-1.5 pt-1.5 border-t border-slate-700/30", children: _jsx(LiveBadge, { label: t("teacher.total_energy"), value: totalE.toFixed(1), unit: "J", highlight: true }) })] }), sortedSteps.length > 0 && (_jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.steps") }), _jsx("div", { ref: stepListRef, className: "space-y-0.5 max-h-[200px] overflow-y-auto scroll-smooth", children: sortedSteps.map((s, i) => (_jsxs("button", { onClick: () => { jumpToTime(s.timeStart); }, ref: isCurrent(i) ? currentStepRef : undefined, className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-500 ${isCurrent(i) ? "bg-emerald-900/30 border border-emerald-700/30 scale-[1.02]" : "hover:bg-slate-800/60"}`, children: [_jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isPast(i) ? "bg-emerald-600 text-white" : isCurrent(i) ? "bg-emerald-900/50 border border-emerald-600 text-emerald-400" : "bg-slate-800 border border-slate-700 text-slate-600"}`, children: isPast(i) ? "\u2713" : i + 1 }), _jsx("span", { className: "text-sm flex-shrink-0", children: STEP_ICONS[i % STEP_ICONS.length] }), _jsx("span", { className: `text-xs ${isPast(i) ? "text-emerald-400" : isCurrent(i) ? "text-white" : "text-slate-500"}`, children: t(s.titleKey) }), _jsxs("span", { className: "text-[9px] text-slate-600 ml-auto", children: [s.timeStart.toFixed(1), "s"] })] }, s.id))) })] }))] }), _jsx("div", { className: "px-4 py-3 border-t border-slate-800 flex-shrink-0", children: _jsx("div", { className: "text-[10px] text-slate-600 leading-relaxed", children: t("teacher.hint") }) })] }));
}
function LiveBadge({ label, value, unit, highlight }) {
    return _jsxs("div", { className: `px-2 py-1.5 rounded-lg text-xs ${highlight ? "bg-sky-900/30 border border-sky-700/30" : "bg-slate-900/50"}`, children: [_jsx("span", { className: "text-slate-500", children: label }), _jsx("span", { className: `ml-1.5 font-mono tabular-nums ${highlight ? "text-sky-300" : "text-slate-300"}`, children: value }), _jsx("span", { className: "text-[9px] text-slate-600 ml-0.5", children: unit })] });
}
//# sourceMappingURL=TeacherPanel.js.map