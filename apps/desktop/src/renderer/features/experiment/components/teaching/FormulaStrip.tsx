import { FormulaDisplay } from "../../../../components/teaching/FormulaDisplay";
import type { FormulaStripData } from "./teaching-layer-data";
import { formatNumber } from "./teaching-layer-data";

/**
 * FormulaStrip template — formula -> substituted values -> highlighted result,
 * synced to phase progress. Auto-hidden by the data layer when the phase
 * has no equation (no empty shell).
 */
export function FormulaStripView({ data }: { data: FormulaStripData }) {
  const expression = data.stage === "formula" ? data.expression : data.substituted;
  const showResult = data.stage === "result" && data.result !== null;

  return (
    <div className="absolute bottom-[76px] left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(560px,70vw)]">
      <div
        key={data.stage + ":" + data.equationId}
        className="overlay-fade-in rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/40 px-5 py-2.5 shadow-2xl flex items-baseline gap-3 justify-center"
      >
        <FormulaDisplay formula={expression} className="text-sm whitespace-nowrap" />
        {showResult && (
          <span
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: "var(--color-accent-action, #FF6B00)" }}
          >
            = {formatNumber(data.result as number)}
          </span>
        )}
      </div>
    </div>
  );
}

