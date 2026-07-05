import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const RefractionBoundary = memo(function RefractionBoundary() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "refraction") return null;

  const sim = (scene as any)?.simulation;
  const n1 = sim?.params?.n1 ?? 1.0;
  const n2 = sim?.params?.n2 ?? 1.5;
  const theta1 = (sim?.params?.theta1_deg ?? 45) * Math.PI / 180;
  const yBoundary = sim?.params?.y_boundary ?? 1;
  const vLight = sim?.params?.v_light ?? 3;

  const tHit = (3 - yBoundary) / (vLight * Math.cos(theta1));
  const hitX = vLight * tHit * Math.sin(theta1);
  const theta2 = Math.asin(n1 / n2 * Math.sin(theta1));

  // Current photon position
  const py = 3 - vLight * currentTime * Math.cos(theta1);
  const px = py > yBoundary ? vLight * currentTime * Math.sin(theta1) : hitX + (currentTime - tHit) * vLight * Math.sin(theta2) * (n1 / n2);

  const boundaryPoints = [
    new THREE.Vector3(-1, yBoundary, -1.5),
    new THREE.Vector3(8, yBoundary, -1.5),
  ];

  const incidentPoints = [
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(hitX, yBoundary, 0),
  ];

  const refractedPoints = [
    new THREE.Vector3(hitX, yBoundary, 0),
    new THREE.Vector3(hitX + 3 * Math.sin(theta2), yBoundary - 3 * Math.cos(theta2), 0),
  ];

  const normalPoints = [
    new THREE.Vector3(hitX, yBoundary + 1, 0),
    new THREE.Vector3(hitX, yBoundary - 2, 0),
  ];

  return (
    <group>
      {/* Boundary surface */}
      <mesh position={[3.5, yBoundary, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 3]} />
        <meshBasicMaterial color="#1e3a5f" transparent opacity={0.3} side={2} />
      </mesh>
      <Line points={boundaryPoints} color="#3b82f6" lineWidth={1} transparent opacity={0.5} />

      {/* Medium labels */}
      <Text position={[6, yBoundary + 1, 0]} fontSize={0.35} color="#94a3b8" anchorX="left">n1={n1}</Text>
      <Text position={[6, yBoundary - 0.8, 0]} fontSize={0.35} color="#60a5fa" anchorX="left">n2={n2}</Text>

      {/* Normal line */}
      <Line points={normalPoints} color="#64748b" lineWidth={0.5} transparent opacity={0.4} />

      {/* Incident ray */}
      <Line points={incidentPoints} color="#fbbf24" lineWidth={2} transparent opacity={0.7} />

      {/* Refracted ray */}
      <Line points={refractedPoints} color="#3b82f6" lineWidth={2} transparent opacity={0.7} />

      {/* Angle labels */}
      <Text position={[hitX + 0.5, yBoundary + 0.4, 0]} fontSize={0.2} color="#fbbf24" anchorX="left">theta1</Text>
      <Text position={[hitX + 0.5, yBoundary - 0.8, 0]} fontSize={0.2} color="#60a5fa" anchorX="left">theta2</Text>

      {/* Photon particle */}
      <mesh position={[Math.min(px, 8), Math.max(py, 0.1), 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={py > yBoundary ? "#fbbf24" : "#3b82f6"} />
      </mesh>
    </group>
  );
});

export default RefractionBoundary;
