import { pluginRegistry } from "../core/plugin-registry";

const pluginLoaders: Record<string, () => Promise<void>> = {
  "pendulum": async () => {
    const { pendulumPlugin } = await import("../plugins/pendulum/pendulum.plugin");
    pluginRegistry.register(pendulumPlugin);
  },
  "projectile-motion": async () => {
    const { projectileMotionPlugin } = await import("../plugins/projectile-motion/projectile-motion.plugin");
    pluginRegistry.register(projectileMotionPlugin);
  },
  "inclined-plane": async () => {
    const { inclinedPlanePlugin } = await import("../plugins/inclined-plane/inclined-plane.plugin");
    pluginRegistry.register(inclinedPlanePlugin);
  },
  "spring-mass": async () => {
    const { springMassPlugin } = await import("../plugins/spring-mass/spring-mass.plugin");
    pluginRegistry.register(springMassPlugin);
  },
  "collision": async () => {
    const { collisionPlugin } = await import("../plugins/collision/collision.plugin");
    pluginRegistry.register(collisionPlugin);
  },

  "buoyancy": async () => {
    const { buoyancyPlugin } = await import("../plugins/buoyancy/buoyancy.plugin");
    pluginRegistry.register(buoyancyPlugin);
  },
  "circular-motion": async () => {
    const { circularMotionPlugin } = await import("../plugins/circular-motion/circular-motion.plugin");
    pluginRegistry.register(circularMotionPlugin);
  },
};

const loadingPlugins = new Set<string>();

export async function ensurePlugin(pluginId: string): Promise<boolean> {
  if (pluginRegistry.get(pluginId)) return true;
  if (loadingPlugins.has(pluginId)) return false;

  const loader = pluginLoaders[pluginId];
  if (!loader) return false;

  loadingPlugins.add(pluginId);
  try {
    await loader();
    return true;
  } catch (err) {
    console.error("Failed to load plugin: " + pluginId, err);
    return false;
  } finally {
    loadingPlugins.delete(pluginId);
  }
}
