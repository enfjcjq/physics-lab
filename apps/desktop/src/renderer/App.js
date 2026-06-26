import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { useSimulation } from "./features/experiment/experiment.store";
import { pluginRegistry } from "./core/plugin-registry";
import { freeFallPlugin, projectileMotionPlugin } from "./plugins";
import { FREE_FALL_SCENE } from "@physics-lab/shared";
// Register all plugins at startup
pluginRegistry.register(freeFallPlugin);
pluginRegistry.register(projectileMotionPlugin);
export function App() {
    const setScene = useSimulation((s) => s.setScene);
    const sceneLoaded = useSimulation((s) => s.sceneLoaded);
    useEffect(() => {
        const plugin = pluginRegistry.get("free-fall");
        const scene = plugin?.getDefaultScene() ?? FREE_FALL_SCENE;
        async function loadScene() {
            try {
                if (window.physicsLab?.scene) {
                    const data = await window.physicsLab.scene.getDefault();
                    setScene(data);
                    return;
                }
            }
            catch { }
            setScene(scene);
        }
        loadScene();
    }, [setScene]);
    if (!sceneLoaded) {
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center", style: { background: "var(--bg-root)" }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400 text-lg", children: "Physics Lab" })] }) }));
    }
    return _jsx(AppShell, {});
}
//# sourceMappingURL=App.js.map