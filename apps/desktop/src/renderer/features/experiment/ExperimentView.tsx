import { Scene3D } from "./components/Scene3D";
import { useSimulation } from "./experiment.store";

export function ExperimentView() {
  const jumping = useSimulation((s) => s.playing);

  return (
    <div className="flex-1 relative min-w-0">
      <Scene3D />
    </div>
  );
}
