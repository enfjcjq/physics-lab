import { MenuBar } from "./MenuBar";
import { pluginRegistry } from "../../core/plugin-registry";
import { useSimulation } from "../../features/experiment/experiment.store";
import { Timeline } from "../timeline/Timeline";
import { usePanelManager } from "../../core/panel-manager.store";
import { useTeaching } from "../../core/teaching.store";
import { useI18n } from "../../core/i18n";
import { useUsage } from "../../core/usage.store";
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

/**
 * P2 first step (S72): learning scene page default = canvas + Timeline +
 * TeacherPanel. Other panels open via the left edge icon rail (parameters /
 * charts / teacher steps / knowledge graph). The 3-mode switcher and the
 * top-bar experiment switcher are removed; original features stay reachable
 * (MenuBar keeps everything; experiment library lives in the canvas drawer).
 */
function IconRail() {
  const { t } = useI18n();
  const panels = usePanelManager((s) => s.panels);
  const toggle = usePanelManager((s) => s.toggle);
  const [hint, setHint] = useState(false);
  // One-time breathing highlight for the first 2 scene entries (discoverability, S80).
  useEffect(() => {
    const n = Number(localStorage.getItem("physics-lab:iconrail-hint") ?? "0");
    if (n < 2) {
      setHint(true);
      localStorage.setItem("physics-lab:iconrail-hint", String(n + 1));
      const timer = setTimeout(() => setHint(false), 6000);
      return () => clearTimeout(timer);
    }
  }, []);
  const items = [
    { id: "problem", icon: "⚙️", key: "rail.parameters" },
    { id: "charts", icon: "📊", key: "rail.charts" },
    { id: "teaching", icon: "📖", key: "rail.steps" },
    { id: "analysis", icon: "🔭", key: "rail.graph" },
  ] as const;
  return (
    <div className={"flex-shrink-0 w-16 border-r flex flex-col items-center py-2 gap-1.5 " + (hint ? "iconrail-hint" : "")}
      style={{ borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
      {items.map((it) => {
        const open = panels[it.id]?.isOpen ?? false;
        return (
          <button key={it.id} title={t(it.key)} onClick={() => { toggle(it.id); useUsage.getState().incrementIcon(it.id); }}
            className={"w-12 rounded-lg flex flex-col items-center justify-center gap-0.5 py-1.5 text-base transition-all duration-200 " +
              (open ? "bg-orange-600/15 text-orange-400 ring-1 ring-orange-500/40" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60")}>
            <span>{it.icon}</span>
            <span className="text-[10px] leading-none">{t(it.key)}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AppShell() {
  const panels = usePanelManager((s) => s.panels);
  const { t } = useI18n();
  const { open: showDashboard, closeDashboard } = useDashboard();
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

  const showLeft = panels.problem?.isOpen ?? false;
  const showTeacher = panels.teaching?.isOpen ?? false;
  const showRight = panels.analysis?.isOpen ?? false;
  const showBottom = panels.charts?.isOpen ?? false;

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: "var(--bg-root)" }}>
      <WelcomeScreen />
      <MenuBar />

      <div className="flex-1 flex min-h-0">
        <IconRail />

        {showLeft && (
          <div className="flex-shrink-0 border-r flex flex-col transition-all duration-500 ease-in-out"
            style={{ width: 280, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <div className="animate-in fade-in slide-in-from-left duration-300">
              <LeftPanel />
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

        {showRight && (
          <div className="flex-shrink-0 border-l flex flex-col"
            style={{ width: 340, borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}>
            <RightPanel />
          </div>
        )}
      </div>

      {showBottom && <BottomDrawer />}
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
