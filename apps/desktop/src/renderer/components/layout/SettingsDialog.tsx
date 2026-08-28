import { useState } from "react";
import { useI18n } from "../../core/i18n";
import { useAIProviderStore, type ProviderPreference } from "../../stores/ai-provider.store";

/** S85 settings dialog: Cloud AI config + provider preference (local storage). */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const cfg = useAIProviderStore((s) => s.cloudConfig);
  const status = useAIProviderStore((s) => s.cloudAvailable);
  const preference = useAIProviderStore((s) => s.preference);
  const setCloudConfig = useAIProviderStore((s) => s.setCloudConfig);
  const setPreference = useAIProviderStore((s) => s.setPreference);
  const [baseUrl, setBaseUrl] = useState(cfg.baseUrl);
  const [apiKey, setApiKey] = useState(cfg.apiKey);
  const [model, setModel] = useState(cfg.model);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setCloudConfig({ baseUrl, apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const statusText =
    status === "online" ? t("settings.cloud.status.online")
    : status === "offline" ? t("settings.cloud.status.offline")
    : t("settings.cloud.status.unconfigured");
  const statusColor = status === "online" ? "#22c55e" : status === "offline" ? "#ef4444" : "#94a3b8";

  const opts: { id: ProviderPreference; label: string }[] = [
    { id: "auto", label: t("settings.provider.auto") },
    { id: "cloud", label: t("settings.provider.cloud") },
    { id: "local", label: t("settings.provider.local") },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] max-w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl" style={{ background: "#0F172A" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <span className="text-sm font-medium text-slate-200">{"\u2699\uFE0F " + t("settings.title")}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t("settings.provider.title")}</h3>
            <div className="flex flex-col gap-2">
              {opts.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="radio" name="provider" checked={preference === o.id} onChange={() => setPreference(o.id)} className="accent-sky-500" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t("settings.cloud.title")}</h3>
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-slate-400">{statusText}</span>
            </div>
            <div className="space-y-3">
              <label className="block text-xs text-slate-500">{t("settings.cloud.baseUrl")}
                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500/60" />
              </label>
              <label className="block text-xs text-slate-500">{t("settings.cloud.apiKey")}
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="mt-1 w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500/60" />
              </label>
              <label className="block text-xs text-slate-500">{t("settings.cloud.model")}
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="deepseek-chat" className="mt-1 w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500/60" />
              </label>
              <p className="text-[11px] text-slate-600">{t("settings.cloud.hint")}</p>
              <button onClick={save} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "var(--color-accent-action, #FF6B00)" }}>
                {saved ? t("settings.cloud.saved") : t("settings.cloud.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
