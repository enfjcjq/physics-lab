import { useSimulation } from "../../features/experiment/experiment.store";

export function TitleBar() {
  const currentPhase = useSimulation((s) => s.currentPhase);
  const playing = useSimulation((s) => s.playing);

  const phaseLabels: Record<string, string> = {
    release: "Release",
    falling: "Falling",
    impact: "Impact",
    bounce: "Bounce",
  };

  return (
    <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 select-none flex-shrink-0"
         style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
          P
        </div>
        <span className="text-sm font-semibold text-white tracking-wide">Physics Lab</span>
        <span className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded">V0.2</span>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${playing ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
          <span className="text-slate-400">{phaseLabels[currentPhase]}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span>AI Ready</span>
      </div>
    </div>
  );
}
