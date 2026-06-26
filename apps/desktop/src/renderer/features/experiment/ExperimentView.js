import { jsx as _jsx } from "react/jsx-runtime";
import { Scene3D } from "./components/Scene3D";
import { useSimulation } from "./experiment.store";
export function ExperimentView() {
    const jumping = useSimulation((s) => s.playing);
    return (_jsx("div", { className: "flex-1 relative min-w-0", children: _jsx(Scene3D, {}) }));
}
//# sourceMappingURL=ExperimentView.js.map