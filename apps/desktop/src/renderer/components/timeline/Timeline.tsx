import { useRef, useCallback, useEffect } from "react";
import { useSimulation } from "../../features/experiment/experiment.store";
import { PHASES } from "../../stores/ui.store";
import type { SpeedLevel } from "../../features/experiment/experiment.store";
import type { ExperimentPhase } from "../../stores/ui.store";
import { useI18n } from "../../core/i18n";

const SPEEDS: { label: string; value: SpeedLevel }[] = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
];

const PHASE_COLORS: Record<ExperimentPhase, string> = {
  release: "#22c55e",
  falling: "#3b82f6",
  impact: "#f59e0b",
  bounce: "#ef4444",
};

export function Timeline() {
  const playing = useSimulation((s) => s.playing);
  const currentTime = useSimulation((s) => s.currentTime);
  const totalDuration = useSimulation((s) => s.totalDuration);
  const timeScale = useSimulation((s) => s.timeScale);
  const currentPhase = useSimulation((s) => s.currentPhase);
  const play = useSimulation((s) => s.play);
  const pause = useSimulation((s) => s.pause);
  const stop = useSimulation((s) => s.stop);
  const replay = useSimulation((s) => s.replay);
  const stepForward = useSimulation((s) => s.stepForward);
  const stepBackward = useSimulation((s) => s.stepBackward);
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const setSpeed = useSimulation((s) => s.setSpeed);
  const { t } = useI18n();

  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getTimeFromEvent = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * totalDuration;
  }, [totalDuration]);

  const handleBarClick = useCallback((e: React.MouseEvent) => {
    jumpToTime(getTimeFromEvent(e.clientX));
  }, [jumpToTime, getTimeFromEvent]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      jumpToTime(getTimeFromEvent(ev.clientX));
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [jumpToTime, getTimeFromEvent]);

  // Scroll wheel on timeline bar: fine-tune time
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.05 : -0.05;
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + delta));
    jumpToTime(newTime);
  }, [currentTime, totalDuration, jumpToTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space": e.preventDefault(); playing ? pause() : play(); break;
        case "ArrowLeft": e.preventDefault(); stepBackward(); break;
        case "ArrowRight": e.preventDefault(); stepForward(); break;
        case "Home": e.preventDefault(); jumpToTime(0); break;
        case "End": e.preventDefault(); jumpToTime(totalDuration); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, play, pause, stepForward, stepBackward, jumpToTime, totalDuration]);

  return (
    <div className="h-14 bg-slate-900/95 border-t border-slate-800 flex flex-col flex-shrink-0 select-none">
      {/* Phase markers row */}
      <div className="h-5 flex items-center px-8 relative mx-16">
        {PHASES.map((p) => {
          const leftPercent = (p.timeRange[0] / totalDuration) * 100;
          const widthPercent = ((p.timeRange[1] - p.timeRange[0]) / totalDuration) * 100;
          const isActive = currentPhase === p.id;
          const phaseIdx = PHASES.findIndex((ph) => ph.id === currentPhase);
          const thisIdx = PHASES.findIndex((ph) => ph.id === p.id);
          const isPast = phaseIdx > thisIdx;

          return (
            <button
              key={p.id}
              onClick={() => jumpToTime(p.timeRange[0])}
              className="absolute -translate-x-1/2 group"
              style={{ left: `${leftPercent}%` }}
              title={`${t(p.label)} (${p.timeRange[0].toFixed(1)}s - ${p.timeRange[1].toFixed(1)}s)`}
            >
              {/* Phase colored bar segment */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full opacity-30 pointer-events-none"
                style={{
                  left: "4px",
                  width: `calc(${widthPercent}% - 8px)`,
                  backgroundColor: PHASE_COLORS[p.id],
                }}
              />
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 ${
                  isActive
                    ? "scale-150 border-white shadow-lg shadow-sky-500/50"
                    : isPast
                    ? "border-slate-500 opacity-70"
                    : "border-slate-600 opacity-40"
                }`}
                style={{
                  backgroundColor: isActive || isPast ? PHASE_COLORS[p.id] : "transparent",
                }}
              />
              <span
                className={`absolute top-3 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "text-white opacity-100 font-medium"
                    : "text-slate-500 opacity-0 group-hover:opacity-100"
                }`}
              >
                {p.icon} {t(p.label)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Transport controls row */}
      <div className="flex-1 flex items-center gap-2 px-3">
        {/* Stop */}
        <button
          onClick={stop}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t("ctrl.stop")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor" />
          </svg>
        </button>

        {/* Step Backward */}
        <button
          onClick={stepBackward}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t("ctrl.prevFrame")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M9 2L4 6l5 4V2zM3 2v8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={playing ? pause : play}
          className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-all duration-150 active:scale-95"
          title={playing ? t("ctrl.pause") : t("ctrl.play")}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1.5" y="1" width="3.5" height="10" rx="0.5" fill="currentColor" />
              <rect x="7" y="1" width="3.5" height="10" rx="0.5" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 1l9 5-9 5V1z" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* Step Forward */}
        <button
          onClick={stepForward}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t("ctrl.nextFrame")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M3 2l5 4-5 4V2zM9 2v8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        {/* Replay */}
        <button
          onClick={replay}
          className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={t("ctrl.replay")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M9 2.5A4.5 4.5 0 1010 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <div className="w-px h-5 bg-slate-700" />

        {/* Current time */}
        <span className="text-xs font-mono text-sky-400 w-24 text-right tabular-nums">
          {currentTime.toFixed(2)} s
        </span>

        {/* Time bar with scroll wheel */}
        <div
          ref={barRef}
          onClick={handleBarClick}
          onWheel={handleWheel}
          className="flex-1 h-7 bg-slate-800/50 rounded-full relative cursor-pointer hover:bg-slate-800 transition-colors group mx-2"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-600/30 to-sky-500/20 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
          {/* Phase segment indicators */}
          {PHASES.map((p) => {
            const leftPct = (p.timeRange[0] / totalDuration) * 100;
            const wPct = ((p.timeRange[1] - p.timeRange[0]) / totalDuration) * 100;
            return (
              <div
                key={`seg-${p.id}`}
                className="absolute top-0 h-full pointer-events-none"
                style={{
                  left: `${leftPct}%`,
                  width: `${wPct}%`,
                  borderLeft: p.id !== PHASES[0].id ? "1px solid rgba(148,163,184,0.15)" : "none",
                }}
              />
            );
          })}
          {/* Draggable thumb */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 rounded-full shadow-lg shadow-sky-900/50 cursor-grab active:cursor-grabbing border-2 border-sky-200 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Total duration */}
        <span className="text-xs font-mono text-slate-500 w-20 tabular-nums">
          / {totalDuration.toFixed(2)} s
        </span>

        <div className="w-px h-5 bg-slate-700" />

        {/* Speed buttons */}
        <div className="flex gap-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpeed(s.value)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-150 ${
                timeScale === s.value
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
