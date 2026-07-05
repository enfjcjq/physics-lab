import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const GasCylinder = memo(function GasCylinder() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "ideal_gas") return null;

  const sim = (scene as any)?.simulation;
  const n = sim?.params?.n ?? 1;
  const R = sim?.params?.R ?? 8.314;
  const T = sim?.params?.T ?? 300;
  const L0 = sim?.params?.L0 ?? 4;

  // Piston position
  const pistonX = L0 + 1.5 * Math.sin(0.8 * currentTime);
  const V = pistonX * 1; // A_cross = 1
  const P = n * R * T / V;

  // Cylinder walls (rectangle from 0 to pistonX)
  const cylinderTop = 2.5, cylinderBot = 0.5;
  const leftWallX = 0;

  // Cylinder outline
  const cylLines: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(leftWallX, cylinderBot, -0.5), new THREE.Vector3(leftWallX, cylinderTop, -0.5)], // Left wall
    [new THREE.Vector3(leftWallX, cylinderBot, 0.5), new THREE.Vector3(leftWallX, cylinderTop, 0.5)],
    [new THREE.Vector3(leftWallX, cylinderBot, -0.5), new THREE.Vector3(pistonX, cylinderBot, -0.5)], // Bottom
    [new THREE.Vector3(leftWallX, cylinderTop, -0.5), new THREE.Vector3(pistonX, cylinderTop, -0.5)], // Top
    [new THREE.Vector3(leftWallX, cylinderBot, 0.5), new THREE.Vector3(pistonX, cylinderBot, 0.5)],
    [new THREE.Vector3(leftWallX, cylinderTop, 0.5), new THREE.Vector3(pistonX, cylinderTop, 0.5)],
  ];

  // Piston face
  const pistonLines: Array<[THREE.Vector3, THREE.Vector3]> = [
    [new THREE.Vector3(pistonX, cylinderBot, -0.5), new THREE.Vector3(pistonX, cylinderTop, -0.5)],
    [new THREE.Vector3(pistonX, cylinderBot, 0.5), new THREE.Vector3(pistonX, cylinderTop, 0.5)],
    [new THREE.Vector3(pistonX, cylinderBot, -0.5), new THREE.Vector3(pistonX, cylinderBot, 0.5)],
    [new THREE.Vector3(pistonX, cylinderTop, -0.5), new THREE.Vector3(pistonX, cylinderTop, 0.5)],
  ];

  // Gas inside (transparent box)
  const gasMidX = (leftWallX + pistonX) / 2;

  return (
    <group>
      {/* Gas volume */}
      <mesh position={[gasMidX, (cylinderTop + cylinderBot) / 2, 0]}>
        <boxGeometry args={[pistonX - leftWallX, cylinderTop - cylinderBot, 1]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.2} />
      </mesh>

      {/* Cylinder lines */}
      {cylLines.map((l, i) => (
        <Line key={"c" + i} points={l} color="#64748b" lineWidth={1} transparent opacity={0.6} />
      ))}

      {/* Piston lines */}
      {pistonLines.map((l, i) => (
        <Line key={"p" + i} points={l} color="#f59e0b" lineWidth={2} />
      ))}

      {/* Data labels */}
      <Text position={[gasMidX, cylinderTop + 0.3, 0]} fontSize={0.2} color="#f8fafc" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"V=" + V.toFixed(2) + " m3"}
      </Text>
      <Text position={[gasMidX, cylinderBot - 0.4, 0]} fontSize={0.2} color="#ef4444" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"P=" + (P / 1000).toFixed(1) + " kPa"}
      </Text>

      {/* Equation */}
      <Text position={[L0 + 2, 2, 0]} fontSize={0.2} color="#94a3b8" anchorX="left">PV = nRT</Text>
    </group>
  );
});

export default GasCylinder;
