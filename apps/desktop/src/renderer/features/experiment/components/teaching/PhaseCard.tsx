import { useI18n } from "../../../../core/i18n";
import type { PhaseCardData } from "./teaching-layer-data";

/**
 * PhaseCard template — "what is happening at this stage".
 * Positioned by TeachingLayer (top-left below the experiment switcher).
 * Enter animation runs on remount (keyed by phase id); leaving fades out.
 */
export function PhaseCardView({ data, leaving }: { data: PhaseCardData; leaving?: boolean }) {
  const { t } = useI18n();
  const phaseOf = t("teaching.overlay.phase_of")
    .replace("{current}", String(data.index))
    .replace("{total}", String(data.total));

  return (
    <div
      className="absolute top-16 left-4 z-30 pointer-events-none transition-opacity duration-200"
      style={{ opacity: leaving ? 0 : 1 }}
    >
      <div
        className="phase-card-enter rounded-xl bg-slate-900/85 backdrop-blur-md px-4 py-3 shadow-2xl border border-slate-700/40 max-w-[300px]"
        style={{ borderLeft: "3px solid var(--color-accent-action, #FF6B00)" }}
      >
        <div className="text-[10px] text-slate-500 mb-1">{phaseOf}</div>
        <div className="text-sm text-slate-100/90 font-medium leading-snug">{t(data.labelKey)}</div>
        {data.hint && <div className="text-xs text-slate-400 mt-1 leading-relaxed">{data.hint}</div>}
      </div>
    </div>
  );
}
