import { pluginRegistry } from "../core/plugin-registry";
const pluginLoaders = {
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
};
const loadingPlugins = new Set();
export async function ensurePlugin(pluginId) {
    if (pluginRegistry.get(pluginId))
        return true;
    if (loadingPlugins.has(pluginId))
        return false;
    const loader = pluginLoaders[pluginId];
    if (!loader)
        return false;
    loadingPlugins.add(pluginId);
    try {
        await loader();
        return true;
    }
    catch (err) {
        console.error("Failed to load plugin: " + pluginId, err);
        return false;
    }
    finally {
        loadingPlugins.delete(pluginId);
    }
}
//# sourceMappingURL=plugin-loader.js.map