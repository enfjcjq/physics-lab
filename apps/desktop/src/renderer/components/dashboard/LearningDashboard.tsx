import { useSimulation } from "../../features/experiment/experiment.store";
import { useMastery } from "../../core/mastery.store";
import { useI18n } from "../../core/i18n";
import { pluginRegistry } from "../../core/plugin-registry";
import { useAchievements } from "../../core/achievements.store";
import { useWrongAnswers } from "../../core/wrong-answer.store";
import { useResume } from "../../core/resume.store";
import { generateLearningSummary, formatSummaryMarkdown } from "../../core/learning-summary";
import { downloadFile } from "../../lib/report";
import { useState, useMemo, useEffect } from "react";

function RadarChart({ data }: { data: Array<{ label: string; value: number; max: number }> }) {
  const size = 140; const cx = size / 2; const cy = size / 2; const r = 55;
  const levels = 4; const angleSlice = (2 * Math.PI) / data.length;
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} className="mx-auto">
      {Array.from({ length: levels }, (_, level) => {
        const lr = (r / levels) * (level + 1);
        const pts = data.map((_, i) => {
          const a = angleSlice * i - Math.PI / 2;
          return (cx + lr * Math.cos(a)).toFixed(1) + "," + (cy + lr * Math.sin(a)).toFixed(1);
        }).join(" ");
        return <polygon key={level} points={pts} fill="none" stroke="#334155" strokeWidth={0.5} />;
      })}
      {data.map((_, i) => {
        const a = angleSlice * i - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#334155" strokeWidth={0.5} />;
      })}
      <polygon
        points={data.map((d, i) => {
          const a = angleSlice * i - Math.PI / 2;
          const val = (d.value / d.max) * r;
          return (cx + val * Math.cos(a)).toFixed(1) + "," + (cy + val * Math.sin(a)).toFixed(1);
        }).join(" ")}
        fill="#0ea5e9" fillOpacity={0.2} stroke="#0ea5e9" strokeWidth={1.5}
      />
      {data.map((d, i) => {
        const a = angleSlice * i - Math.PI / 2;
        const val = (d.value / d.max) * r;
        return <circle key={i} cx={cx + val * Math.cos(a)} cy={cy + val * Math.sin(a)} r={3} fill="#0ea5e9" />;
      })}
      {data.map((d, i) => {
        const a = angleSlice * i - Math.PI / 2;
        const lr = r + 16;
        return (
          <text key={i} x={cx + lr * Math.cos(a)} y={cy + lr * Math.sin(a)}
            textAnchor="middle" dominantBaseline="middle"
            fill="#94a3b8" fontSize={9} fontFamily="system-ui, sans-serif">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function ProgressRing({ percent, size = 100, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0ea5e9" strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className="absolute text-xl font-bold text-white">{percent}%</span>
    </div>
  );
}


function StreakCalendar() {
  const { entries } = useMastery();
  const days = (function() {
    const result = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const hasActivity = Object.values(entries).some(function(e) {
        return e.lastAttempted && new Date(e.lastAttempted).toDateString() === ds;
      });
      result.push({ date: d, active: hasActivity });
    }
    return result;
  })();
  
  const streak = (function() {
    let s = 0;
    const now = new Date().toDateString();
    for (let i = 0; i < days.length; i++) {
      const d = days[days.length - 1 - i];
      if (d.active) s++;
      else if (d.date.toDateString() !== now) break;
    }
    return s;
  })();

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{String.fromCodePoint(0x1F525)}</span>
        <span className="text-lg font-bold text-white">{streak}</span>
        <span className="text-xs text-slate-400">day streak</span>
      </div>
      <div className="flex gap-1">
        {weeks.map(function(week, wi) {
          return (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(function(d, di) {
                const title = d.date.toLocaleDateString();
                return (
                  <div key={di} title={title}
                    className={"w-3 h-3 rounded-sm transition-colors " + (d.active ? "bg-emerald-500" : "bg-slate-800")} />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LearningDashboard() {
  const { t } = useI18n();
  const { entries, getOverallPercent, getRecentActivity } = useMastery();
  const { badges: achievements, check: checkAchievements } = useAchievements();
  const { items: wrongAnswers, markReviewed, remove: removeWrong } = useWrongAnswers();
  const resumeState = useResume((s) => s.state);

  useEffect(function() { checkAchievements(); }, [entries]);
  const plugins = useMemo(() => pluginRegistry.list(), []);
  const [selectedTab, setSelectedTab] = useState<"overview" | "experiments" | "activity">("overview");

  const overallPercent = getOverallPercent();
  const recentActivity = getRecentActivity(10);

  const pluginStats = useMemo(() => plugins.map((p) => {
    const kps = p.getKnowledgePoints();
    const kpIds = kps.map((k) => k.id);
    const mastered = kpIds.filter((id) => entries[id]?.mastered).length;
    return {
      id: p.id, name: p.name, category: p.category, difficulty: p.difficulty,
      total: kpIds.length || 1, mastered,
      percent: kpIds.length > 0 ? Math.round((mastered / kpIds.length) * 100) : 0,
    };
  }), [plugins, entries]);

  const radarData = useMemo(() => {
    const cats = new Map<string, { total: number; mastered: number }>();
    plugins.forEach((p) => {
      const kps = p.getKnowledgePoints();
      const cat = p.category;
      if (!cats.has(cat)) cats.set(cat, { total: 0, mastered: 0 });
      const c = cats.get(cat)!;
      kps.forEach((kp) => { c.total++; if (entries[kp.id]?.mastered) c.mastered++; });
    });
    return Array.from(cats.entries()).map(([label, v]) => ({
      label: t("category." + label, { defaultValue: label }),
      value: v.total > 0 ? Math.round((v.mastered / v.total) * 100) : 0, max: 100,
    }));
  }, [plugins, entries, t]);

  const recommendation = useMemo(() => {
    const incomplete = pluginStats.filter((s) => s.percent < 100);
    if (incomplete.length === 0) return pluginStats[0];
    incomplete.sort((a, b) => {
      if (a.percent !== b.percent) return a.percent - b.percent;
      const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
      return (diffOrder[a.difficulty] ?? 1) - (diffOrder[b.difficulty] ?? 1);
    });
    return incomplete[0];
  }, [pluginStats]);

  const jumpToExperiment = (pluginId: string) => {
    const store = useSimulation.getState();
    store.setActivePlugin(pluginId);
    store.stop();
    store.play();
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-5 py-3">
        <h2 className="text-base font-semibold text-white">{t("dashboard.title", { defaultValue: "Learning Dashboard" })}</h2>
        <button onClick={function() {
          const summary = generateLearningSummary("zh-CN");
          const md = formatSummaryMarkdown(summary, "zh-CN");
          const blob = new Blob([md], { type: "text/markdown" });
          downloadFile(blob, "physics-lab-summary-" + new Date().toISOString().slice(0,10) + ".md");
        }} className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          {t("dashboard.export_summary", { defaultValue: "Export" })}
        </button>
      </div>
      <div className="flex gap-1 px-5 pt-3 pb-2">
        {(["overview", "experiments", "activity", "achievements", "review"] as const).map((tab) => (
          <button key={tab} onClick={() => setSelectedTab(tab)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " +
              (selectedTab === tab ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800")}>
            {t("dashboard.tab." + tab, { defaultValue: tab })}
          </button>
        ))}
      </div>
      <div className="px-5 pb-6 space-y-4">
        {selectedTab === "overview" && (
          {/* Streak Calendar */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                {t("dashboard.streak", { defaultValue: "Learning Streak" })}
              </h3>
              <StreakCalendar />
            </div>

          <>
            <div className="flex flex-col items-center py-4">
              <ProgressRing percent={overallPercent} size={120} strokeWidth={8} />
              <p className="text-xs text-slate-400 mt-3">{t("dashboard.overall_progress", { defaultValue: "Overall Mastery" })}</p>
            </div>
            {radarData.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                  {t("dashboard.knowledge_areas", { defaultValue: "Knowledge Areas" })}
                </h3>
                <RadarChart data={radarData} />
              </div>
            )}
            {recommendation && (
              <div className="bg-gradient-to-br from-sky-950/50 to-violet-950/50 border border-sky-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{String.fromCodePoint(0x1F3AF)}</span>
                  <h3 className="text-xs font-medium text-sky-400 uppercase tracking-wider">
                    {t("dashboard.recommended", { defaultValue: "Recommended Next" })}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{recommendation.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {recommendation.mastered}/{recommendation.total} {t("dashboard.kps_mastered", { defaultValue: "mastered" })}
                    </p>
                  </div>
                  <button onClick={() => jumpToExperiment(recommendation.id)}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors">
                    {t("dashboard.start", { defaultValue: "Start" })}
                  </button>
                </div>
                <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: recommendation.percent + "%" }} />
                </div>
              </div>
            )}
          </>
        )}
        {selectedTab === "experiments" && (
          <div className="space-y-2">
            {pluginStats.map((stat) => (
              <div key={stat.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => jumpToExperiment(stat.id)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-white">{stat.name}</span>
                    <span className={"ml-2 text-[10px] px-1.5 py-0.5 rounded " +
                      (stat.difficulty === "easy" ? "bg-emerald-900/50 text-emerald-400" :
                       stat.difficulty === "medium" ? "bg-amber-900/50 text-amber-400" :
                       "bg-red-900/50 text-red-400")}>{stat.difficulty}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{stat.percent}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: stat.percent + "%" }} />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  {stat.mastered}/{stat.total} {t("dashboard.kps_mastered", { defaultValue: "mastered" })}
                </p>
              </div>
            ))}
          </div>
        )}
        {selectedTab === "review" && (
          <div className="space-y-2">
            {wrongAnswers.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl">{String.fromCodePoint(0x1F389)}</span>
                <p className="text-sm text-slate-400 mt-2">{t("review.empty", { defaultValue: "No wrong answers! Great job!" })}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">
                    {wrongAnswers.filter(function(w) { return !w.reviewed; }).length} {t("review.unreviewed", { defaultValue: "unreviewed" })}
                  </span>
                  <button onClick={function() { useWrongAnswers.getState().clearAll(); }}
                    className="text-[10px] text-slate-600 hover:text-red-400 transition-colors">
                    {t("review.clear", { defaultValue: "Clear all" })}
                  </button>
                </div>
                {wrongAnswers.map(function(w) {
                  return (
                    <div key={w.id} className={"bg-slate-900/50 border rounded-xl p-3 transition-all " + (w.reviewed ? "border-slate-800 opacity-60" : "border-amber-800/40")}>
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] text-slate-500">{w.pluginId} · {new Date(w.timestamp).toLocaleDateString()}</span>
                        <div className="flex gap-1">
                          {!w.reviewed && (
                            <button onClick={function() { markReviewed(w.id); }}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50">
                              {t("review.got_it", { defaultValue: "Got it" })}
                            </button>
                          )}
                          <button onClick={function() { removeWrong(w.id); }}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 hover:text-slate-300">
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">{t(w.questionKey, { defaultValue: w.questionKey })}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px]">
                        <span className="text-red-400">{t("review.your_answer", { defaultValue: "Yours" })}: {String.fromCharCode(65 + w.userAnswer)}</span>
                        <span className="text-emerald-400">{t("review.correct", { defaultValue: "Correct" })}: {String.fromCharCode(65 + w.correctAnswer)}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
        {selectedTab === "achievements" && (
          <div className="space-y-2">
            {achievements.filter(function(a) { return a.unlocked; }).length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-6">
                {t("achievements.none_yet", { defaultValue: "Complete quizzes to earn badges!" })}
              </p>
            ) : null}
            {achievements.map(function(a) {
              return (
                <div key={a.id} className={"bg-slate-900/50 border rounded-xl p-3 flex items-center gap-3 transition-all " + (a.unlocked ? "border-emerald-800/50" : "border-slate-800 opacity-40")}>
                  <span className="text-2xl">{a.unlocked ? a.icon : "🔒"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={"text-xs font-medium " + (a.unlocked ? "text-white" : "text-slate-600")}>{a.title}</p>
                    <p className="text-[10px] text-slate-500">{a.description}</p>
                  </div>
                  {a.unlocked && a.unlockedAt && (
                    <span className="text-[9px] text-emerald-500">{new Date(a.unlockedAt).toLocaleDateString()}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {selectedTab === "activity" && (
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-6">
                {t("dashboard.no_activity", { defaultValue: "No activity yet. Start learning!" })}
              </p>
            ) : (
              recentActivity.map(({ kpId, entry }) => (
                <div key={kpId} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className={"w-2 h-2 rounded-full " + (entry.mastered ? "bg-emerald-400" : "bg-amber-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{kpId}</p>
                    <p className="text-[10px] text-slate-500">
                      {entry.lastAttempted ? new Date(entry.lastAttempted).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{entry.score}%</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
