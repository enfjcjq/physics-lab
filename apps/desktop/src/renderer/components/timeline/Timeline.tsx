import { useRef, useCallback, useEffect, useState } from "react";
import { useSimulation } from "../../features/experiment/experiment.store";
import type { SpeedLevel } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";

const SPEEDS: { label: string; value: SpeedLevel }[] = [
  { label: "0.25x", value: 0.25 }, { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 }, { label: "2x", value: 2 }, { label: "4x", value: 4 },
];

const PHASE_COLORS: Record<string, string> = {
  release: "#22c55e", falling: "#3b82f6", impact: "#f59e0b", bounce: "#ef4444",
};

function TransBtn({ onClick, title, active, children }:
  { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} title={title}
    className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-150 ${active ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95"}`}>
    {children}
  </button>;
}

export function Timeline() {
  const playing = useSimulation((s) => s.playing);
  const currentTime = useSimulation((s) => s.currentTime);
  const totalDuration = useSimulation((s) => s.totalDuration);
  const timeScale = useSimulation((s) => s.timeScale);
  const currentPhaseId = useSimulation((s) => s.currentPhaseId);
  const phases = useSimulation((s) => s.phases);
  const play = useSimulation((s) => s.play);
  const pause = useSimulation((s) => s.pause);
  const stop = useSimulation((s) => s.stop);
  const replay = useSimulation((s) => s.replay);
  const stepForward = useSimulation((s) => s.stepForward);
  const stepBackward = useSimulation((s) => s.stepBackward);
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const jumpToPhase = useSimulation((s) => s.jumpToPhase);
  const setSpeed = useSimulation((s) => s.setSpeed);
  const { t } = useI18n();

  const [loop, setLoop] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getTime = useCallback((cx: number) => {
    if (!barRef.current) return 0;
    const r = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (cx - r.left) / r.width)) * totalDuration;
  }, [totalDuration]);

  const skipBack = useCallback(() => jumpToTime(Math.max(0, currentTime - 0.5)), [currentTime, jumpToTime]);
  const skipForward = useCallback(() => jumpToTime(Math.min(totalDuration, currentTime + 0.5)), [currentTime, totalDuration, jumpToTime]);

  const phaseIdx = phases.findIndex((p) => p.id === currentPhaseId);
  const prevPhase = useCallback(() => { if (phaseIdx > 0) jumpToPhase(phases[phaseIdx - 1].id); }, [phaseIdx, phases, jumpToPhase]);
  const nextPhase = useCallback(() => { if (phaseIdx < phases.length - 1) jumpToPhase(phases[phaseIdx + 1].id); }, [phaseIdx, phases, jumpToPhase]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space": e.preventDefault(); playing ? pause() : play(); break;
        case "ArrowLeft": e.preventDefault(); e.shiftKey ? skipBack() : stepBackward(); break;
        case "ArrowRight": e.preventDefault(); e.shiftKey ? skipForward() : stepForward(); break;
        case "Home": e.preventDefault(); jumpToTime(0); break;
        case "End": e.preventDefault(); jumpToTime(totalDuration); break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [playing, play, pause, stepForward, stepBackward, skipBack, skipForward, jumpToTime, totalDuration]);

  const ticks = Array.from({ length: Math.ceil(totalDuration / 0.5) + 1 }, (_, i) => i * 0.5);

  return (
    <div className="flex-shrink-0 bg-slate-900/95 border-t border-slate-800 select-none" style={{ height: 64 }}>
      {/* Transport row */}
      <div className="h-7 flex items-center gap-1.5 px-3">
        <TransBtn onClick={stop} title={t("ctrl.stop")}>
          <svg width="11" height="11" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/></svg>
        </TransBtn>
        <TransBtn onClick={skipBack} title={t("ctrl.skipBack")}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M7 2L3 6l4 4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M10 2L8 6l2 4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </TransBtn>
        <TransBtn onClick={stepBackward} title={t("ctrl.prevFrame")}>
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M9 2L4 6l5 4V2zM3 2v8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </TransBtn>
        <button onClick={playing ? pause : play}
          className="w-8 h-7 rounded-md bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-all duration-150 active:scale-95"
          title={playing ? t("ctrl.pause") : t("ctrl.play")}>
          {playing
            ? <svg width="11" height="11" viewBox="0 0 12 12"><rect x="1.5" y="1" width="3.5" height="10" rx="0.5" fill="currentColor"/><rect x="7" y="1" width="3.5" height="10" rx="0.5" fill="currentColor"/></svg>
            : <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 1l9 5-9 5V1z" fill="currentColor"/></svg>}
        </button>
        <TransBtn onClick={stepForward} title={t("ctrl.nextFrame")}>
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M3 2l5 4-5 4V2zM9 2v8" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </TransBtn>
        <TransBtn onClick={skipForward} title={t("ctrl.skipForward")}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M5 2l4 4-4 4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M2 2l2 4-2 4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </TransBtn>
        <TransBtn onClick={prevPhase} title={t("ctrl.prevPhase")}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M10 2L5 6l5 4" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="2" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TransBtn>
        <TransBtn onClick={nextPhase} title={t("ctrl.nextPhase")}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l5 4-5 4" stroke="currentColor" strokeWidth="1.5" fill="none"/><line x1="10" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5"/></svg>
        </TransBtn>
        <TransBtn onClick={replay} title={t("ctrl.replay")}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M9 2.5A4.5 4.5 0 1010 7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 3v3H7" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </TransBtn>
        <TransBtn onClick={() => setLoop(!loop)} title={t("ctrl.loop")} active={loop}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3h5a2.5 2.5 0 010 5H3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M5 1L3 3l2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </TransBtn>
        <div className="w-px h-4 bg-slate-700 mx-0.5"/>
        <span className="text-xs font-mono text-sky-400 w-20 text-right tabular-nums">{currentTime.toFixed(2)} s</span>
        <div className="flex gap-0.5 ml-1">
          {SPEEDS.map((s) => (
            <button key={s.value} onClick={() => setSpeed(s.value)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${timeScale===s.value?"bg-sky-600 text-white shadow-sm":"text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex-1"/>
        <span className="text-[10px] text-slate-600">{totalDuration.toFixed(1)} s</span>
      </div>

      {/* Track row */}
      <div className="h-9 flex items-center relative mx-4" ref={barRef}
        onClick={(e) => jumpToTime(getTime(e.clientX))}
        onWheel={(e) => { e.preventDefault(); const s = e.shiftKey ? 0.2 : 0.05; jumpToTime(Math.max(0,Math.min(totalDuration,currentTime+(e.deltaY>0?s:-s)))); }}>
        <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-800 cursor-pointer" style={{top:4}}/>
        {/* Phase segments */}
        {phases.map((p) => {
          const l = (p.timeRange[0]/totalDuration)*100, w = ((p.timeRange[1]-p.timeRange[0])/totalDuration)*100;
          return <div key={p.id} className="absolute h-1.5 pointer-events-none opacity-40" style={{left:`${l}%`,width:`${w}%`,top:4,borderRadius:999,backgroundColor:PHASE_COLORS[p.id]||"#475569"}}/>;
        })}
        <div className="absolute left-0 h-1.5 rounded-full pointer-events-none" style={{width:`${progress}%`,top:4,background:"linear-gradient(90deg,rgba(56,189,248,0.6),rgba(56,189,248,0.3))"}}/>
        {/* Phase nodes */}
        {phases.map((p) => {
          const l = (p.timeRange[0]/totalDuration)*100, isActive = currentPhaseId===p.id;
          const idx = phases.findIndex(ph=>ph.id===p.id), isPast = phaseIdx>idx, isCurrentOrPast = phaseIdx>=idx;
          const c = PHASE_COLORS[p.id]||"#475569";
          return <button key={p.id} onClick={(e)=>{e.stopPropagation();jumpToPhase(p.id);}} className="absolute -translate-x-1/2 group" style={{left:`${l}%`,top:0}} title={t(p.label)}>
            <div className="rounded-full transition-all duration-200" style={{width:isActive?14:10,height:isActive?14:10,marginTop:isActive?0:2,backgroundColor:isCurrentOrPast?c:"#334155",border:isActive?"2px solid white":isPast?`2px solid ${c}`:"2px solid #475569",boxShadow:isActive?`0 0 8px ${c}`:"none"}}/>
            <span className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap transition-all duration-200 ${isActive?"text-white font-medium opacity-100":isPast?"text-slate-400 opacity-80":"text-slate-600 opacity-0 group-hover:opacity-60"}`}>{t(p.label)}</span>
          </button>;
        })}
        {/* Playhead */}
        <div className="absolute top-[-2px] -translate-x-1/2 z-10" style={{left:`${progress}%`}}>
          <div className="w-0.5 h-5 bg-sky-400 rounded-full shadow-sm shadow-sky-500/30"/>
          <div onMouseDown={(e)=>{e.stopPropagation();e.preventDefault();dragging.current=true;const m=(ev:MouseEvent)=>{if(dragging.current)jumpToTime(getTime(ev.clientX));};const u=()=>{dragging.current=false;document.removeEventListener("mousemove",m);document.removeEventListener("mouseup",u);};document.addEventListener("mousemove",m);document.addEventListener("mouseup",u);}} className="w-3.5 h-3.5 bg-sky-400 rounded-full cursor-grab active:cursor-grabbing -ml-[5px] shadow-md shadow-sky-900/50 border border-sky-200"/>
        </div>
        {/* Ticks */}
        {ticks.map((tick) => {
          const l = (tick/totalDuration)*100, isMajor = tick%1===0;
          return <div key={`t${tick}`} className="absolute pointer-events-none" style={{left:`${l}%`,bottom:0}}>
            <div className={`-translate-x-1/2 ${isMajor?"h-2 w-px bg-slate-600":"h-1 w-px bg-slate-700"}`}/>
            {isMajor && <span className="absolute top-0.5 -translate-x-1/2 text-[8px] text-slate-600 tabular-nums">{tick}s</span>}
          </div>;
        })}
      </div>
    
      {/* Keyboard hints */}
      <div className="h-1 text-[8px] text-slate-600 text-center">{t("ui.shortcuts")}</div>
    </div>
  );
}
