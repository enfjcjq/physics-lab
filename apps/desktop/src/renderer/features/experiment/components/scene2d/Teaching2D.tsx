import { useI18n } from "../../../../core/i18n";
import { getPhaseCardData, getFormulaStripData } from "../teaching/teaching-layer-data";
import { beautifyFormula } from "../teaching/formula-beautify";
import type { PhysicsScene } from "@physics-lab/shared";

// Shared 2D-native teaching overlays (PhaseCard + FormulaStrip).
export function Teaching2D({ scene, currentTime }: { scene: PhysicsScene | null; currentTime: number }) {
  const { t } = useI18n();
  const card = scene ? getPhaseCardData(scene, currentTime) : null;
  const strip = scene ? getFormulaStripData(scene, currentTime) : null;
  return (
    <g>
      {card && (
        <g transform="translate(54,54)">
          <rect x={0} y={0} width={230} height={52} rx={8} fill="#1E293B" fillOpacity={0.92} stroke="#334155" strokeWidth={1} />
          <text x={16} y={21} fill="#94A3B8" fontSize={12}>{card.index}/{card.total}</text>
          <text x={16} y={39} fill="#E2E8F0" fontSize={15} fontWeight={600}>{t(card.labelKey)}</text>
        </g>
      )}
      {strip && (
        <g transform="translate(600,624)">
          <rect x={-260} y={-30} width={520} height={38} rx={8} fill="#1E293B" fillOpacity={0.9} stroke="#334155" strokeWidth={1} />
          <text textAnchor="middle" y={-4} fill="#F59E0B" fontSize={17} fontFamily="monospace">
            {beautifyFormula(strip.stage === "formula" ? strip.expression : strip.substituted)}
          </text>
        </g>
      )}
    </g>
  );
}