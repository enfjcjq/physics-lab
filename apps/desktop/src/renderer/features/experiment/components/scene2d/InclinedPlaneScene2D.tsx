import { useMemo } from "react";
import { useSimulation } from "../../experiment.store";
import { computeBounds, fitToViewport, project, type Point2, type Viewport } from "./scene2d-data";
import { Arrow, COLORS } from "./primitives";
import { Teaching2D } from "./Teaching2D";

const VIEWPORT: Viewport = { width: 1200, height: 675, padding: 54 };

export function InclinedPlaneScene2D() {
  const currentTime = useSimulation((s) => s.currentTime);
  const mass = useSimulation((s) => s.mass);
  const gravity = useSimulation((s) => s.gravity);
  const scene = useSimulation((s) => s.scene);

  const p = (scene as any)?.simulation?.params ?? {};
  const L = Number(p.L ?? 5);
  const angleDeg = Number(p.angle ?? 30);
  const mu = Number(p.mu ?? 0.3);
  const rad = (angleDeg * Math.PI) / 180;
  const a = Math.max(0, gravity * (Math.sin(rad) - mu * Math.cos(rad)));
  const s = Math.min(0.5 * a * currentTime * currentTime, L);
  const block = { x: s * Math.cos(rad), y: s * Math.sin(rad) };

  const { toSvg } = useMemo(() => {
    const world: Point2[] = [
      { x: 0, y: 0 },
      { x: L, y: 0 },
      { x: L, y: L * Math.sin(rad) },
      { x: L, y: L * Math.sin(rad) + 0.5 },
      { x: -0.5, y: 0 },
    ];
    const b = computeBounds(world);
    const fit = fitToViewport(b, VIEWPORT);
    return { toSvg: (pt: Point2) => project(pt, b, fit) };
  }, [L, rad]);

  const base = toSvg({ x: 0, y: 0 });
  const tip = toSvg({ x: L, y: L * Math.sin(rad) });
  const baseRight = toSvg({ x: L, y: 0 });
  const blockSvg = toSvg(block);

  const speed = a * currentTime;
  const speedLen = Math.min(speed * 32, 160);
  const forceLen = Math.min(Math.abs(mass * gravity) * 6, 160);

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A" }}>
      <svg width="100%" height="100%" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet">
        {/* incline triangle */}
        <polygon points={`${base.x},${base.y} ${baseRight.x},${baseRight.y} ${tip.x},${tip.y}`}
          fill="#1E293B" stroke={COLORS.secondary} strokeWidth={2} />
        <line x1={baseRight.x} y1={baseRight.y} x2={baseRight.x} y2={base.y} stroke={COLORS.secondary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} />
        {/* angle arc label */}
        <text x={base.x + 40} y={base.y - 18} fill={COLORS.secondary} fontSize={12}>θ = {angleDeg}°</text>
        {/* block */}
        <rect x={blockSvg.x - 18} y={blockSvg.y - 12} width={36} height={24} rx={4} fill={COLORS.structure} stroke={COLORS.emphasis} strokeWidth={2} />
        {/* forces */}
        <Arrow x={blockSvg.x} y={blockSvg.y - 12} length={forceLen} direction={{ x: 0, y: 1 }} color={COLORS.force} label="G" />
        {speedLen > 1 && (
          <Arrow x={blockSvg.x + 26} y={blockSvg.y} length={speedLen} direction={{ x: Math.cos(rad), y: Math.sin(rad) }} color={COLORS.velocity} label="v" labelItalic />
        )}
        <Teaching2D scene={scene} currentTime={currentTime} />
      </svg>
    </div>
  );
}