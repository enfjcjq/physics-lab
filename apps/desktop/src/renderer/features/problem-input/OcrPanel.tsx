import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../core/i18n";
import { preprocessImage, recognizeProblemText, type OcrProgress } from "../../lib/ocr";

type Stage = "idle" | "preview" | "recognizing" | "done" | "error";

interface OcrPanelProps {
  /** Called when the student confirms the (possibly hand-corrected) text. */
  onUseText: (text: string) => void;
}

export function OcrPanel({ onUseText }: OcrPanelProps) {
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setStage("idle");
    setImageUrl(null);
    setImageBlob(null);
    setText("");
    setProgress({ status: "", progress: 0 });
  };

  const acceptImage = (blob: Blob) => {
    if (!blob.type.startsWith("image/")) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageBlob(blob);
    setImageUrl(URL.createObjectURL(blob));
    setStage("preview");
  };

  // Paste a screenshot directly (Ctrl+V) while in idle stage
  useEffect(() => {
    if (stage !== "idle") return;
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const blob = item?.getAsFile();
      if (blob) acceptImage(blob);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, imageUrl]);

  const recognize = async () => {
    if (!imageBlob) return;
    setStage("recognizing");
    try {
      const canvas = await preprocessImage(imageBlob);
      const result = await recognizeProblemText(canvas, setProgress);
      if (!result) { setStage("error"); return; }
      setText(result);
      setStage("done");
    } catch {
      setStage("error");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptImage(f); e.target.value = ""; }}
      />

      {stage === "idle" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) acceptImage(f); }}
          className="flex-1 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-500 text-sm cursor-pointer hover:border-sky-600 hover:text-sky-400 transition-colors min-h-[100px]"
        >
          <div className="text-center px-4">
            <div className="text-3xl mb-1">+</div>
            <div>{t("ocr.drop_hint")}</div>
            <div className="text-[10px] text-slate-600 mt-1">{t("ocr.paste_hint")}</div>
            <div className="text-[10px] text-slate-600 mt-1">{t("ocr.first_run_hint")}</div>
          </div>
        </div>
      )}

      {stage === "preview" && imageUrl && (
        <>
          <img src={imageUrl} alt="problem" className="max-h-40 rounded-lg border border-slate-700 object-contain bg-slate-800" />
          <div className="flex gap-2">
            <button onClick={recognize} className="flex-1 py-2 rounded-lg text-sm bg-sky-600 hover:bg-sky-500 text-white transition-colors">
              {t("ocr.start")}
            </button>
            <button onClick={reset} className="px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {t("ocr.reselect")}
            </button>
          </div>
        </>
      )}

      {stage === "recognizing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[100px]">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-200" style={{ width: `${Math.round(progress.progress * 100)}%` }} />
          </div>
          <div className="text-xs text-slate-400">{t("ocr.recognizing")} {progress.status} {Math.round(progress.progress * 100)}%</div>
        </div>
      )}

      {stage === "done" && (
        <>
          <div className="text-[10px] text-slate-500">{t("ocr.result_hint")}</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-sky-600 transition-colors min-h-[80px]"
          />
          <div className="flex gap-2">
            <button onClick={() => onUseText(text)} disabled={!text.trim()} className="flex-1 py-2 rounded-lg text-sm bg-gradient-to-r from-sky-600 to-violet-600 text-white disabled:opacity-50 transition-colors">
              {t("ocr.use_text")}
            </button>
            <button onClick={reset} className="px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {t("ocr.reselect")}
            </button>
          </div>
        </>
      )}

      {stage === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[100px]">
          <div className="text-xs text-red-400">{t("ocr.error")}</div>
          <button onClick={reset} className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:text-white transition-colors">
            {t("ocr.retry")}
          </button>
        </div>
      )}
    </div>
  );
}
