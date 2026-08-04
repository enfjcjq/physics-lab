import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { HomePage } from "./features/home/HomePage";
import { useHome } from "./features/home/home.store";
import { useSimulation } from "./features/experiment/experiment.store";
import { pluginRegistry } from "./core/plugin-registry";
import { freeFallPlugin } from "./plugins";
import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE, OHMS_LAW_SCENE, WAVE_SCENE, COULOMB_SCENE, REFRACTION_SCENE, DOPPLER_SCENE, FARADAY_SCENE, MOTOR_SCENE, IDEAL_GAS_SCENE, LENS_OPTICS_SCENE, AC_GENERATOR_SCENE, createVirtualPlugin } from "@physics-lab/shared";
import { registerExtraScenes } from "./plugins/extra-scenes";

// Eagerly register only free-fall. Other plugins load lazily on switch.
pluginRegistry.register(freeFallPlugin);
import("./plugins/projectile-motion/projectile-motion.plugin").then(m => pluginRegistry.register(m.projectileMotionPlugin));
import("./plugins/inclined-plane/inclined-plane.plugin").then(m => pluginRegistry.register(m.inclinedPlanePlugin));
import("./plugins/collision/collision.plugin").then(m => pluginRegistry.register(m.collisionPlugin));
import("./plugins/spring-mass/spring-mass.plugin").then(m => pluginRegistry.register(m.springMassPlugin));
import("./plugins/pendulum/pendulum.plugin").then(m => pluginRegistry.register(m.pendulumPlugin));
import("./plugins/buoyancy/buoyancy.plugin").then(m => pluginRegistry.register(m.buoyancyPlugin));
import("./plugins/circular-motion/circular-motion.plugin").then(m => pluginRegistry.register(m.circularMotionPlugin));
// Virtual plugins (formula-driven, no separate plugin file needed)
pluginRegistry.register(createVirtualPlugin(OHMS_LAW_SCENE as any));
pluginRegistry.register(createVirtualPlugin(WAVE_SCENE as any));
pluginRegistry.register(createVirtualPlugin(COULOMB_SCENE as any));
pluginRegistry.register(createVirtualPlugin(REFRACTION_SCENE as any));
pluginRegistry.register(createVirtualPlugin(DOPPLER_SCENE as any));
pluginRegistry.register(createVirtualPlugin(FARADAY_SCENE as any));
pluginRegistry.register(createVirtualPlugin(MOTOR_SCENE as any));
pluginRegistry.register(createVirtualPlugin(IDEAL_GAS_SCENE as any));
pluginRegistry.register(createVirtualPlugin(LENS_OPTICS_SCENE as any));
pluginRegistry.register(createVirtualPlugin(AC_GENERATOR_SCENE as any));
// Scene-only experiments from the extension point (see plugins/extra-scenes.ts)
registerExtraScenes();

export function App() {
  const view = useHome((s) => s.view);
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
        if ((window as any).physicsLab?.scene) {
          try {
            const data: PhysicsScene = await (window as any).physicsLab.scene.getDefault();
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

  // P0: problem-input homepage is the startup view; scene page has 300ms fade-in.
  return (
    <ErrorBoundary>
      {view === "home" ? (
        <HomePage />
      ) : (
        <div className="w-full h-full animate-in fade-in duration-300">
          <AppShell />
        </div>
      )}
    </ErrorBoundary>
  );
}
