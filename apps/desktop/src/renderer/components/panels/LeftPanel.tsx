import { useProblemStore } from "../../stores/problem.store";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import type { InputMethod } from "../../stores/ui.store";
import { CollapseHandle } from "../layout/CollapseHandle";
import { pluginRegistry } from "../../core/plugin-registry";
import { useCompare } from "../../core/compare.store";
import { OcrPanel } from "../../features/problem-input/OcrPanel";

const EXP_ICONS: Record<string, string> = {
  "free-fall": "\u2B07\uFE0F",
  "projectile-motion": "\u2197\uFE0F",
  "inclined-plane": "\u25B3",
  "collision": "\u25CF\u25CB",
  "spring-mass": "\u223C\uFE0F",
  "pendulum": "\u23F0",
  "buoyancy": "\uD83D\uDCA7",
  "circular-motion": "\uD83D\uDD04",
  "ohms_law": "\u26A1",
  "transverse_wave": "\u223C\uFE0F",
"coulombs_law": "\u26A1",
  "refraction": "\uD83D\uDD0D",
  "doppler_effect": "\uD83C\uDFB5",
"faraday_law": "\uD83E\uDDF2",
  "electric_motor": "\u2699\uFE0F",
  "ideal_gas": "\uD83D\uDCA8",
  "lens_optics": "\uD83D\uDD0D",
  "ac_generator": "\uD83D\uDD0C",
};

const EXP_META: Record<string, { desc: string; difficulty: string }> = {
  "free-fall": { desc: "\u521D\u901F\u5EA6\u4E3A\u96F6\u7684\u5300\u52A0\u901F\u8FD0\u52A8", difficulty: "easy" },
  "projectile-motion": { desc: "\u6C34\u5E73\u5300\u901F\u4E0E\u7AD6\u76F4\u5300\u52A0\u901F\u7684\u53E0\u52A0", difficulty: "medium" },
  "inclined-plane": { desc: "\u529B\u7684\u5206\u89E3\u4E0E\u6469\u64E6\u529B\u5206\u6790", difficulty: "medium" },
  "collision": { desc: "\u52A8\u91CF\u5B88\u6052\u4E0E\u80FD\u91CF\u8F6C\u5316", difficulty: "medium" },
  "spring-mass": { desc: "\u80E1\u514B\u5B9A\u5F8B\u4E0E\u7B80\u8C10\u632F\u52A8", difficulty: "medium" },
  "pendulum": { desc: "\u5355\u6446\u7684\u7B80\u8C10\u8FD0\u52A8", difficulty: "medium" },
  "buoyancy": { desc: "\u963F\u57FA\u7C73\u5FB7\u539F\u7406\u4E0E\u6D6E\u529B\u5206\u6790", difficulty: "medium" },
  "circular-motion": { desc: "\u5300\u901F\u5706\u5468\u8FD0\u52A8\u4E0E\u5411\u5FC3\u529B", difficulty: "medium" },
  "ohms_law": { desc: "\u7535\u538B\u3001\u7535\u6D41\u4E0E\u7535\u963B\u7684\u5173\u7CFB", difficulty: "easy" },
  "transverse_wave": { desc: "\u6CE2\u7684\u4F20\u64AD\u4E0E\u632F\u52A8\u7279\u6027", difficulty: "medium" },
"coulombs_law": { desc: "\u5E93\u4ED1\u5B9A\u5F8B\u4E0E\u9759\u7535\u529B", difficulty: "medium" },
  "refraction": { desc: "\u5149\u7684\u6298\u5C04\u4E0E\u65AF\u6D85\u5C14\u5B9A\u5F8B", difficulty: "medium" },
  "doppler_effect": { desc: "\u591A\u666E\u52D2\u6548\u5E94\u4E0E\u9891\u7387\u53D8\u5316", difficulty: "medium" },
"faraday_law": { desc: "\u7535\u78C1\u611F\u5E94\u4E0E\u6CD5\u62C9\u7B2C\u5B9A\u5F8B", difficulty: "medium" },
  "electric_motor": { desc: "\u76F4\u6D41\u7535\u52A8\u673A\u539F\u7406", difficulty: "medium" },
  "ideal_gas": { desc: "\u7406\u60F3\u6C14\u4F53\u72B6\u6001\u65B9\u7A0B PV=nRT", difficulty: "medium" },
  "lens_optics": { desc: "\u51F8\u900F\u955C\u6210\u50CF\u4E0E\u900F\u955C\u516C\u5F0F", difficulty: "medium" },
  "ac_generator": { desc: "\u7535\u78C1\u611F\u5E94\u4EA7\u751F\u6B63\u5F26\u4EA4\u6D41\u7535", difficulty: "medium" },
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
                      {t("difficulty." + meta.difficulty)}
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
              <button
                onClick={() => setInputMethod("text")}
                className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${inputMethod === "text" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t("input.text")}
              </button>
              <button
                onClick={() => setInputMethod("ocr")}
                className={`flex-1 py-1.5 text-xs rounded-md transition-colors ${inputMethod === "ocr" ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t("input.ocr")}
              </button>
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
          {showFullInput && inputMethod === "ocr" && (
            <OcrPanel onUseText={(text) => { setInputText(text); handleSubmit(); }} />
          )}
          {showFullInput && (inputMethod === "image" || inputMethod === "pdf") && (
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
          <DynamicControls />
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

function DynamicControls() {
  const { t } = useI18n();
  const activePluginId = useSimulation((s) => s.activePluginId);
  const plugin = pluginRegistry.get(activePluginId);
  const controls = plugin?.getControls() ?? [];
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const currentTime = useSimulation((s) => s.currentTime);
  const setMass = useSimulation((s) => s.setMass);
  const setHeight = useSimulation((s) => s.setHeight);
  const setGravity = useSimulation((s) => s.setGravity);
  const rebuildCache = useSimulation((s) => s.rebuildCache);
  
  if (controls.length === 0) return null;
  
  // Map control IDs to simulation setters
  const setterMap: Record<string, (v: number) => void> = {
    mass: setMass, h0: setHeight, height: setHeight, g: setGravity, gravity: setGravity,
  };
  
  const getValue = (id: string): number => {
    const s = useSimulation.getState();
    if (id === "mass" || id === "m") return s.mass;
    if (id === "h0" || id === "height") return s.height;
    if (id === "g" || id === "gravity") return s.gravity;
    return Number(controls.find(c => c.id === id)?.defaultValue) || 1;
  };
  
  return (
    <div className="border-t border-slate-800 px-4 py-3 space-y-3">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("panel.parameters")}</h2>
      {controls.map((ctrl) => {
        const setter = setterMap[ctrl.id] ?? ((v: number) => { rebuildCache(); });
        const val = getValue(ctrl.id);
        return (
          <SliderControl key={ctrl.id}
            label={t(ctrl.label)}
            value={val}
            min={ctrl.min ?? 0}
            max={ctrl.max ?? 100}
            step={ctrl.step ?? 1}
            unit={ctrl.unit ?? ''}
            onChange={(v) => { setter(v); jumpToTime(currentTime); }}
          />
        );
      })}
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

