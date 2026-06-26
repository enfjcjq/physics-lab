import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useSimulation } from "./features/experiment/experiment.store";
import { pluginRegistry } from "./core/plugin-registry";
import { freeFallPlugin, projectileMotionPlugin, inclinedPlanePlugin, collisionPlugin } from "./plugins";
import type { PhysicsScene } from "@physics-lab/shared";
import { FREE_FALL_SCENE } from "@physics-lab/shared";

// Register all plugins at startup
pluginRegistry.register(freeFallPlugin);
pluginRegistry.register(projectileMotionPlugin);
pluginRegistry.register(inclinedPlanePlugin);
pluginRegistry.register(collisionPlugin);

export function App() {
  const setScene = useSimulation((s) => s.setScene);
  const sceneLoaded = useSimulation((s) => s.sceneLoaded);

  useEffect(() => {
    const plugin = pluginRegistry.get("free-fall");
    const scene = plugin?.getDefaultScene() ?? FREE_FALL_SCENE;

    async function loadScene() {
      try {
        if (window.physicsLab?.scene) {
          const data: PhysicsScene = await window.physicsLab.scene.getDefault();
          setScene(data);
          return;
        }
      } catch {}
      setScene(scene as PhysicsScene);
    }
    loadScene();
  }, [setScene]);

  if (!sceneLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-root)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Physics Lab</p>
        </div>
      </div>
    );
  }

  return <AppShell />;
}
