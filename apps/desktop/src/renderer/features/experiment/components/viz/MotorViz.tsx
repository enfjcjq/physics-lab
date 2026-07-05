import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const MotorViz = memo(function MotorViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "electric_motor") return null;

  const sim = (scene as any)?.simulation;
  const N = sim?.params?.N ?? 10;
  const I = sim?.params?.I ?? 2;
  const A = sim?.params?.A ?? 0.05;
  const BField = sim?.params?.B ?? 1;
  const r = sim?.params?.r ?? 2;

  // Rotation angle
  const omega0 = sim?.params?.omega0 ?? 0;
  const alpha = N * I * A * BField / 1.5;
  const theta = omega0 * currentTime + 0.5 * alpha * currentTime * currentTime;
  const omega = alpha * currentTime;

  // Rotor arm (horizontal bar through origin)
  const armEndpoint: [number, number, number] = [r * Math.cos(theta), 2, r * Math.sin(theta)];

  // Magnetic field lines (vertical in Z)
  const bLines: Array<[THREE.Vector3, THREE.Vector3]> = [];
  for (let x = -3; x <= 3; x += 1.5) {
    bLines.push([
      new THREE.Vector3(x, 0.2, -3),
      new THREE.Vector3(x, 0.2, 3),
    ]);
  }

  return (
    <group>
      {/* Magnetic field zone */}
      <Text position={[0, 0.5, -1]} fontSize={0.2} color="#60a5fa" anchorX="center">B Field</Text>
      {bLines.map((l, i) => (
        <Line key={i} points={l} color="#3b82f6" lineWidth={0.5} transparent opacity={0.15} />
      ))}

      {/* Rotor center */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Rotor arm */}
      <Line
        points={[new THREE.Vector3(0, 2, 0), new THREE.Vector3(...armEndpoint)]}
        color="#f59e0b" lineWidth={3}
      />

      {/* Ball on arm (rotating mass) */}
      <mesh position={armEndpoint}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#441111" emissiveIntensity={0.4} />
      </mesh>

      {/* Angular velocity */}
      <Text position={[r + 1, 2, 0]} fontSize={0.25} color="#f8fafc" anchorX="left" outlineWidth={0.02} outlineColor="#000000">
        {"w=" + omega.toFixed(1) + " rad/s"}
      </Text>

      {/* Torque label */}
      <Text position={[0, 3.5, 0]} fontSize={0.25} color="#fbbf24" anchorX="center">
        {"T=" + (N * I * A * BField).toFixed(2) + " Nm"}
      </Text>
    </group>
  );
});

export default MotorViz;
