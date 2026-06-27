import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { useSimulation } from "./features/experiment/experiment.store";
import { pluginRegistry } from "./core/plugin-registry";
import { freeFallPlugin } from "./plugins";
import { FREE_FALL_SCENE } from "@physics-lab/shared";
// Eagerly register only free-fall. Other plugins load lazily on switch.
pluginRegistry.register(freeFallPlugin);
export function App() {
    const setScene = useSimulation((s) => s.setScene);
    const sceneLoaded = useSimulation((s) => s.sceneLoaded);
    useEffect(() => {
        const savedPlugin = localStorage.getItem("physics-lab:lastPlugin");
        const pluginId = savedPlugin || "free-fall";
        const plugin = pluginRegistry.get(pluginId);
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
    const activePluginId = useSimulation((s) => s.activePluginId);
    useEffect(() => {
        if (activePluginId) {
            localStorage.setItem("physics-lab:lastPlugin", activePluginId);
        }
    }, [activePluginId]);
    if (!sceneLoaded) {
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center", style: { background: "var(--bg-root)" }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400 text-lg", children: "Physics Lab" })] }) }));
    }
    return _jsx(ErrorBoundary, { children: _jsx(AppShell, {}) });
}
//# sourceMappingURL=App.js.map