// S88-B1: which experiment topics should default to the 2D vector diagram.
const PLANE_PLUGINS = new Set([
  "free-fall",
  "projectile-motion",
  "inclined-plane",
  "collision",
  "spring-mass",
  "pendulum",
  "circular-motion",
  "ohms_law",
  "transverse_wave",
]);

export function isPlaneScene(pluginId: string): boolean {
  return PLANE_PLUGINS.has(pluginId);
}
