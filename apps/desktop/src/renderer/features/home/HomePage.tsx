import { useEffect, useRef, useState } from "react";
import { useHome } from "./home.store";
import { useProblemStore } from "../../stores/problem.store";
import { useAIProviderStore } from "../../stores/ai-provider.store";
import { useUsage } from "../../core/usage.store";
import { useSimulation } from "../experiment/experiment.store";
import { useI18n } from "../../core/i18n";
import { OcrPanel } from "../problem-input/OcrPanel";
import { extractProblemTextFromPdf } from "../../lib/pdf";

/** Built-in example problems (click to fill the input). */
const EXAMPLES = [
  { id: "free-fall", titleKey: "home.example.free_fall", text: "一个小球从10米高处由静止自由下落，g取9.8m/s²，求落地速度。" },
  { id: "projectile", titleKey: "home.example.projectile", text: "小球以20m/s的初速度水平抛出，g=10m/s²，求落地时间。" },
  { id: "ohms", titleKey: "home.example.ohms", text: "一个电阻的阻值为6欧姆，两端电压为12V，求通过电阻的电流。" },
  { id: "faraday", titleKey: "home.example.faraday", text: "一个100匝的线圈放在变化的磁场中，求感应电动势。" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Collapse({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-800/60 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-1 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>{title}</span>
        <span className="text-[10px] text-slate-600 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && <div className="pb-3 animate-in fade-in duration-200">{children}</div>}
    </div>
  );
}

export function HomePage() {
  const { t } = useI18n();
  const inputText = useProblemStore((s) => s.inputText);
  const setInputText = useProblemStore((s) => s.setInputText);
  const setInputMethod = useProblemStore((s) => s.setInputMethod);
  const isSubmitting = useProblemStore((s) => s.isSubmitting);
  const parseError = useProblemStore((s) => s.parseError);
  const history = useProblemStore((s) => s.history);
  const submit = useProblemStore((s) => s.submit);
  const ollamaAvailable = useAIProviderStore((s) => s.ollamaAvailable);
  const cloudAvailable = useAIProviderStore((s) => s.cloudAvailable);

  const [progressStep, setProgressStep] = useState(0);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the primary input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const enterScene = () => {
    useUsage.getState().incrementCorePath(); // S77 telemetry: home -> teaching animation
    useHome.getState().setView("scene");
    setTimeout(() => useSimulation.getState().play(), 320); // after 300ms fade-in
  };

  const fallbackToScene = async () => {
    await useSimulation.getState().setActivePlugin("free-fall");
    useHome.getState().setView("scene");
    setTimeout(() => useSimulation.getState().play(), 320);
  };

  const submitProblem = async (textOverride?: string) => {
    const text = textOverride ?? inputText;
    if (!text.trim() || isSubmitting) return;
    setInputText(text);
    // Staged parsing progress (P0 spec 1.3): 实体 -> 模型 -> 编排动画
    const steps = (async () => {
      setProgressStep(1); await wait(420);
      setProgressStep(2); await wait(420);
      setProgressStep(3); await wait(420);
      setProgressStep(0);
    })();
    const scene = await submit();
    if (scene) enterScene();
    await steps.catch(() => {});
  };

  const runExample = (text: string) => {
    setInputText(text);
    textareaRef.current?.focus();
  };

  const runRecent = (text?: string) => {
    if (text) {
      setInputText(text);
      submitProblem(text);
    }
  };

  // S85: 3-state AI status (cloud online / local online / offline degraded)
  const aiStatus = cloudAvailable === "online" ? t("home.ai_cloud")
    : cloudAvailable === "checking" ? t("home.ai_checking")
    : ollamaAvailable === true ? t("home.ai_local")
    : t("home.ai_offline");
  const aiDot = cloudAvailable === "online" ? "#22c55e"
    : cloudAvailable === "checking" ? "#94a3b8"
    : ollamaAvailable === true ? "#38bdf8"
    : "#ef4444";
  const recent = history.slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col items-center" style={{ background: "#0A0E1A" }}>
      {isSubmitting && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          {["α", "Ω", "Δ", "v₀", "F=ma", "θ", "E=mc²"].map((s, i) => (
            <span key={i} className="symbol-float absolute text-3xl text-slate-700/40 select-none"
              style={{ left: `${6 + i * 12}%`, top: `${18 + (i % 3) * 18}%`, animationDelay: `${i * 0.9}s` }}>{s}</span>
          ))}
        </div>
      )}
      {/* AI status (top-right, weak hint) */}
      <div className="absolute top-4 right-5 flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: aiDot }} />
        <span>{aiStatus}</span>
      </div>

      <div className="w-full max-w-[640px] px-6 pt-[18vh] flex flex-col items-center">
        {/* Product identity */}
        <div className="w-12 h-12 mb-4 rounded-2xl bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-sky-900/40">⚛</div>
        <h1 className="text-lg font-semibold text-slate-100 tracking-wide">Physics Lab</h1>
        <h2 className="mt-1 text-xl font-bold text-white text-center">{t("home.title")}</h2>
        <p className="mt-1.5 text-sm text-slate-400 text-center">{t("home.subtitle")}</p>
        <p className="mt-1 text-xs text-slate-500 text-center">{t("home.tagline")}</p>

        {/* Input area — the single visual focus */}
        <div className="w-full mt-8">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitProblem(); }}
            placeholder={t("home.input_placeholder")}
            rows={4}
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl bg-slate-900/80 border border-slate-700 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 outline-none px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 transition-all"
          />

          {/* Progress / actions row */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setOcrOpen(true)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-40"
            >
              📷 {t("home.ocr")}
            </button>
            <button
              onClick={() => { setPdfOpen(true); setPdfError(null); }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-40"
            >
              📄 {t("home.pdf")}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => submitProblem()}
              disabled={!inputText.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-accent-action, #FF6B00)", boxShadow: "0 8px 24px rgba(255,107,0,0.25)" }}
            >
              {t("home.cta")}
            </button>
          </div>

          {/* A2: numbered step progress while parsing */}
          {isSubmitting && (
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-600">0{n}</span>
                  <span className={progressStep >= n ? "text-slate-200" : "text-slate-500"}>
                    {n === 1 ? t("home.progress.step1") : n === 2 ? t("home.progress.step2") : t("home.progress.step3")}
                  </span>
                  {progressStep >= n && <span className="text-green-400">{"✓"}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Parse error with retry / fallback */}
          {parseError && !isSubmitting && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-red-400">{parseError}</span>
              <button onClick={() => submitProblem()} className="text-xs text-sky-400 hover:text-sky-300">{t("home.error.retry")}</button>
              <button onClick={fallbackToScene} className="text-xs text-slate-400 hover:text-slate-200">{t("home.error.fallback")}</button>
            </div>
          )}
        </div>

        {/* Collapsible sections */}
        <div className="w-full mt-8 border-t border-slate-800/60">
          <Collapse title={t("home.recent")}>
            {recent.length === 0 ? (
              <p className="text-xs text-slate-600 px-1">{t("home.recent_empty")}</p>
            ) : (
              <ul className="space-y-1">
                {recent.map((h) => (
                  <li key={h.id}>
                    <button onClick={() => runRecent(h.text)} className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors truncate">
                      {h.text || h.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Collapse>
          <Collapse title={t("home.examples")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex.id} onClick={() => runExample(ex.text)} className="text-left px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-colors">
                  {t(ex.titleKey)}
                </button>
              ))}
            </div>
          </Collapse>
          <Collapse title={t("home.lab")}>
            <button onClick={fallbackToScene} className="px-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              {t("home.experiment_hint")} →
            </button>
          </Collapse>
        </div>
      </div>

      {/* PDF modal (S76): extract text -> fill editable input -> user clicks CTA */}
      {pdfOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPdfOpen(false)}>
          <div className="w-[560px] max-w-[92vw] rounded-2xl border border-slate-700 shadow-2xl" style={{ background: "#0F172A" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-200">{t("home.pdf")}</span>
              <button onClick={() => setPdfOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <div className="p-6">
              {pdfParsing ? (
                <div className="text-center py-6 text-sm text-slate-400">{t("home.pdf_parsing")}</div>
              ) : (
                <>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-xl py-10 cursor-pointer hover:border-sky-600 hover:text-sky-400 transition-colors text-slate-400 text-sm">
                    <span className="text-3xl">📄</span>
                    <span>{t("home.pdf_pick")}</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setPdfParsing(true);
                        setPdfError(null);
                        try {
                          const text = await extractProblemTextFromPdf(file);
                          if (text) {
                            setInputText(text);
                            setInputMethod("pdf");
                            setPdfOpen(false);
                            textareaRef.current?.focus();
                          } else {
                            setPdfError(t("home.pdf_empty"));
                          }
                        } catch {
                          setPdfError(t("home.pdf_error"));
                        } finally {
                          setPdfParsing(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  {pdfError && <div className="mt-3 text-xs text-red-400">{pdfError}</div>}
                  <p className="mt-3 text-[11px] text-slate-600">{t("home.pdf_hint")}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* OCR modal (reuses the existing OCR flow) */}
      {ocrOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOcrOpen(false)}>
          <div className="w-[560px] max-w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl" style={{ background: "#0F172A" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-200">{t("home.ocr")}</span>
              <button onClick={() => setOcrOpen(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <div className="p-4">
              <OcrPanel
                onUseText={(text) => {
                  setInputText(text);
                  setInputMethod("ocr");
                  setOcrOpen(false);
                  textareaRef.current?.focus();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
