// S88-B1: which experiment topics should default to the 2D vector diagram.
// Accepts both built-in plugin ids (hyphen) and AI-generated virtual plugin ids (topic underscore).
const PLANE_IDS = new Set([
  "free-fall", "free_fall",
  "projectile-motion", "projectile",
  "inclined-plane", "inclined_plane",
  "collision",
  "spring-mass", "simple_harmonic_motion",
  "pendulum",
  "circular-motion", "circular_motion",
  "ohms_law",
  "transverse_wave", "wave", "longitudinal_wave",
]);

export function isPlaneScene(id: string): boolean {
  return PLANE_IDS.has(id);
}

// Which plane scenes currently have a 2D renderer ready.
// Only these should default to 2D; others stay 3D until their renderer lands.
export function has2DRenderer(id: string): boolean {
  return id === "free-fall" || id === "free_fall" || id === "ohms_law"
    || id === "projectile-motion" || id === "projectile"
    || id === "inclined-plane" || id === "inclined_plane";
}
