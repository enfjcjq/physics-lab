import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const CoulombField = memo(function CoulombField() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "coulombs_law") return null;

  const sim = (scene as any)?.simulation;
  const k = sim?.params?.k ?? 8.99e9;
  const q1 = sim?.params?.q1 ?? 5e-6;
  const q2 = sim?.params?.q2 ?? 5e-6;
  const d0 = sim?.params?.d0 ?? 4;
  const m = sim?.params?.m ?? 0.01;
  const y0 = sim?.params?.y0 ?? 3;

  const cx1 = -2, cy1 = y0;
  const cx2 = Math.sqrt(2 * k * q1 * q2 * currentTime / m + d0 * d0) / 2 + 2;

  const numLines = 12;
  const maxR = 5;
  const fieldLines: Array<[THREE.Vector3, THREE.Vector3]> = [];
  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2;
    fieldLines.push([
      new THREE.Vector3(cx1, cy1, 0),
      new THREE.Vector3(cx1 + Math.cos(angle) * maxR, cy1 + Math.sin(angle) * maxR, 0),
    ]);
  }

  return (
    <group>
      <mesh position={[cx1, cy1, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ef4444" emissive="#441111" emissiveIntensity={0.6} metalness={0.3} roughness={0.3} />
      </mesh>
      <Text position={[cx1, cy1 + 0.5, 0]} fontSize={0.3} color="#fca5a5" anchorX="center">q1</Text>
      {fieldLines.map((l: [THREE.Vector3, THREE.Vector3], i: number) => (
        <Line key={i} points={l} color="#f59e0b" lineWidth={0.5} transparent opacity={0.25} />
      ))}
      {currentTime > 0.01 && (
        <group>
          <Line
            points={[new THREE.Vector3(cx2, cy1, 0), new THREE.Vector3(cx2 + 1.5, cy1, 0)]}
            color="#f59e0b" lineWidth={2}
          />
          <mesh position={[cx2 + 1.5, cy1, 0]}>
            <coneGeometry args={[0.12, 0.25, 8]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <Text position={[cx2 + 2, cy1 + 0.3, 0]} fontSize={0.25} color="#fbbf24" anchorX="left">Fe</Text>
        </group>
      )}
    </group>
  );
});

export default CoulombField;
