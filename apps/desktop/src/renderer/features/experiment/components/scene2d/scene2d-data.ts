// ============================================================
// S88-A foundation: deterministic world -> 2D projection helpers.
// Pure functions only; the 2D vector renderer will consume these.
// state = f(scene, time) is preserved because all inputs are plain data.
// ============================================================

export interface Point2 { x: number; y: number }
export interface Viewport { width: number; height: number; padding: number }
export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }
export interface Fit { scale: number; offsetX: number; offsetY: number }

export function computeBounds(points: Point2[]): Bounds {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  if (minX === maxX) { minX -= 1; maxX += 1; }
  if (minY === maxY) { minY -= 1; maxY += 1; }
  return { minX, minY, maxX, maxY };
}

/** Uniform scale-to-fit that keeps every point inside the viewport padding. */
export function fitToViewport(bounds: Bounds, viewport: Viewport): Fit {
  const w = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const h = Math.max(bounds.maxY - bounds.minY, 1e-6);
  const availW = Math.max(viewport.width - viewport.padding * 2, 1);
  const availH = Math.max(viewport.height - viewport.padding * 2, 1);
  const scale = Math.min(availW / w, availH / h);
  const contentW = w * scale;
  const contentH = h * scale;
  const offsetX = viewport.padding + (availW - contentW) / 2;
  const offsetY = viewport.padding + (availH - contentH) / 2;
  return { scale, offsetX, offsetY };
}

/** Project a world point into SVG/view coordinates (y is flipped). */
export function project(p: Point2, bounds: Bounds, fit: Fit): Point2 {
  return {
    x: (p.x - bounds.minX) * fit.scale + fit.offsetX,
    y: (bounds.maxY - p.y) * fit.scale + fit.offsetY,
  };
}

export function projectMany(points: Point2[], viewport: Viewport): Point2[] {
  const bounds = computeBounds(points);
  const fit = fitToViewport(bounds, viewport);
  return points.map((p) => project(p, bounds, fit));
}
