import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import { useI18n } from "../../core/i18n";
import { useTeaching } from "../../core/teaching.store";

// ---- 7-step pedagogical flow ----
// Each step is a milestone in the learning journey

interface TeacherStep {
  icon: string;
  titleKey: string;
  descKey: string;
  formulaKey?: string;
  timeStart: number;
}

const PEDAGOGICAL_STEPS: TeacherStep[] = [
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
      if (currentTime >= PEDAGOGICAL_STEPS[i].timeStart) return i;
    }
    return 0;
  })();
  const step = PEDAGOGICAL_STEPS[currentStepIndex];
  const phase = PHASES.find((p) => p.id === currentPhase);

  // Physical values
  const ke = 0.5 * mass * ballVelocity * ballVelocity;
  const pe = mass * gravity * ballY;
  const totalE = ke + pe;

  const isPast = (i: number) => i < currentStepIndex;
  const isCurrent = (i: number) => i === currentStepIndex;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-base">{t("teacher.icon")}</span>
        <h2 className="text-sm font-semibold text-white">{t("teacher.title")}</h2>
        <span className="ml-auto text-[10px] text-slate-600">
          {currentStepIndex + 1}/{PEDAGOGICAL_STEPS.length}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="px-4 pb-3 flex gap-1 flex-shrink-0">
        {PEDAGOGICAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              isPast(i)
                ? "bg-emerald-500"
                : isCurrent(i)
                ? "bg-emerald-400 shadow-sm shadow-emerald-500/50"
                : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2.5">
        {/* Current step narrative */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-sky-900/20 border border-emerald-800/30 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{step.icon}</span>
            <h3 className="text-sm font-semibold text-white">{t(step.titleKey)}</h3>
            {isPast(currentStepIndex) && (
              <span className="ml-auto text-emerald-400 text-xs">{t("teacher.done")}</span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{t(step.descKey)}</p>
          {step.formulaKey && (
            <div className="mt-2.5 px-3 py-2 bg-slate-900/80 rounded-lg text-xs font-mono text-sky-300">
              {t(step.formulaKey)}
            </div>
          )}
        </div>

        {/* Live data */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            {t("teacher.live_data")}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            <LiveBadge label={t("teacher.height")} value={ballY.toFixed(2)} unit="m" />
            <LiveBadge label={t("teacher.velocity")} value={ballVelocity.toFixed(2)} unit="m/s" />
            <LiveBadge label="KE" value={ke.toFixed(1)} unit="J" />
            <LiveBadge label="PE" value={pe.toFixed(1)} unit="J" />
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/30">
            <LiveBadge label={t("teacher.total_energy")} value={totalE.toFixed(1)} unit="J" highlight />
          </div>
        </div>

        {/* Step list */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
            {t("teacher.steps")}
          </h3>
          <div className="space-y-0.5">
            {PEDAGOGICAL_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => jumpToTime(s.timeStart)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                  isCurrent(i)
                    ? "bg-emerald-900/30 border border-emerald-700/30"
                    : "hover:bg-slate-800/60"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    isPast(i)
                      ? "bg-emerald-600 text-white"
                      : isCurrent(i)
                      ? "bg-emerald-900/50 border border-emerald-600 text-emerald-400"
                      : "bg-slate-800 border border-slate-700 text-slate-600"
                  }`}
                >
                  {isPast(i) ? "✓" : i + 1}
                </span>
                <span className="text-sm flex-shrink-0">{s.icon}</span>
                <span
                  className={`text-xs ${
                    isPast(i) ? "text-emerald-400" : isCurrent(i) ? "text-white" : "text-slate-500"
                  }`}
                >
                  {t(s.titleKey)}
                </span>
                <span className="text-[9px] text-slate-600 ml-auto">{s.timeStart.toFixed(1)}s</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
        <div className="text-[10px] text-slate-600 leading-relaxed">
          {t("teacher.hint")}
        </div>
      </div>
    </div>
  );
}

function LiveBadge({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`px-2 py-1.5 rounded-lg text-xs ${
        highlight
          ? "bg-sky-900/30 border border-sky-700/30"
          : "bg-slate-900/50"
      }`}
    >
      <span className="text-slate-500">{label}</span>
      <span className={`ml-1.5 font-mono tabular-nums ${highlight ? "text-sky-300" : "text-slate-300"}`}>
        {value}
      </span>
      <span className="text-[9px] text-slate-600 ml-0.5">{unit}</span>
    </div>
  );
}
