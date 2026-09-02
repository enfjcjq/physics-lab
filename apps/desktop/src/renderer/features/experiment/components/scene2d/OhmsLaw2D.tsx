import { useSimulation } from "../../experiment.store";
import { COLORS } from "./primitives";

// S88-B2: Ohms law is a static circuit diagram (no mechanical trajectory).
// All values are read from the scene simulation params -> deterministic f(t).
export function OhmsLaw2D() {
  const scene = useSimulation((s) => s.scene);
  const params = (scene as any)?.simulation?.params ?? {};
  const V = Number(params.V ?? 12);
  const R = Number(params.R ?? 4);
  const I = V / R;

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A" }}>
      <svg width="100%" height="100%" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet">
        {/* wire loop */}
        <rect x={460} y={190} width={280} height={220} rx={8} fill="none" stroke={COLORS.secondary} strokeWidth={2.5} />
        {/* battery (left) */}
        <g transform="translate(460,300)">
          <line x1={-46} y1={0} x2={-18} y2={0} stroke={COLORS.secondary} strokeWidth={2.5} />
          <line x1={-18} y1={0} x2={-18} y2={-14} stroke={COLORS.emphasis} strokeWidth={3} />
          <line x1={-18} y1={0} x2={-18} y2={14} stroke={COLORS.emphasis} strokeWidth={3} />
          <line x1={-18} y1={-14} x2={-12} y2={-14} stroke={COLORS.emphasis} strokeWidth={3} />
          <line x1={-18} y1={14} x2={-12} y2={14} stroke={COLORS.emphasis} strokeWidth={3} />
          <text x={-60} y={-20} fill={COLORS.emphasis} fontSize={14}>V</text>
        </g>
        {/* resistor (right) */}
        <g transform="translate(740,300)">
          <path d="M -30 0 L -24 -12 L -18 12 L -12 -12 L -6 12 L 0 -12 L 6 12 L 12 -12 L 18 12 L 24 0"
            fill="none" stroke={COLORS.secondary} strokeWidth={2.5} />
          <text x={-34} y={-20} fill={COLORS.emphasis} fontSize={14}>R</text>
        </g>
        {/* current arrows on two loop segments */}
        <line x1={600} y1={410} x2={630} y2={410} stroke={COLORS.velocity} strokeWidth={2.5} />
        <polygon points="630,410 622,405 622,415" fill={COLORS.velocity} />
        <line x1={570} y1={190} x2={600} y2={190} stroke={COLORS.velocity} strokeWidth={2.5} />
        <polygon points="600,190 592,185 592,195" fill={COLORS.velocity} />
        {/* labels */}
        <text x={600} y={160} fill={COLORS.velocity} fontSize={14} textAnchor="middle">I = {I.toFixed(2)} A</text>
        <text x={600} y={470} fill={COLORS.secondary} fontSize={13} textAnchor="middle">V = {V} V · R = {R} Ω</text>
      </svg>
    </div>
  );
}