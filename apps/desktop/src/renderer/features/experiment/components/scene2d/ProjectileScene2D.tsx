import { useMemo } from "react";
import { useSimulation } from "../../experiment.store";
import { computeBounds, fitToViewport, project, type Point2, type Viewport } from "./scene2d-data";
import { Arrow, COLORS } from "./primitives";
import { Teaching2D } from "./Teaching2D";

const VIEWPORT: Viewport = { width: 1200, height: 675, padding: 54 };

export function ProjectileScene2D() {
  const ballX = useSimulation((s) => s.ballX);
  const ballY = useSimulation((s) => s.ballY);
  const trail = useSimulation((s) => s.trail);
  const currentTime = useSimulation((s) => s.currentTime);
  const height = useSimulation((s) => s.height);
  const mass = useSimulation((s) => s.mass);
  const gravity = useSimulation((s) => s.gravity);
  const scene = useSimulation((s) => s.scene);

  const p = (scene as any)?.simulation?.params ?? {};
  const v0 = Number(p.v0 ?? 10);
  const angleDeg = Number(p.angle ?? 30);
  const rad = (angleDeg * Math.PI) / 180;

  const { bounds, toSvg } = useMemo(() => {
    const world: Point2[] = [];
    if (trail.length > 0) for (const t of trail) world.push({ x: t.x, y: Math.max(t.y, 0.2) });
    world.push({ x: 0, y: 0.2 }, { x: 0, y: height }, { x: Math.max(ballX, 2), y: 0.2 });
    const b = computeBounds(world);
    const fit = fitToViewport(b, VIEWPORT);
    return { bounds: b, toSvg: (pt: Point2) => project(pt, b, fit) };
  }, [trail, height, ballX]);

  const groundLeft = toSvg({ x: 0, y: 0.2 });
  const groundRight = toSvg({ x: Math.max(ballX, 2), y: 0.2 });
  const groundY = groundLeft.y;
  const launch = toSvg({ x: 0, y: height });
  const ball = toSvg({ x: ballX, y: Math.max(ballY, 0.2) });

  const vx = v0 * Math.cos(rad);
  const vy = v0 * Math.sin(rad) - gravity * currentTime;
  const speed = Math.sqrt(vx * vx + vy * vy);
  const speedLen = Math.min(speed * 32, 160);
  const forceLen = Math.min(Math.abs(mass * gravity) * 6, 160);

  const trailPts = useMemo(() => trail.map((t) => toSvg({ x: t.x, y: Math.max(t.y, 0.2) })), [trail, height, ballX]);

  const ke = 0.5 * mass * speed * speed;
  const pe = mass * gravity * Math.max(ballY, 0.2);
  const total = Math.max(mass * gravity * height, 1e-6);
  const barMax = 200;
  const keH = Math.min((ke / total) * barMax, barMax);
  const peH = Math.min((pe / total) * barMax, barMax);

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A" }}>
      <svg width="100%" height="100%" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet">
        <line x1={groundLeft.x} y1={groundY} x2={groundRight.x} y2={groundY} stroke={COLORS.secondary} strokeWidth={2.5} />
        <line x1={launch.x} y1={launch.y} x2={launch.x} y2={groundY} stroke={COLORS.secondary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} />
        {trailPts.length > 1 && (
          <polyline points={trailPts.map((t) => `${t.x},${t.y}`).join(" ")} fill="none" stroke={COLORS.velocity} strokeWidth={2} opacity={0.4} strokeLinejoin="round" />
        )}
        <Arrow x={ball.x - 20} y={ball.y} length={forceLen} direction={{ x: 0, y: 1 }} color={COLORS.force} label="G" />
        {speedLen > 1 && (
          <Arrow x={ball.x + 20} y={ball.y} length={speedLen} direction={{ x: Math.sign(vx) || 1, y: Math.sign(vy) || 0 }} color={COLORS.velocity} label="v" labelItalic />
        )}
        <circle cx={ball.x} cy={ball.y} r={14} fill={COLORS.structure} stroke={COLORS.emphasis} strokeWidth={2} />
        <g>
          <rect x={1118} y={100 + (barMax - peH)} width={14} height={peH} fill={COLORS.energy} opacity={0.6} />
          <rect x={1132} y={100 + (barMax - keH)} width={14} height={keH} fill={COLORS.energy} />
          <line x1={1116} y1={100} x2={1148} y2={100} stroke={COLORS.secondary} strokeWidth={1.5} />
          <text x={1125} y={318} fill={COLORS.energy} fontSize={12} textAnchor="middle">PE</text>
          <text x={1139} y={318} fill={COLORS.energy} fontSize={12} textAnchor="middle">KE</text>
        </g>
        <Teaching2D scene={scene} currentTime={currentTime} />
      </svg>
    </div>
  );
}