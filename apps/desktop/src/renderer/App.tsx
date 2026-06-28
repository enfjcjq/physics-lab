import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { useSimulation } from "./features/experiment/experiment.store";
import { pluginRegistry } from "./core/plugin-registry";
import { freeFallPlugin } from "./plugins";
import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";

// Eagerly register only free-fall. Other plugins load lazily on switch.
// Register all plugins so the experiment switcher shows all 6
pluginRegistry.register(freeFallPlugin);
// Dynamic engine test: formula-driven free-fall (compare with hand-coded plugin)
import { createFreeFallScene, createVirtualPlugin } from "@physics-lab/shared";
pluginRegistry.register(createVirtualPlugin(createFreeFallScene(10, 9.8, 2) as any));
// Lazy-register the rest on first access via ensurePlugin in plugin-loader.ts
// They appear in the list because pluginRegistry.list() only shows registered plugins.
// We eagerly register them here for the UI, but their scenes load lazily.
import("./plugins/projectile-motion/projectile-motion.plugin").then(m => pluginRegistry.register(m.projectileMotionPlugin));
import("./plugins/inclined-plane/inclined-plane.plugin").then(m => pluginRegistry.register(m.inclinedPlanePlugin));
import("./plugins/collision/collision.plugin").then(m => pluginRegistry.register(m.collisionPlugin));
import("./plugins/spring-mass/spring-mass.plugin").then(m => pluginRegistry.register(m.springMassPlugin));
import("./plugins/pendulum/pendulum.plugin").then(m => pluginRegistry.register(m.pendulumPlugin));
import("./plugins/buoyancy/buoyancy.plugin").then(m => pluginRegistry.register(m.buoyancyPlugin));
import("./plugins/circular-motion/circular-motion.plugin").then(m => pluginRegistry.register(m.circularMotionPlugin));

export function App() {
  const setScene = useSimulation((s) => s.setScene);
  const sceneLoaded = useSimulation((s) => s.sceneLoaded);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadScene() {
      try {
        const savedPlugin = localStorage.getItem("physics-lab:lastPlugin");
        const pluginId = savedPlugin || "free-fall";
        const plugin = pluginRegistry.get(pluginId);
        const fallback = plugin?.getDefaultScene() ?? FREE_FALL_SCENE;

        // Try IPC first (Electron packaged mode)
        if (window.physicsLab?.scene) {
          try {
            const data: PhysicsScene = await window.physicsLab.scene.getDefault();
            if (!cancelled && data) { setScene(data); return; }
          } catch { /* IPC failed, fall through */ }
        }
        // Fallback: use bundled scene
        if (!cancelled) { setScene(fallback as PhysicsScene); }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
          console.error("[Physics Lab] Scene load failed:", err);
        }
      }
    }
    loadScene();
    return () => { cancelled = true; };
  }, [setScene]);

  const activePluginId = useSimulation((s) => s.activePluginId);
  useEffect(() => {
    if (activePluginId) {
      localStorage.setItem("physics-lab:lastPlugin", activePluginId);
    }
  }, [activePluginId]);

  // Loading state with error display
  if (!sceneLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Physics Lab</p>
          {loadError && (
            <p className="text-red-400 text-xs mt-3 max-w-md mx-auto px-4" style={{ wordBreak: "break-word" }}>
              Load error: {loadError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <ErrorBoundary><AppShell /></ErrorBoundary>;
}