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
  "circular-motion": async () => {
    const { circularMotionPlugin } = await import("../plugins/circular-motion/circular-motion.plugin");
    pluginRegistry.register(circularMotionPlugin);
  },
};