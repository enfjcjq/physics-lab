import { FormulaDisplay } from "./FormulaDisplay";
import { useSimulation } from "../../features/experiment/experiment.store";
import type { TeacherStep } from "@physics-lab/shared";
import { useI18n } from "../../core/i18n";
import { useTeaching } from "../../core/teaching.store";
import { useMastery } from "../../core/mastery.store";
import { useWrongAnswers } from "../../core/wrong-answer.store";
import { pluginRegistry } from "../../core/plugin-registry";
import { useState, useRef, useEffect } from "react";

const STEP_ICONS = ["\uD83D\uDC41\uFE0F", "\uD83D\uDCA1", "\uD83D\uDCD0", "\uD83D\uDCC8", "\uD83E\uDDE0", "\u2705", "\uD83C\uDF1F"];

// Quiz questions mapped by plugin ID -> step index
interface QuizItem {
  questionKey: string;
  options: string[];
  correctIndex: number;
  explanationKey: string;
  hintKey?: string;
  difficulty?: "easy" | "medium" | "hard";
}

const QUIZ_MAP: Record<string, Record<number, QuizItem[]>> = {
  "free-fall": {
    2: [{ questionKey: "quiz.freefall.q1", options: ["quiz.freefall.q1.a", "quiz.freefall.q1.b", "quiz.freefall.q1.c"], correctIndex: 0, explanationKey: "quiz.freefall.q1.exp", hintKey: "quiz.freefall.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.freefall.q3", options: ["quiz.freefall.q3.a", "quiz.freefall.q3.b", "quiz.freefall.q3.c"], correctIndex: 0, explanationKey: "quiz.freefall.q3.exp", hintKey: "quiz.freefall.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.freefall.q2", options: ["quiz.freefall.q2.a", "quiz.freefall.q2.b", "quiz.freefall.q2.c"], correctIndex: 0, explanationKey: "quiz.freefall.q2.exp", hintKey: "quiz.freefall.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.freefall.q4", options: ["quiz.freefall.q4.a", "quiz.freefall.q4.b", "quiz.freefall.q4.c"], correctIndex: 2, explanationKey: "quiz.freefall.q4.exp", hintKey: "quiz.freefall.q4.hint", difficulty: "hard" }],
  },
  "projectile-motion": {
    2: [{ questionKey: "quiz.projectile.q1", options: ["quiz.projectile.q1.a", "quiz.projectile.q1.b", "quiz.projectile.q1.c"], correctIndex: 0, explanationKey: "quiz.projectile.q1.exp", hintKey: "quiz.projectile.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.projectile.q3", options: ["quiz.projectile.q3.a", "quiz.projectile.q3.b", "quiz.projectile.q3.c"], correctIndex: 1, explanationKey: "quiz.projectile.q3.exp", hintKey: "quiz.projectile.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.projectile.q2", options: ["quiz.projectile.q2.a", "quiz.projectile.q2.b", "quiz.projectile.q2.c"], correctIndex: 0, explanationKey: "quiz.projectile.q2.exp", hintKey: "quiz.projectile.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.projectile.q4", options: ["quiz.projectile.q4.a", "quiz.projectile.q4.b", "quiz.projectile.q4.c"], correctIndex: 1, explanationKey: "quiz.projectile.q4.exp", hintKey: "quiz.projectile.q4.hint", difficulty: "hard" }],
  },
  "inclined-plane": {
    2: [{ questionKey: "quiz.incline.q1", options: ["quiz.incline.q1.a", "quiz.incline.q1.b", "quiz.incline.q1.c"], correctIndex: 0, explanationKey: "quiz.incline.q1.exp", hintKey: "quiz.incline.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.incline.q3", options: ["quiz.incline.q3.a", "quiz.incline.q3.b", "quiz.incline.q3.c"], correctIndex: 1, explanationKey: "quiz.incline.q3.exp", hintKey: "quiz.incline.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.incline.q2", options: ["quiz.incline.q2.a", "quiz.incline.q2.b", "quiz.incline.q2.c"], correctIndex: 0, explanationKey: "quiz.incline.q2.exp", hintKey: "quiz.incline.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.incline.q4", options: ["quiz.incline.q4.a", "quiz.incline.q4.b", "quiz.incline.q4.c"], correctIndex: 0, explanationKey: "quiz.incline.q4.exp", hintKey: "quiz.incline.q4.hint", difficulty: "hard" }],
  },
  "collision": {
    2: [{ questionKey: "quiz.collision.q1", options: ["quiz.collision.q1.a", "quiz.collision.q1.b", "quiz.collision.q1.c"], correctIndex: 0, explanationKey: "quiz.collision.q1.exp", hintKey: "quiz.collision.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.collision.q3", options: ["quiz.collision.q3.a", "quiz.collision.q3.b", "quiz.collision.q3.c"], correctIndex: 0, explanationKey: "quiz.collision.q3.exp", hintKey: "quiz.collision.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.collision.q2", options: ["quiz.collision.q2.a", "quiz.collision.q2.b", "quiz.collision.q2.c"], correctIndex: 0, explanationKey: "quiz.collision.q2.exp", hintKey: "quiz.collision.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.collision.q4", options: ["quiz.collision.q4.a", "quiz.collision.q4.b", "quiz.collision.q4.c"], correctIndex: 1, explanationKey: "quiz.collision.q4.exp", hintKey: "quiz.collision.q4.hint", difficulty: "hard" }],
  },
  "spring-mass": {
    2: [{ questionKey: "quiz.spring.q1", options: ["quiz.spring.q1.a", "quiz.spring.q1.b", "quiz.spring.q1.c"], correctIndex: 0, explanationKey: "quiz.spring.q1.exp", hintKey: "quiz.spring.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.spring.q3", options: ["quiz.spring.q3.a", "quiz.spring.q3.b", "quiz.spring.q3.c"], correctIndex: 1, explanationKey: "quiz.spring.q3.exp", hintKey: "quiz.spring.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.spring.q2", options: ["quiz.spring.q2.a", "quiz.spring.q2.b", "quiz.spring.q2.c"], correctIndex: 0, explanationKey: "quiz.spring.q2.exp", hintKey: "quiz.spring.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.spring.q4", options: ["quiz.spring.q4.a", "quiz.spring.q4.b", "quiz.spring.q4.c"], correctIndex: 0, explanationKey: "quiz.spring.q4.exp", hintKey: "quiz.spring.q4.hint", difficulty: "hard" }],
  },
  "pendulum": {
    2: [{ questionKey: "quiz.pendulum.q1", options: ["quiz.pendulum.q1.a", "quiz.pendulum.q1.b", "quiz.pendulum.q1.c"], correctIndex: 0, explanationKey: "quiz.pendulum.q1.exp", hintKey: "quiz.pendulum.q1.hint", difficulty: "easy" }],
    3: [{ questionKey: "quiz.pendulum.q3", options: ["quiz.pendulum.q3.a", "quiz.pendulum.q3.b", "quiz.pendulum.q3.c"], correctIndex: 1, explanationKey: "quiz.pendulum.q3.exp", hintKey: "quiz.pendulum.q3.hint", difficulty: "medium" }],
    4: [{ questionKey: "quiz.pendulum.q2", options: ["quiz.pendulum.q2.a", "quiz.pendulum.q2.b", "quiz.pendulum.q2.c"], correctIndex: 0, explanationKey: "quiz.pendulum.q2.exp", hintKey: "quiz.pendulum.q2.hint", difficulty: "medium" }],
    5: [{ questionKey: "quiz.pendulum.q4", options: ["quiz.pendulum.q4.a", "quiz.pendulum.q4.b", "quiz.pendulum.q4.c"], correctIndex: 2, explanationKey: "quiz.pendulum.q4.exp", hintKey: "quiz.pendulum.q4.hint", difficulty: "hard" }],
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

  const steps: TeacherStep[] = scene?.teacher_steps ?? [];
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const isExplore = subMode === "explore";

  const currentIdx = (() => {
    for (let i = sortedSteps.length - 1; i >= 0; i--) {
      if (currentTime >= sortedSteps[i].timeStart) return i;
    }
    return 0;
  })();
  const step = sortedSteps[currentIdx] ?? null;
  const phase = phases.find((p) => p.id === currentPhaseId);
  // Auto-scroll step list to current step
  const stepListRef = useRef<HTMLDivElement>(null);
  const currentStepRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (currentStepRef.current) {
      currentStepRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentIdx]);

  const ke = 0.5 * mass * ballVelocity * ballVelocity;
  const pe = mass * gravity * ballY;
  const totalE = ke + pe;

  const isPast = (i: number) => i < currentIdx;
  const isCurrent = (i: number) => i === currentIdx;

  // Quiz state per phase (explore mode)
  const [phaseQuizAnswers, setPhaseQuizAnswers] = useState<Record<string, number | null>>({});
  const currentPhaseQuizAnswer = phaseQuizAnswers[currentPhaseId];
  const quizSet = QUIZ_MAP[activePluginId] || QUIZ_MAP["free-fall"] || {};
  const phaseQuizzes = quizSet[currentIdx] ?? null;
  // Adaptive: pick quiz based on mastery. Higher mastery -> harder questions
  const phaseQuiz = phaseQuizzes ? (function() {
    if (!phaseQuizzes || phaseQuizzes.length === 0) return null;
    const plugin = pluginRegistry.get(activePluginId);
    const kps = plugin?.getKnowledgePoints() ?? [];
    const entries = useMastery.getState().getAll();
    const avgScore = kps.length > 0 ? kps.reduce(function(s, kp) {
      const e = entries[activePluginId + ":" + kp.id] ?? entries[kp.id];
      return s + (e?.score ?? 0);
    }, 0) / kps.length : 0;
    // avgScore 0-33: easy, 34-66: medium, 67+: hard
    const targetDiff = avgScore < 34 ? "easy" : avgScore < 67 ? "medium" : "hard";
    const match = phaseQuizzes.find(function(q) { return q.difficulty === targetDiff; });
    return match || phaseQuizzes[0];
  })() : null;
  const phaseQuizCorrect = phaseQuiz && currentPhaseQuizAnswer === phaseQuiz.correctIndex;

  const handlePhaseQuizAnswer = (idx: number) => {
    setPhaseQuizAnswers((prev) => ({ ...prev, [currentPhaseId]: idx }));
    const correct = phaseQuiz && idx === phaseQuiz.correctIndex;
    if (phaseQuiz) {
      const plugin = pluginRegistry.get(activePluginId);
      const kps = plugin?.getKnowledgePoints() ?? [];
      const kpId = kps[currentIdx % kps.length]?.id ?? activePluginId + ':step' + currentIdx;
      useMastery.getState().markAttempt(activePluginId + ':' + kpId, !!correct);
    }
    if (correct && currentPhaseId) {
      togglePhaseLoop(currentPhaseId);
    }
  };

  const handleRetryQuiz = () => {
    setPhaseQuizAnswers((prev) => ({ ...prev, [currentPhaseId]: null }));
    stopPhaseLoop();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-base">{isExplore ? "\uD83D\uDD0D" : "\uD83D\uDC68\u200D\uD83C\uDFEB"}</span>
        <h2 className="text-sm font-semibold text-white">
          {isExplore ? t("teaching.mode.explore") : t("teacher.title")}
        </h2>
        {loopPhaseActive && isExplore && <span className="text-[10px] text-amber-400 animate-pulse ml-1">\uD83D\uDD01</span>}
        <span className="ml-auto text-[10px] text-slate-600">
          {currentIdx + 1}/{sortedSteps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3 flex gap-1 flex-shrink-0">
        {sortedSteps.map((_, i) => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${isPast(i)?"bg-emerald-500":isCurrent(i)?"bg-emerald-400 shadow-sm shadow-emerald-500/50":"bg-slate-700"}`}/>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2.5">
        {/* ===== EXPLORE MODE: Phase-Based Quizzes ===== */}
        {isExplore && phaseQuiz && (
          <>
            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-700/30 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">\u2753</span>
                <h3 className="text-sm font-semibold text-amber-300">{t("quiz.title")}</h3>
              </div>
              <p className="text-xs text-slate-300 mb-3">{t(phaseQuiz.questionKey)}</p>
              <div className="space-y-1.5">
                {phaseQuiz.options.map((opt, i) => {
                  const isSelected = currentPhaseQuizAnswer === i;
                  const isWrong = isSelected && i !== phaseQuiz.correctIndex;
                  return (
                    <button key={i} onClick={() => handlePhaseQuizAnswer(i)}
                      disabled={currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                        isSelected
                          ? (i === phaseQuiz.correctIndex ? "border-emerald-500/60 bg-emerald-900/30 text-emerald-300" : "border-red-500/60 bg-red-900/30 text-red-300")
                          : "border-slate-700/50 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60"
                      } ${currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="inline-block w-5 text-slate-500 font-mono">{String.fromCharCode(65 + i)}.</span>
                      {t(opt)}
                      {isSelected && i === phaseQuiz.correctIndex && <span className="ml-2">\u2705</span>}
                      {isWrong && <span className="ml-2">\u274C</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiz feedback */}
            {currentPhaseQuizAnswer !== null && currentPhaseQuizAnswer !== undefined && (
              <div className={`rounded-xl p-3.5 border ${
                phaseQuizCorrect ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{phaseQuizCorrect ? "\u2705" : "\u274C"}</span>
                  <h3 className={`text-sm font-semibold ${phaseQuizCorrect ? "text-emerald-300" : "text-red-300"}`}>
                    {phaseQuizCorrect ? t("quiz.correct") : t("quiz.incorrect")}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{t(phaseQuiz.explanationKey)}</p>
                {!phaseQuizCorrect && phaseQuiz.hintKey && (
                  <div className="mt-2 pt-2 border-t border-red-800/30">
                    <span className="text-[10px] text-amber-400">{"\uD83D\uDCA1 " + t("quiz.hint")}</span>
                    <p className="text-[10px] text-amber-300/80 mt-0.5">{t(phaseQuiz.hintKey)}</p>
                  </div>
                )}
                {phaseQuizCorrect && step?.formulaKey && (
                  <div className="mt-2.5 px-3 py-2 bg-slate-900/80 rounded-lg text-xs font-mono text-sky-300 whitespace-pre-wrap">
                    {t(step.formulaKey)}
                  </div>
                )}
                {!phaseQuizCorrect && (
                  <button onClick={handleRetryQuiz}
                    className="mt-2 text-xs text-sky-400 hover:text-sky-300">
                    {t("quiz.retry")}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== NON-EXPLORE: Current step with formula ===== */}
        {!isExplore && step && (
          <div className="bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{STEP_ICONS[currentIdx % STEP_ICONS.length]}</span>
              <h3 className="text-sm font-semibold text-white">{t(step.titleKey)}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{t(step.descKey)}</p>
            {step.formulaKey && (
              <div className="mt-2.5 px-3 py-2 bg-slate-800 rounded-lg">
                <FormulaDisplay formula={t(step.formulaKey)} className="text-xs" />
              </div>
            )}
          </div>
        )}

        {/* Live data */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t("teacher.live_data")}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <LiveBadge label={t("teacher.height")} value={ballY.toFixed(2)} unit="m"/>
            <LiveBadge label={t("teacher.velocity")} value={ballVelocity.toFixed(2)} unit="m/s"/>
            <LiveBadge label="KE" value={ke.toFixed(1)} unit="J"/>
            <LiveBadge label="PE" value={pe.toFixed(1)} unit="J"/>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/30">
            <LiveBadge label={t("teacher.total_energy")} value={totalE.toFixed(1)} unit="J" highlight/>
          </div>
        </div>

        {/* Step list */}
        {sortedSteps.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t("teacher.steps")}</h3>
            <div ref={stepListRef} className="space-y-0.5 max-h-[200px] overflow-y-auto scroll-smooth">
              {sortedSteps.map((s, i) => (
                <button key={s.id} onClick={() => { jumpToTime(s.timeStart); }}
                  ref={isCurrent(i) ? currentStepRef : undefined}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-500 ${isCurrent(i)?"bg-emerald-900/30 border border-emerald-700/30 scale-[1.02]":"hover:bg-slate-800/60"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isPast(i)?"bg-emerald-600 text-white":isCurrent(i)?"bg-emerald-900/50 border border-emerald-600 text-emerald-400":"bg-slate-800 border border-slate-700 text-slate-600"}`}>
                    {isPast(i)?"\u2713":i+1}
                  </span>
                  <span className="text-sm flex-shrink-0">{STEP_ICONS[i % STEP_ICONS.length]}</span>
                  <span className={`text-xs ${isPast(i)?"text-emerald-400":isCurrent(i)?"text-white":"text-slate-500"}`}>{t(s.titleKey)}</span>
                  <span className="text-[9px] text-slate-600 ml-auto">{s.timeStart.toFixed(1)}s</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
        <div className="text-[10px] text-slate-600 leading-relaxed">{t("teacher.hint")}</div>
      </div>
    </div>
  );
}

function LiveBadge({label,value,unit,highlight}:{label:string;value:string;unit:string;highlight?:boolean}){
  return <div className={`px-2 py-1.5 rounded-lg text-xs ${highlight?"bg-sky-900/30 border border-sky-700/30":"bg-slate-900/50"}`}>
    <span className="text-slate-500">{label}</span>
    <span className={`ml-1.5 font-mono tabular-nums ${highlight?"text-sky-300":"text-slate-300"}`}>{value}</span>
    <span className="text-[9px] text-slate-600 ml-0.5">{unit}</span>
  </div>;
}
