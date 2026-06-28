import { useProblemStore } from "../../stores/problem.store";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import type { InputMethod } from "../../stores/ui.store";
import { CollapseHandle } from "../layout/CollapseHandle";
import { pluginRegistry } from "../../core/plugin-registry";
import { useCompare } from "../../core/compare.store";

const EXP_ICONS: Record<string, string> = {
  "free-fall": "\u2B07\uFE0F",
  "projectile-motion": "\u2197\uFE0F",
  "inclined-plane": "\u25B3",
  "collision": "\u25CF\u25CB",
  "spring-mass": "\u223C\uFE0F",
  "pendulum": "\u23F0",
  "buoyancy": "\uD83D\uDCA7",
  "circular-motion": "\uD83D\uDD04",
};

const EXP_META: Record<string, { desc: string; difficulty: string }> = {
  "free-fall": { desc: "\u521D\u901F\u5EA6\u4E3A\u96F6\u7684\u5300\u52A0\u901F\u8FD0\u52A8", difficulty: "easy" },
  "projectile-motion": { desc: "\u6C34\u5E73\u5300\u901F\u4E0E\u7AD6\u76F4\u5300\u52A0\u901F\u7684\u53E0\u52A0", difficulty: "medium" },
  "inclined-plane": { desc: "\u529B\u7684\u5206\u89E3\u4E0E\u6469\u64E6\u529B\u5206\u6790", difficulty: "medium" },
  "collision": { desc: "\u52A8\u91CF\u5B88\u6052\u4E0E\u80FD\u91CF\u8F6C\u5316", difficulty: "medium" },
  "spring-mass": { desc: "\u80E1\u514B\u5B9A\u5F8B\u4E0E\u7B80\u8C10\u632F\u52A8", difficulty: "medium" },
  "pendulum": { desc: "\u5355\u6446\u7684\u7B80\u8C10\u8FD0\u52A8", difficulty: "medium" },
};

export function LeftPanel() {
  const leftOpen = usePanelManager((s) => s.panels.problem?.isOpen ?? true);
  const toggleLeft = () => usePanelManager.getState().toggle("problem");
  const inputMethod = useProblemStore((s) => s.inputMethod);
  const setInputMethod = useProblemStore((s) => s.setInputMethod);
  const inputText = useProblemStore((s) => s.inputText);
  const setInputText = useProblemStore((s) => s.setInputText);
  const isSubmitting = useProblemStore((s) => s.isSubmitting);
  const parseError = useProblemStore((s) => s.parseError);
  const submit = useProblemStore((s) => s.submit);
  const history = useProblemStore((s) => s.history);
  const { mode } = useTeaching();
  const { t } = useI18n();

  const setScene = useSimulation((s) => s.setScene);
  const mass = useSimulation((s) => s.mass);
  const height = useSimulation((s) => s.height);
  const gravity = useSimulation((s) => s.gravity);
  const setMass = useSimulation((s) => s.setMass);
  const setHeight = useSimulation((s) => s.setHeight);
  const setGravity = useSimulation((s) => s.setGravity);
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const currentTime = useSimulation((s) => s.currentTime);
  const { enabled: compareEnabled, toggle: toggleCompare, varyParam, setVaryParam, computeGhosts, ghostTrails } = useCompare();
  const activePluginId = useSimulation((s) => s.activePluginId);
  const setActivePlugin = useSimulation((s) => s.setActivePlugin);

  const showFullInput = mode !== "learning";

  const handleSubmit = async () => {
    const scene = await submit();
    if (scene) setScene(scene);
  };

  return (
    <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${leftOpen?"w-[280px]":"w-0"}`}>
      <div className="w-[280px] h-full bg-slate-900/95 border-r border-slate-800 flex flex-col">
        <CollapseHandle side="left" open={leftOpen} onToggle={toggleLeft}/>

        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.problem")}</h2>
        </div>


        {/* Compare Mode */}
        <div className="px-3 pb-2">
          <button onClick={function() { toggleCompare(); if (!compareEnabled) { computeGhosts(activePluginId, { mass, height, gravity }); } }}
            className={"w-full py-1.5 rounded-lg text-xs font-medium transition-all " + (compareEnabled ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white")}>
            {compareEnabled ? t("compare.on", "Compare: ON") : t("compare.off", "Compare Mode")}
          </button>
          {compareEnabled && (
            <div className="mt-2 space-y-1.5">
              <select value={varyParam} onChange={function(e) { setVaryParam(e.target.value as "mass"|"height"|"gravity"); computeGhosts(activePluginId, { mass, height, gravity }); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-slate-300">
                <option value="mass">{t("param.mass")}</option>
                <option value="height">{t("param.height")}</option>
                <option value="gravity">{t("param.gravity")}</option>
              </select>
              {ghostTrails.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {ghostTrails.map(function(g, i) {
                    return (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: g.color + "20", color: g.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Experiment Selector - Improved card grid */}
        <div className="px-3 pb-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">{t("panel.experiments")}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {pluginRegistry.list().map((p) => {
              const isActive = p.id === activePluginId;
              const meta = EXP_META[p.id] || { desc: "", difficulty: "medium" };
              const icon = EXP_ICONS[p.id] || "\u26A1";
              return (
                <button
                  key={p.id}
                  onClick={async () => { if (p.id !== activePluginId) await setActivePlugin(p.id); }}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200 border-2 ${
                    isActive
                      ? "bg-sky-600/10 border-sky-500/40 text-sky-300 shadow-md shadow-sky-900/20 scale-[1.02]"
                      : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-500/60 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{icon}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      meta.difficulty === "easy" ? "bg-emerald-900/40 text-emerald-400" : "bg-amber-900/40 text-amber-400"
                    }`}>
                      {meta.difficulty === "easy" ? "\u7B80\u5355" : meta.difficulty === "medium" ? "\u4E2D\u7B49" : "\u56F0\u96BE"}
                    </span>
                  </div>
                  <div className="font-medium text-[11px] truncate">{t(p.name)}</div>
                  {meta.desc && <div className="text-[9px] mt-0.5 text-slate-500 leading-tight">{meta.desc}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input tabs */}
        {showFullInput && (
          <div className="px-4 pb-2">
            <div className="flex bg-slate-800/50 rounded-lg p-0.5">
              <button className="flex-1 py-1.5 text-xs rounded-md bg-sky-600 text-white shadow">{t("input.text")}</button>
              <button className="flex-1 py-1.5 text-xs rounded-md text-slate-500 cursor-not-allowed opacity-50">{t("input.ocr")}</button>
            </div>
          </div>
        )}

        <div className="px-4 flex-1 flex flex-col min-h-0">
          {inputMethod==="text" && (
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
              placeholder={t("input.placeholder")}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-sky-600 transition-colors min-h-[100px]"
              spellCheck={false}/>
          )}
          {showFullInput && (inputMethod!=="text") && (
            <div className="flex-1 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-sm cursor-pointer hover:border-sky-600 hover:text-sky-400 transition-colors min-h-[100px]">
              <div className="text-center"><div className="text-3xl mb-1">+</div><div>{t("ui.drop_hint")}</div></div>
            </div>
          )}
          {parseError && <div className="mt-2 text-[10px] text-red-400 px-1">{parseError}</div>}
        </div>

        <div className="px-4 py-3">
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-500 hover:to-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-900/20">
            {isSubmitting ? t("input.parsing") : t("input.submit")}
          </button>
        </div>

        {mode==="experiment" && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.parameters")}</h2>
            <SliderControl label={t("ctrl.height")} value={height} min={1} max={50} step={0.5} unit="m" onChange={(v)=>{setHeight(v);jumpToTime(currentTime);}}/>
            <SliderControl label={t("ctrl.gravity")} value={gravity} min={0.1} max={30} step={0.1} unit="m/s^2" onChange={(v)=>{setGravity(v);jumpToTime(currentTime);}}/>
            <SliderControl label={t("ctrl.mass")} value={mass} min={0.1} max={10} step={0.1} unit="kg" onChange={(v)=>{setMass(v);jumpToTime(currentTime);}}/>
          </div>
        )}

        <div className="border-t border-slate-800"/>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.history")}</h2>
            <span className="text-[10px] text-slate-600">{history.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {history.length===0 && <div className="px-3 py-6 text-center text-xs text-slate-600">{t("ui.no_history")}</div>}
            {history.map((item) => (
              <div key={item.id} className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors mb-1">
                <div className="text-sm text-slate-300 truncate">{item.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-600">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{item.inputMethod}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderControl({label,value,min,max,step,unit,onChange}:{label:string;value:number;min:number;max:number;step:number;unit:string;onChange:(v:number)=>void}){
  return <div className="space-y-1">
    <div className="flex items-center justify-between"><span className="text-[10px] text-slate-500">{label}</span><span className="text-[10px] font-mono text-sky-400">{value.toFixed(1)} {unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400"/>
  </div>;
}