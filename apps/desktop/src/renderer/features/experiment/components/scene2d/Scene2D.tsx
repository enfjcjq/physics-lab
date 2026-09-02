import { useMemo } from "react";
import { useSimulation } from "../../experiment.store";
import {
  computeBounds,
  fitToViewport,
  project,
  type Point2,
  type Viewport,
} from "./scene2d-data";

const VIEWPORT: Viewport = { width: 1200, height: 675, padding: 54 };

const COLORS = {
  force: "#EF4444",
  velocity: "#00D4FF",
  energy: "#F59E0B",
  event: "#FF6B00",
  structure: "#334155",
  secondary: "#94A3B8",
  emphasis: "#E2E8F0",
};

function Arrow({
  x,
  y,
  length,
  direction,
  color,
  dashed = false,
  width = 2.5,
  label,
  labelItalic = false,
}: {
  x: number;
  y: number;
  length: number;
  direction: Point2;
  color: string;
  dashed?: boolean;
  width?: number;
  label?: string;
  labelItalic?: boolean;
}) {
  const len = Math.max(length, 0.0001);
  const nx = direction.x === 0 ? 0 : Math.sign(direction.x);
  const ny = direction.y === 0 ? 0 : Math.sign(direction.y);
  const tip = { x: x + nx * len, y: y + ny * len };
  const head = 10;
  const halfW = 4;
  const px = ny === 0 ? 0 : -ny;
  const py = nx === 0 ? 0 : nx;
  const base = { x: tip.x - nx * head, y: tip.y - ny * head };
  const p1 = { x: base.x + px * halfW, y: base.y + py * halfW };
  const p2 = { x: base.x - px * halfW, y: base.y - py * halfW };
  const labelX = tip.x + nx * 8 - (nx === 0 ? 6 : 0);
  const labelY = tip.y + ny * 8 - (ny === 0 ? 4 : 0);
  return (
    <g>
      <line x1={x} y1={y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? "4 4" : undefined} strokeLinecap="round" />
      <polygon points={`${tip.x},${tip.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={color} />
      {label && (
        <text x={labelX} y={labelY} fill={color} fontSize={14}
          fontStyle={labelItalic ? "italic" : "normal"} textAnchor={nx === 0 ? "middle" : nx > 0 ? "start" : "end"}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Scene2D() {
  const ballX = useSimulation((s) => s.ballX);
  const ballY = useSimulation((s) => s.ballY);
  const ballVelocity = useSimulation((s) => s.ballVelocity);
  const currentTime = useSimulation((s) => s.currentTime);
  const trail = useSimulation((s) => s.trail);
  const height = useSimulation((s) => s.height);
  const mass = useSimulation((s) => s.mass);
  const gravity = useSimulation((s) => s.gravity);
  const scene = useSimulation((s) => s.scene);

  const { bounds, toSvg } = useMemo(() => {
    const world: Point2[] = [];
    for (let y = 0.2; y <= height + 0.01; y += 0.2) world.push({ x: 0, y });
    world.push({ x: -4, y: 0.2 }, { x: 4, y: 0.2 });
    const b = computeBounds(world);
    const fit = fitToViewport(b, VIEWPORT);
    return { bounds: b, toSvg: (p: Point2) => project(p, b, fit) };
  }, [height]);

  const groundLeft = toSvg({ x: -4, y: 0.2 });
  const groundRight = toSvg({ x: 4, y: 0.2 });
  const ball = toSvg({ x: ballX, y: Math.max(ballY, 0.2) });
  const groundY = groundLeft.y;

  const speedLen = Math.min(Math.abs(ballVelocity) * 32, 160);
  const forceLen = Math.min(Math.abs(mass * gravity) * 6, 160);

  const trailPts = useMemo(
    () => trail.map((p) => toSvg({ x: p.x, y: Math.max(p.y, 0.2) })),
    [trail, height]
  );

  const ke = 0.5 * mass * ballVelocity * ballVelocity;
  const pe = mass * gravity * Math.max(ballY, 0.2);
  const total = Math.max(mass * gravity * height, 1e-6);
  const barMax = 200;
  const keH = Math.min((ke / total) * barMax, barMax);
  const peH = Math.min((pe / total) * barMax, barMax);

  const impactEvent = scene?.timeline?.events?.find((e) => e.type === "collision");
  const impactT = impactEvent?.time ?? null;
  let pulse = null;
  if (impactT !== null && currentTime >= impactT && currentTime <= impactT + 0.4) {
    const t = (currentTime - impactT) / 0.4;
    pulse = { r: 10 + 30 * t, opacity: 1 - t };
  }

  const heightLabel = { x: ball.x - 14, y: (ball.y + groundY) / 2 };

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A" }}>
      <svg width="100%" height="100%" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid meet">
        <line x1={groundLeft.x} y1={groundY} x2={groundRight.x} y2={groundY} stroke={COLORS.secondary} strokeWidth={2.5} />
        {Array.from({ length: 18 }).map((_, i) => {
          const x = groundLeft.x + i * 22;
          return <line key={i} x1={x} y1={groundY} x2={x - 6} y2={groundY + 8} stroke={COLORS.secondary} strokeWidth={1} opacity={0.4} />;
        })}

        {ballY > 0.3 && (
          <g>
            <line x1={ball.x} y1={ball.y} x2={ball.x} y2={groundY} stroke={COLORS.secondary} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5} />
            <line x1={ball.x - 8} y1={ball.y} x2={ball.x + 8} y2={ball.y} stroke={COLORS.secondary} strokeWidth={1.5} opacity={0.5} />
            <text x={heightLabel.x} y={heightLabel.y} fill={COLORS.secondary} fontSize={12} textAnchor="end">{Math.max(ballY, 0).toFixed(1)}m</text>
          </g>
        )}

        {trailPts.length > 1 && (
          <polyline
            points={trailPts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={COLORS.velocity} strokeWidth={2} opacity={0.4} strokeLinejoin="round"
          />
        )}

        <Arrow x={ball.x - 22} y={ball.y} length={forceLen} direction={{ x: 0, y: 1 }} color={COLORS.force} label="G" />

        {speedLen > 1 && (
          <Arrow x={ball.x + 22} y={ball.y} length={speedLen} direction={{ x: 0, y: Math.sign(ballVelocity) || 1 }} color={COLORS.velocity} label="v" labelItalic />
        )}

        <circle cx={ball.x} cy={ball.y} r={14} fill={COLORS.structure} stroke={COLORS.emphasis} strokeWidth={2} />

        <g>
          <rect x={1126} y={100 + (barMax - peH)} width={14} height={peH} fill={COLORS.energy} opacity={0.6} />
          <rect x={1144} y={100 + (barMax - keH)} width={14} height={keH} fill={COLORS.energy} />
          <line x1={1124} y1={100} x2={1162} y2={100} stroke={COLORS.secondary} strokeWidth={1.5} />
          <text x={1133} y={318} fill={COLORS.energy} fontSize={12} textAnchor="middle">PE</text>
          <text x={1151} y={318} fill={COLORS.energy} fontSize={12} textAnchor="middle">KE</text>
        </g>

        {pulse && (
          <g>
            <circle cx={ball.x} cy={ball.y} r={pulse.r} fill="none" stroke={COLORS.event} strokeWidth={2} opacity={pulse.opacity} />
            <circle cx={ball.x} cy={ball.y} r={4} fill={COLORS.event} />
          </g>
        )}
      </svg>
    </div>
  );
}