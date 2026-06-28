import { MenuBar } from "./MenuBar";
import { pluginRegistry } from "../../core/plugin-registry";
import { useSimulation } from "../../features/experiment/experiment.store";
import { Timeline } from "../timeline/Timeline";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
import { LeftPanel } from "../panels/LeftPanel";
import { RightPanel } from "../panels/RightPanel";
import { CenterPanel } from "../panels/CenterPanel";
import { BottomDrawer } from "../panels/BottomDrawer";
import { TeacherPanel } from "../teaching/TeacherPanel";
import { WelcomeScreen } from "./WelcomeScreen";
import { LearningDashboard } from "../dashboard/LearningDashboard";
import { useDashboard } from "../../core/dashboard.store";
import { ToastContainer } from "./ToastContainer";
import { useAchievements } from "../../core/achievements.store";
import { useToasts } from "../../core/toast.store";
import { useEffect, useRef, useState } from "react";

const MODES = ["learning", "experiment", "analysis"] as const;

function ExperimentSwitcher() {
  const { t } = useI18n();
  const activePluginId = useSimulation((s) => s.activePluginId);
  const setActivePlugin = useSimulation((s) => s.setActivePlugin);
  const [open, setOpen] = useState(false);
  const plugins = pluginRegistry.list();
  const active = plugins.find(p => p.id === activePluginId);
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/60 transition-colors">
        <span>{active ? t(active.name) : "Experiment"}</span>
        <span className="text-[9px] text-slate-500">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {plugins.map(p => (
              <button key={p.id}
                onClick={() => { setActivePlugin(p.id); setOpen(false); }}
                className={"w-full text-left px-3 py-2 text-xs transition-colors " +
                  (p.id === activePluginId ? "bg-sky-600/20 text-sky-300" : "text-slate-400 hover:bg-slate-700/50 hover:text-white")}>
                {t(p.name)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell() {
  const panels = usePanelManager((s) => s.panels);
  const { mode, setMode } = useTeaching();
  const { t } = useI18n();
  const { open: showDashboard, toggle: toggleDashboard, closeDashboard } = useDashboard();
  const { badges } = useAchievements();
  const prevBadgeCount = useRef(0);

  // Toast when new achievement unlocks
  useEffect(function() {
    const unlocked = badges.filter(function(b) { return b.unlocked; });
    if (unlocked.length > prevBadgeCount.current && prevBadgeCount.current > 0) {
      const newest = unlocked[unlocked.length - 1];
      useToasts.getState().show({ title: newest.title, message: newest.description, icon: newest.icon });
    }
    prevBadgeCount.current = unlocked.length;
  }, [badges]);

  const leftOpen = panels.problem?.isOpen || panels.history?.isOpen || panels.parameters?.isOpen;
  const rightOpen = panels.analysis?.isOpen || panels.teaching?.isOpen || panels.properties?.isOpen;
  const bottomOpen = panels.timeline?.isOpen || panels.charts?.isOpen;

  const showLeftPanel = leftOpen || mode === "learning";
  const showTeacher = mode === "learning";
  const showRightPanel = (mode === "experiment" || mode === "analysis") && rightOpen;
  const showBottomDrawer = bottomOpen;

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: "var(--bg-root)" }}>
      <WelcomeScreen />
      <MenuBar />

      <div className="h-9 bg-slate-900/80 border-b border-slate-800 flex items-center px-4 gap-3 flex-shrink-0">
        <div className="flex bg-slate-800/40 rounded-lg p-0.5 gap-0.5">
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={"px-4 py-1 rounded-md text-xs font-medium transition-all duration-300 " +
                (mode === m ? "bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg shadow-sky-900/30 scale-105" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30")}>
              {t("mode." + m)}
            </button>
          ))}
        </div>
                <div className="w-px h-4 bg-slate-700/50 mx-1" />
        <ExperimentSwitcher />
        <div className="w-px h-4 bg-slate-700/50 mx-1" />
        <span className="text-[10px] text-slate-600 hidden sm:block">
          {mode === "learning" ? t("mode.learning_hint") : mode === "experiment" ? t("mode.experiment_hint") : t("mode.analysis_hint")}
        </span>
        <div className="flex-1" />
        <button onClick={toggleDashboard}
          className={"px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 " +
            (showDashboard ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
          {String.fromCodePoint(0x1F4CA)} {t("dashboard.title")}
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {showLeftPanel && (
          <div className="flex-shrink-0 border-r flex flex-col transition-all duration-500 ease-in-out"
            style={{ width: mode === "learning" ? 260 : 280, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <div className="animate-in fade-in slide-in-from-left duration-300">
              {panels.problem?.isOpen && <LeftPanel />}
            </div>
          </div>
        )}

        <CenterPanel />

        {showTeacher && (
          <div className="flex-shrink-0 border-l flex flex-col transition-all duration-500 ease-in-out"
            style={{ width: 320, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <TeacherPanel />
            </div>
          </div>
        )}

        {showRightPanel && (
          <div className="flex-shrink-0 border-l flex flex-col"
            style={{ width: 340, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            {panels.analysis?.isOpen && <RightPanel />}
          </div>
        )}
      </div>

      {showBottomDrawer && <BottomDrawer />}
      <Timeline />

      <ToastContainer />
      {showDashboard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDashboard}>
          <div className="w-[420px] max-h-[80vh] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ background: "var(--bg-primary)" }}
            onClick={(e) => e.stopPropagation()}>
            <LearningDashboard />
          </div>
        </div>
      )}
    </div>
  );
}