import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { useState } from "react";
import { generateCSV, downloadCSV, SAMPLE_RATE, calculateFrameEnergy } from "../../lib/csv";

export function DataPanel() {
  const currentTime = useSimulation(s => s.currentTime);
  const totalDuration = useSimulation(s => s.totalDuration);
  const ballX = useSimulation(s => s.ballX);
  const ballY = useSimulation(s => s.ballY);
  const ballVelocity = useSimulation(s => s.ballVelocity);
  const ballAcceleration = useSimulation(s => s.ballAcceleration);
  const mass = useSimulation(s => s.mass);
  const gravity = useSimulation(s => s.gravity);
  const frameCache = useSimulation(s => s.frameCache);
  const phases = useSimulation(s => s.phases);
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<"live" | "table">("live");

  const ke = 0.5 * mass * ballVelocity * ballVelocity;
  const pe = mass * gravity * Math.max(0, ballY);
  const totalE = ke + pe;

  /** 根据 phaseId 查找相位名称 */
  const getPhaseName = (phaseId: string): string => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.label ?? phaseId;
  };

  /** CSV 导出：统一调用 csv.ts 模块 */
  const exportCSV = () => {
    if (frameCache.length === 0) return;
    const csvContent = generateCSV({
      frames: frameCache,
      energyContext: { mass, gravity },
      sampleRate: SAMPLE_RATE,
      includeEnergy: true,
    });
    downloadCSV(csvContent, `physics-lab-data.csv`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.data")}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("live")}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${viewMode === "live" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            Live
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${viewMode === "table" ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            Table
          </button>
          <button
            onClick={exportCSV}
            className="px-2 py-0.5 rounded text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors"
          >
            CSV \u2193
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {viewMode === "live" ? (
          <div className="space-y-2">
            {/* Time */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">{t("timeline.current_time")}</span>
                <span className="text-sm font-mono text-sky-400">{currentTime.toFixed(3)} s</span>
              </div>
              <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all duration-75"
                  style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Position */}
            <DataRow label="X" value={ballX.toFixed(3)} unit="m" color="text-red-400" />
            <DataRow label="Y" value={ballY.toFixed(3)} unit="m" color="text-emerald-400" />

            {/* Motion */}
            <div className="border-t border-slate-800 pt-2 mt-2" />
            <DataRow label={t("teacher.velocity")} value={ballVelocity.toFixed(3)} unit="m/s" color="text-sky-400" highlight />
            <DataRow label={t("chart.acceleration")} value={ballAcceleration.toFixed(2)} unit="m/s\u00B2" color="text-amber-400" />

            {/* Energy */}
            <div className="border-t border-slate-800 pt-2 mt-2" />
            <DataRow label="KE" value={ke.toFixed(1)} unit="J" color="text-amber-400" />
            <DataRow label="PE" value={pe.toFixed(1)} unit="J" color="text-emerald-400" />
            <DataRow label={t("teacher.total_energy")} value={totalE.toFixed(1)} unit="J" color="text-violet-400" highlight />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-1.5 px-2 font-medium">t (s)</th>
                  <th className="text-right py-1.5 px-2 font-medium">y (m)</th>
                  <th className="text-right py-1.5 px-2 font-medium">v (m/s)</th>
                  <th className="text-right py-1.5 px-2 font-medium">a (m/s\u00B2)</th>
                  <th className="text-left py-1.5 px-2 font-medium">Phase</th>
                  <th className="text-right py-1.5 px-2 font-medium">KE (J)</th>
                  <th className="text-right py-1.5 px-2 font-medium">PE (J)</th>
                  <th className="text-right py-1.5 px-2 font-medium">TotalE (J)</th>
                </tr>
              </thead>
              <tbody>
                {frameCache.filter((_, i) => i % SAMPLE_RATE === 0).slice(0, 50).map((f, i) => {
                  const e = calculateFrameEnergy(f, { mass, gravity });
                  return (
                    <tr key={i} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${Math.abs(f.time - currentTime) < 0.05 ? "bg-sky-900/20" : ""}`}>
                      <td className="py-1 px-2 font-mono text-slate-400">{f.time.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-right text-emerald-400">{f.ballY.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-right text-sky-400">{f.ballVelocity.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-right text-amber-400">{f.ballAcceleration.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-slate-500">{getPhaseName(f.phaseId)}</td>
                      <td className="py-1 px-2 font-mono text-right text-amber-400">{e.ke.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-right text-emerald-400">{e.pe.toFixed(2)}</td>
                      <td className="py-1 px-2 font-mono text-right text-violet-400">{e.totalE.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {frameCache.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-600">{t("ui.no_data")}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DataRow({ label, value, unit, color, highlight }: { label: string; value: string; unit: string; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 flex items-center justify-between ${highlight ? "bg-slate-800/60 border border-slate-700/40" : ""}`}>
      <span className="text-[10px] text-slate-500">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-mono tabular-nums ${color}`}>{value}</span>
        <span className="text-[9px] text-slate-600">{unit}</span>
      </div>
    </div>
  );
}
