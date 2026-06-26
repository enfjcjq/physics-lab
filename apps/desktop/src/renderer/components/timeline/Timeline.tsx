import { useRef, useCallback, useEffect } from "react";
import { useSimulation } from "../../features/experiment/experiment.store";
import type { SpeedLevel } from "../../features/experiment/experiment.store";

const SPEEDS: { label: string; value: SpeedLevel }[] = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "4x", value: 4 },
];

export function Timeline() {
  const playing = useSimulation((s) => s.playing);
  const currentTime = useSimulation((s) => s.currentTime);
  const totalDuration = useSimulation((s) => s.totalDuration);
  const timeScale = useSimulation((s) => s.timeScale);
  const play = useSimulation((s) => s.play);
  const pause = useSimulation((s) => s.pause);
  const stop = useSimulation((s) => s.stop);
  const replay = useSimulation((s) => s.replay);
  const stepForward = useSimulation((s) => s.stepForward);
  const stepBackward = useSimulation((s) => s.stepBackward);
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const setSpeed = useSimulation((s) => s.setSpeed);

  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Click on bar to jump
  const handleBarClick = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    jumpToTime(ratio * totalDuration);
  }, [jumpToTime, totalDuration]);

  // Drag scrubber
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!barRef.current || !dragging.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      jumpToTime(ratio * totalDuration);
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [jumpToTime, totalDuration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          playing ? pause() : play();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepBackward();
          break;
        case "ArrowRight":
          e.preventDefault();
          stepForward();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, play, pause, stepForward, stepBackward]);

  return (
    <div className="h-12 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 px-3 flex-shrink-0 select-none">
      {/* Transport controls */}
      <button onClick={stop} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Stop">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/></svg>
      </button>

      <button onClick={stepBackward} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Step Back">
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M9 2L4 6l5 4V2zM3 2v8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
      </button>

      <button onClick={playing ? pause : play} className="w-8 h-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors" title={playing ? "Pause" : "Play"}>
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="3.5" height="10" rx="0.5" fill="currentColor"/><rect x="7.5" y="1" width="3.5" height="10" rx="0.5" fill="currentColor"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 1l9 5-9 5V1z" fill="currentColor"/></svg>
        )}
      </button>

      <button onClick={stepForward} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Step Forward">
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 2l5 4-5 4V2zM9 2v8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
      </button>

      <button onClick={replay} className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Replay">
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M9 2.5A4.5 4.5 0 1010 7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700" />

      {/* Time display */}
      <span className="text-xs font-mono text-sky-400 w-24 text-right tabular-nums">
        {currentTime.toFixed(2)} s
      </span>

      {/* Scrubber bar */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="flex-1 h-7 bg-slate-800/50 rounded-full relative cursor-pointer hover:bg-slate-800 transition-colors group mx-2"
      >
        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 h-full bg-sky-600/20 rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
        {/* Scrubber head */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 rounded-full shadow-lg shadow-sky-900/50 cursor-grab active:cursor-grabbing border-2 border-sky-200 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Total time */}
      <span className="text-xs font-mono text-slate-500 w-20 tabular-nums">
        / {totalDuration.toFixed(2)} s
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-700" />

      {/* Speed selector */}
      <div className="flex gap-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSpeed(s.value)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              timeScale === s.value
                ? "bg-sky-600 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
