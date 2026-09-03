import type { Point2 } from "./scene2d-data";

export const COLORS = {
  force: "#EF4444",
  velocity: "#00D4FF",
  energy: "#F59E0B",
  event: "#FF6B00",
  structure: "#334155",
  secondary: "#94A3B8",
  emphasis: "#E2E8F0",
};

export function Arrow({
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
  const mag = Math.hypot(direction.x, direction.y) || 1;
  const nx = direction.x / mag;
  const ny = direction.y / mag;
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