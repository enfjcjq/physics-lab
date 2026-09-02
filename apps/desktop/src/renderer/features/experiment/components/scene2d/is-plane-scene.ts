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
