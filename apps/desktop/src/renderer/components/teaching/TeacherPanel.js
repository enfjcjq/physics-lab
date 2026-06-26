import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { useState } from "react";
const STEP_ICONS = ["○", "↓", "Σ", "≈", "√", "✓", "★"];
const STEP_QUIZZES = {
    2: {
        questionKey: "quiz.freefall.q1",
        options: ["quiz.freefall.q1.a", "quiz.freefall.q1.b", "quiz.freefall.q1.c"],
        correctIndex: 1,
        explanationKey: "quiz.freefall.q1.exp",
    },
    5: {
        questionKey: "quiz.freefall.q2",
        options: ["quiz.freefall.q2.a", "quiz.freefall.q2.b", "quiz.freefall.q2.c"],
        correctIndex: 0,
        explanationKey: "quiz.freefall.q2.exp",
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
    const jumpToTime = useSimulation((s) => s.jumpToTime);
    const { t } = useI18n();
    const [quizAnswers, setQuizAnswers] = useState({});
    const steps = scene?.teacher_steps ?? [];
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
    const currentIdx = (() => {
        for (let i = sortedSteps.length - 1; i >= 0; i--) {
            if (currentTime >= sortedSteps[i].timeStart)
                return i;
        }
        return 0;
    })();
    const step = sortedSteps[currentIdx] ?? null;
    const phase = phases.find((p) => p.id === currentPhaseId);
    const ke = 0.5 * mass * ballVelocity * ballVelocity;
    const pe = mass * gravity * ballY;
    const totalE = ke + pe;
    const isPast = (i) => i < currentIdx;
    const isCurrent = (i) => i === currentIdx;
    // Quiz for current step
    const stepOrder = step?.order ?? -1;
    const quiz = STEP_QUIZZES[stepOrder];
    const quizAnswer = quizAnswers[stepOrder];
    const showQuiz = quiz && quizAnswer === undefined;
    const quizCorrect = quizAnswer === quiz?.correctIndex;
    const handleQuizAnswer = (idx) => {
        setQuizAnswers((prev) => ({ ...prev, [stepOrder]: idx }));
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0", children: [_jsx("span", { className: "text-base", children: t("teacher.icon") }), _jsx("h2", { className: "text-sm font-semibold text-white", children: t("teacher.title") }), _jsxs("span", { className: "ml-auto text-[10px] text-slate-600", children: [currentIdx + 1, "/", sortedSteps.length] })] }), _jsx("div", { className: "px-4 pb-3 flex gap-1 flex-shrink-0", children: sortedSteps.map((_, i) => (_jsx("div", { className: `flex-1 h-1 rounded-full transition-all duration-500 ${isPast(i) ? "bg-emerald-500" : isCurrent(i) ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-700"}` }, i))) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-4 space-y-2.5", children: [showQuiz && (_jsxs("div", { className: "bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/30 rounded-xl p-3.5 animate-in fade-in", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDCA1" }), _jsx("h3", { className: "text-sm font-semibold text-amber-300", children: t("quiz.title") })] }), _jsx("p", { className: "text-xs text-slate-300 mb-3", children: t(quiz.questionKey) }), _jsx("div", { className: "space-y-1.5", children: quiz.options.map((opt, i) => (_jsxs("button", { onClick: () => handleQuizAnswer(i), className: "w-full text-left px-3 py-2 rounded-lg text-xs border transition-all bg-slate-800/60 border-slate-700 hover:border-amber-600/50 hover:bg-slate-700/60 text-slate-300", children: [String.fromCharCode(65 + i), ". ", t(opt)] }, i))) })] })), quizAnswer !== undefined && quiz && (_jsxs("div", { className: `border rounded-xl p-3.5 ${quizCorrect ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"}`, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-lg", children: quizCorrect ? "✅" : "❌" }), _jsx("h3", { className: `text-sm font-semibold ${quizCorrect ? "text-emerald-300" : "text-red-300"}`, children: quizCorrect ? t("quiz.correct") : t("quiz.incorrect") })] }), _jsx("p", { className: "text-xs text-slate-400", children: t(quiz.explanationKey) })] })), step && (_jsxs("div", { className: "bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-3.5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: STEP_ICONS[currentIdx % STEP_ICONS.length] }), _jsx("h3", { className: "text-sm font-semibold text-white", children: t(step.titleKey) })] }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed", children: t(step.descKey) }), step.formulaKey && (_jsx("div", { className: "mt-2.5 px-3 py-2 bg-slate-900/80 rounded-lg text-xs font-mono text-sky-300", children: t(step.formulaKey) }))] })), _jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.live_data") }), _jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [_jsx(LiveBadge, { label: t("teacher.height"), value: ballY.toFixed(2), unit: "m" }), _jsx(LiveBadge, { label: t("teacher.velocity"), value: ballVelocity.toFixed(2), unit: "m/s" }), _jsx(LiveBadge, { label: "KE", value: ke.toFixed(1), unit: "J" }), _jsx(LiveBadge, { label: "PE", value: pe.toFixed(1), unit: "J" })] }), _jsx("div", { className: "mt-1.5 pt-1.5 border-t border-slate-700/30", children: _jsx(LiveBadge, { label: t("teacher.total_energy"), value: totalE.toFixed(1), unit: "J", highlight: true }) })] }), sortedSteps.length > 0 && (_jsxs("div", { className: "bg-slate-800/40 border border-slate-700/40 rounded-xl p-3", children: [_jsx("h3", { className: "text-[10px] text-slate-500 uppercase tracking-wider mb-2", children: t("teacher.steps") }), _jsx("div", { className: "space-y-0.5", children: sortedSteps.map((s, i) => (_jsxs("button", { onClick: () => jumpToTime(s.timeStart), className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${isCurrent(i) ? "bg-emerald-900/30 border border-emerald-700/30" : "hover:bg-slate-800/60"}`, children: [_jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isPast(i) ? "bg-emerald-600 text-white" : isCurrent(i) ? "bg-emerald-900/50 border border-emerald-600 text-emerald-400" : "bg-slate-800 border border-slate-700 text-slate-600"}`, children: isPast(i) ? "✓" : i + 1 }), _jsx("span", { className: "text-sm flex-shrink-0", children: STEP_ICONS[i % STEP_ICONS.length] }), _jsx("span", { className: `text-xs ${isPast(i) ? "text-emerald-400" : isCurrent(i) ? "text-white" : "text-slate-500"}`, children: t(s.titleKey) }), _jsxs("span", { className: "text-[9px] text-slate-600 ml-auto", children: [s.timeStart.toFixed(1), "s"] })] }, s.id))) })] }))] }), _jsx("div", { className: "px-4 py-3 border-t border-slate-800 flex-shrink-0", children: _jsx("div", { className: "text-[10px] text-slate-600 leading-relaxed", children: t("teacher.hint") }) })] }));
}
function LiveBadge({ label, value, unit, highlight }) {
    return _jsxs("div", { className: `px-2 py-1.5 rounded-lg text-xs ${highlight ? "bg-sky-900/30 border border-sky-700/30" : "bg-slate-900/50"}`, children: [_jsx("span", { className: "text-slate-500", children: label }), _jsx("span", { className: `ml-1.5 font-mono tabular-nums ${highlight ? "text-sky-300" : "text-slate-300"}`, children: value }), _jsx("span", { className: "text-[9px] text-slate-600 ml-0.5", children: unit })] });
}
//# sourceMappingURL=TeacherPanel.js.map