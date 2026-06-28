import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
    const [loadError, setLoadError] = useState(null);
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
                        const data = await window.physicsLab.scene.getDefault();
                        if (!cancelled && data) {
                            setScene(data);
                            return;
                        }
                    }
                    catch { /* IPC failed, fall through */ }
                }
                // Fallback: use bundled scene
                if (!cancelled) {
                    setScene(fallback);
                }
            }
            catch (err) {
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
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center", style: { background: "var(--bg-root)" }, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-slate-400 text-lg", children: "Physics Lab" }), loadError && (_jsxs("p", { className: "text-red-400 text-xs mt-3 max-w-md mx-auto px-4", style: { wordBreak: "break-word" }, children: ["Load error: ", loadError] }))] }) }));
    }
    return _jsx(ErrorBoundary, { children: _jsx(AppShell, {}) });
}
//# sourceMappingURL=App.js.map