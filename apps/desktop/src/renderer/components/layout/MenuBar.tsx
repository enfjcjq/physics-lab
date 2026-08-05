import { useState, useRef, useEffect } from "react";
import { usePanelManager } from "../../core/panel-manager.store";
import { useI18n } from "../../core/i18n";
import { useTheme } from "../../core/theme.store";
import { useTeaching } from "../../core/teaching.store";
import { useVisualization } from "../../core/visualization.store";
import { useDashboard } from "../../core/dashboard.store";
import { useUsage } from "../../core/usage.store";
import { useAIProviderStore } from "../../stores/ai-provider.store";
import type { Locale } from "../../core/i18n";
import type { ThemeMode } from "../../core/theme.store";
import type { TeachingSubMode } from "../../core/teaching.store";
import { generateCSV, downloadCSV } from "../../lib/csv";
import { useSimulation } from "../../features/experiment/experiment.store";
import { generateMarkdownReport, generateHTMLReport, downloadReport, downloadFile, downloadPDFReport } from "../../lib/report";

// ===== Dropdown Menu =====
function Dropdown({ label, children, align = "left" }: { label: string; children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 text-xs rounded transition-colors ${
          open ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
        }`}
      >
        {label}
      </button>
      {open && (
        <div className={"absolute top-full mt-1 w-56 max-w-[min(20rem,90vw)] max-h-[80vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 " + (align === "right" ? "right-0" : "left-0")}>
          {children}
        </div>
      )}
    </div>
        </>
  );
}

function MenuItem({
  label,
  shortcut,
  onClick,
  checked,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  checked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left"
    >
      <span className="w-4">{checked ? "✓" : checked === false ? "  " : ""}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-slate-500 ml-4">{shortcut}</span>}
    </button>
  );
}


function Submenu({ label, children, align = "left" }: { label: string; children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-left">
        <span className="w-4" />
        <span className="flex-1">{label}</span>
        <span className="text-slate-500 text-[10px]">▶</span>
      </button>
      {open && (
        <div className={"absolute top-0 ml-0.5 w-44 max-w-[min(16rem,80vw)] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 " + (align === "right" ? "right-full" : "left-full")}>
          {children}
        </div>
      )}
    </div>
  );
}
function MenuSeparator() {
  return <div className="border-t border-slate-700 my-1" />;
}

// ===== MenuBar =====
export function MenuBar() {
  const { t, locale, setLocale } = useI18n();
  const { activeId: activeAI, setActive: setActiveAI, checkOllama, ollamaAvailable } = useAIProviderStore();
  const { mode, setMode } = useTheme();
  const { mode: appMode, subMode: teachingMode, setSubMode: setTeachingMode, showPhaseCard, showFormulaStrip, showForceCallout, showEventPulse, teachingLayerEnabled, toggleTeachingElement, setTeachingLayerEnabled } = useTeaching();
  const panelMgr = usePanelManager();
  const viz = useVisualization();
  const [showAbout, setShowAbout] = useState(false);
  const sim = useSimulation();

  const handleExport = () => {
    const scene = sim.scene;
    if (!scene) return;
    const report = generateMarkdownReport({
      scene,
      params: { mass: sim.mass, height: sim.height, gravity: sim.gravity },
      currentTime: sim.currentTime,
      ballY: sim.ballY,
      ballVelocity: sim.ballVelocity,
    }, locale);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadReport(report, `physics-lab-report-${ts}.md`);
  };

  const panelItems = panelMgr.panelDefs.map((def) => ({
    id: def.id,
    label: t(def.titleKey),
    open: panelMgr.panels[def.id]?.isOpen ?? false,
  }));

  const MODE_LABELS: Record<TeachingSubMode, string> = {
    experiment: t("mode.experiment"),
    teaching: t("mode.teaching"),
    solving: t("mode.solving"),
    explore: t("mode.explore"),
  };

  return (
    <>
    <div
      className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-2 select-none flex-shrink-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* File */}
      <Dropdown label={t("menu.file")}>
        <MenuItem label={t("menu.file.new")} shortcut="Ctrl+N" />
        <MenuItem label={t("menu.file.open")} shortcut="Ctrl+O" />
        <MenuItem label={t("menu.file.save")} shortcut="Ctrl+S" />
        <MenuSeparator />
        <MenuItem label={t("menu.file.export") + " (MD)"} shortcut="Ctrl+E" onClick={handleExport} />
        <MenuItem label={t("menu.file.export") + " (HTML)"} shortcut="Ctrl+H" onClick={() => {
          const scene = sim.scene;
          if (!scene) return;
          const data = { scene, params: { mass: sim.mass, height: sim.height, gravity: sim.gravity }, currentTime: sim.currentTime, ballY: sim.ballY, ballVelocity: sim.ballVelocity };
          const html = generateHTMLReport(data, locale);
          const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
          downloadFile(html, `physics-lab-report-${ts}.html`, "text/html");
        }} />
        <MenuItem label={t("menu.file.export") + " (PDF)"} shortcut="Ctrl+P" onClick={async () => {
          const scene = sim.scene;
          if (!scene) return;
          const data = { scene, params: { mass: sim.mass, height: sim.height, gravity: sim.gravity }, currentTime: sim.currentTime, ballY: sim.ballY, ballVelocity: sim.ballVelocity };
          await downloadPDFReport(data, locale);
        }} />
        <MenuItem label={t("menu.file.export") + " (CSV)"} shortcut="Ctrl+D" onClick={() => {
          if (sim.frameCache.length === 0) return;
          const csvContent = generateCSV({ frames: sim.frameCache, energyContext: { mass: sim.mass, gravity: sim.gravity }, includeEnergy: true });
          downloadCSV(csvContent, "physics-lab-data.csv");
        }} />
        <MenuSeparator />
        <MenuItem label={t("menu.file.exit")} />
      </Dropdown>

      {/* Edit - hidden in learning mode */}
      {appMode !== "learning" && (
      <Dropdown label={t("menu.edit")}>
        <MenuItem label={t("menu.edit.undo")} shortcut="Ctrl+Z" />
        <MenuItem label={t("menu.edit.redo")} shortcut="Ctrl+Y" />
        <MenuSeparator />
        <MenuItem label={t("menu.edit.reset")} />
      </Dropdown>
      )}

      {/* View */}
      <Dropdown label={t("menu.view")}>
        {panelItems.map((p) => (
          <MenuItem key={p.id} label={p.label} checked={p.open} onClick={() => panelMgr.toggle(p.id)} />
        ))}
        <MenuSeparator />
        <MenuItem label={t("menu.view.coordinates")} checked={viz.toggles.showAxes} onClick={() => viz.toggle("showAxes")} />
        <MenuItem label={t("menu.view.forces")} checked={viz.toggles.showGravityArrow} onClick={() => viz.toggle("showGravityArrow")} />
        <MenuItem label={t("menu.view.grid")} checked={viz.toggles.showGrid} onClick={() => viz.toggle("showGrid")} />
        <MenuItem label={t("menu.view.trail")} checked={viz.toggles.showTrail} onClick={() => viz.toggle("showTrail")} />
        <MenuSeparator />
        <MenuItem label={t("menu.view.teaching_layer")} checked={teachingLayerEnabled} onClick={() => setTeachingLayerEnabled(!teachingLayerEnabled)} />
        <MenuItem label={t("menu.view.phase_card")} checked={showPhaseCard} onClick={() => toggleTeachingElement("phaseCard")} />
        <MenuItem label={t("menu.view.formula_strip")} checked={showFormulaStrip} onClick={() => toggleTeachingElement("formulaStrip")} />
        <MenuItem label={t("menu.view.force_callout")} checked={showForceCallout} onClick={() => toggleTeachingElement("forceCallout")} />
        <MenuItem label={t("menu.view.event_pulse")} checked={showEventPulse} onClick={() => toggleTeachingElement("eventPulse")} />
        <MenuSeparator />
        <MenuItem label={t("menu.view.dashboard")} shortcut="Ctrl+D" onClick={() => useDashboard.getState().toggle()} />
        <MenuSeparator />
        <MenuItem label={t("menu.view.reset_layout")} onClick={() => panelMgr.resetLayout()} />
      </Dropdown>

      {/* Experiment */}
      <Dropdown label={t("menu.experiment")}>
        <MenuItem label={t("ctrl.play")} shortcut="Space" />
        <MenuItem label={t("ctrl.pause")} shortcut="Space" />
        <MenuItem label={t("ctrl.stop")} />
        <MenuItem label={t("ctrl.replay")} shortcut="Ctrl+R" />
        <MenuSeparator />
        <MenuItem label={t("ctrl.prevFrame")} shortcut={"←"} />
        <MenuItem label={t("ctrl.nextFrame")} shortcut={"→"} />
        <MenuSeparator />
        <MenuItem label="0.25x" />
        <MenuItem label="0.5x" />
        <MenuItem label="1x" checked={true} />
        <MenuItem label="2x" />
        <MenuItem label="4x" />
      </Dropdown>

      {/* Teaching */}
      <Dropdown label={t("menu.teaching")}>
        <MenuItem label={t("teaching.mode.experiment")} checked={teachingMode === "experiment"} onClick={() => setTeachingMode("experiment")} />
        <MenuItem label={t("teaching.mode.teaching")} checked={teachingMode === "teaching"} onClick={() => setTeachingMode("teaching")} />
        <MenuItem label={t("teaching.mode.solving")} checked={teachingMode === "solving"} onClick={() => setTeachingMode("solving")} />
        <MenuItem label={t("teaching.mode.explore")} checked={teachingMode === "explore"} onClick={() => setTeachingMode("explore")} />
        <MenuSeparator />
        <MenuItem label={t("menu.teaching.knowledge")} checked={true} />
        <MenuItem label={t("menu.teaching.forces")} checked={true} />
        <MenuItem label={t("menu.teaching.motion")} checked={true} />
        <MenuItem label={t("menu.teaching.derivation")} checked={true} />
        <MenuItem label={t("menu.teaching.tips")} checked={true} />
        <MenuSeparator />
        <MenuItem label={t("menu.teaching.answer")} checked={true} />
      </Dropdown>

      {/* Spacer */}
      <div className="flex-1" />

      {/* AI Provider Toggle */}
      <button
        onClick={async () => {
          if (activeAI === "rule-based") { await checkOllama(); setActiveAI("ollama"); }
          else { setActiveAI("rule-based"); }
        }}
        className="px-2.5 py-1 text-xs font-medium rounded transition-colors border mr-2"
        style={{
          backgroundColor: activeAI === "ollama" ? "rgba(16,185,129,0.15)" : "rgba(56,189,248,0.15)",
          borderColor: activeAI === "ollama" ? "rgba(16,185,129,0.3)" : "rgba(56,189,248,0.3)",
          color: activeAI === "ollama" ? "#34d399" : "#38bdf8"
        }}
        title="Toggle AI provider"
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: activeAI === "ollama" ? (ollamaAvailable ? "#22c55e" : "#ef4444") : "#38bdf8" }} />
        {activeAI === "ollama" ? "Ollama" : "Rule"}
      </button>

      {/* Language Quick Toggle */}
      <button
        onClick={() => setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}
        className="px-2.5 py-1 text-xs font-medium rounded transition-colors bg-slate-800 text-sky-400 hover:bg-slate-700 hover:text-sky-300 border border-slate-700"
        title={t("menu.language")}
      >
        {locale === "zh-CN" ? "EN" : "中文"}
      </button>

      {/* Language (dropdown for discovery) */}
      <Dropdown label={t("menu.language")} align="right">
        <MenuItem label="English" checked={locale === "en-US"} onClick={() => setLocale("en-US")} />
        <MenuItem label={"中文"} checked={locale === "zh-CN"} onClick={() => setLocale("zh-CN")} />
      </Dropdown>

      {/* Theme */}
      <Dropdown label={t("menu.theme")} align="right">
        <MenuItem label={t("menu.theme.dark")} checked={mode === "dark"} onClick={() => setMode("dark")} />
        <MenuItem label={t("menu.theme.light")} checked={mode === "light"} onClick={() => setMode("light")} />
        <MenuItem label={t("menu.theme.auto")} checked={mode === "auto"} onClick={() => setMode("auto")} />
      </Dropdown>

      {/* Help */}
      <Dropdown label={t("menu.help")} align="right">
        <MenuItem label={t("about.title")} onClick={() => setShowAbout(true)} />
        <Submenu label={t("menu.help.developer")} align="right">
          <MenuItem label={t("menu.help.export_usage")} onClick={() => useUsage.getState().exportData()} />
        </Submenu>
        <MenuItem label="Documentation" />
        <MenuSeparator />
        <MenuItem label="Version 2.0.0" />
      </Dropdown>
    </div>
    {/* About Dialog */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAbout(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-2xl">\u269B</div>
              <h2 className="text-xl font-bold text-white">{t("about.title")}</h2>
              <p className="text-xs text-slate-500 mt-1">{t("about.version")} 2.0.0</p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{t("about.desc")}</p>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">{t("about.tech")}</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Electron","React","TypeScript","Three.js","Zustand","TailwindCSS","Vite"].map((tech) => (
                  <span key={tech} className="px-2 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400">{tech}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setShowAbout(false)} className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium">
              {t("about.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
