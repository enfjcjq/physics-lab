import { useProblemStore } from "../../stores/problem.store";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useSimulation } from "../../features/experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import type { InputMethod } from "../../stores/ui.store";
import { CollapseHandle } from "../layout/CollapseHandle";

const INPUT_TABS: { id: InputMethod; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "ocr", label: "OCR" },
  { id: "image", label: "Image" },
  { id: "pdf", label: "PDF" },
];

export function LeftPanel() {
  const leftOpen = usePanelManager((s) => s.panels.problem?.isOpen ?? true);
  const toggleLeft = () => usePanelManager.getState().toggle("problem");
  const inputMethod = useProblemStore((s) => s.inputMethod);
  const setInputMethod = useProblemStore((s) => s.setInputMethod);
  const inputText = useProblemStore((s) => s.inputText);
  const setInputText = useProblemStore((s) => s.setInputText);
  const isSubmitting = useProblemStore((s) => s.isSubmitting);
  const submit = useProblemStore((s) => s.submit);
  const history = useProblemStore((s) => s.history);
  const { mode } = useTeaching();
  const { t } = useI18n();

  // Simulation controls for experiment mode
  const mass = useSimulation((s) => s.mass);
  const height = useSimulation((s) => s.height);
  const gravity = useSimulation((s) => s.gravity);
  const setMass = useSimulation((s) => s.setMass);
  const setHeight = useSimulation((s) => s.setHeight);
  const setGravity = useSimulation((s) => s.setGravity);
  const jumpToTime = useSimulation((s) => s.jumpToTime);
  const currentTime = useSimulation((s) => s.currentTime);

  const showFullInput = mode !== "learning";

  return (
    <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
      ${leftOpen ? "w-[280px]" : "w-0"}`}>
      <div className="w-[280px] h-full bg-slate-900/95 border-r border-slate-800 flex flex-col">
        <CollapseHandle side="left" open={leftOpen} onToggle={toggleLeft} />

        {/* Problem Input Section */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("panel.problem")}
          </h2>
        </div>

        {showFullInput && (
          <div className="px-4 pb-2">
            <div className="flex bg-slate-800/50 rounded-lg p-0.5">
              {INPUT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInputMethod(tab.id)}
                  className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
                    inputMethod === tab.id
                      ? "bg-sky-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 flex-1 flex flex-col min-h-0">
          {inputMethod === "text" && (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t("input.placeholder")}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200
                placeholder-slate-500 resize-none focus:outline-none focus:border-sky-600
                transition-colors min-h-[100px]"
              spellCheck={false}
            />
          )}
          {showFullInput && (inputMethod === "ocr" || inputMethod === "image" || inputMethod === "pdf") && (
            <div
              className="flex-1 border-2 border-dashed border-slate-700 rounded-lg
              flex items-center justify-center text-slate-500 text-sm cursor-pointer
              hover:border-sky-600 hover:text-sky-400 transition-colors min-h-[100px]"
            >
              <div className="text-center">
                <div className="text-3xl mb-1">+</div>
                <div>Click or drop {inputMethod === "pdf" ? "PDF" : "image"} here</div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all
              bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-500 hover:to-violet-500
              text-white disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-sky-900/20"
          >
            {isSubmitting ? t("input.parsing") : t("input.submit")}
          </button>
        </div>

        {/* Live parameter controls - experiment mode */}
        {mode === "experiment" && (
          <div className="border-t border-slate-800 px-4 py-3 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("panel.parameters")}
            </h2>
            <SliderControl
              label={t("ctrl.height")}
              value={height}
              min={1}
              max={50}
              step={0.5}
              unit="m"
              onChange={(v) => { setHeight(v); jumpToTime(currentTime); }}
            />
            <SliderControl
              label={t("ctrl.gravity")}
              value={gravity}
              min={0.1}
              max={30}
              step={0.1}
              unit="m/s²"
              onChange={(v) => { setGravity(v); jumpToTime(currentTime); }}
            />
            <SliderControl
              label={t("ctrl.mass")}
              value={mass}
              min={0.1}
              max={10}
              step={0.1}
              unit="kg"
              onChange={(v) => { setMass(v); jumpToTime(currentTime); }}
            />
          </div>
        )}

        {/* History Section */}
        <div className="border-t border-slate-800" />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("panel.history")}
            </h2>
            <span className="text-[10px] text-slate-600">{history.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {history.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-slate-600">
                {t("ui.no_history")}
              </div>
            )}
            {history.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-colors mb-1"
              >
                <div className="text-sm text-slate-300 truncate">{item.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-600">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                    {item.inputMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className="text-[10px] font-mono text-sky-400">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
          accent-sky-500 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-400"
      />
    </div>
  );
}
