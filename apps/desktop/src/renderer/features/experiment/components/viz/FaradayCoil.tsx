import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const FaradayCoil = memo(function FaradayCoil() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "faraday_law") return null;

  const sim = (scene as any)?.simulation;
  const B = sim?.params?.B ?? 0.5;
  const N = sim?.params?.N ?? 100;
  const coilX = sim?.params?.coil_x ?? 1;
  const v = sim?.params?.v ?? 1;
  const magnetX = -2 + v * currentTime;

  // Coil visual (vertical loops at coilX)
  const coilY = 2;
  const coilR = 0.6;
  const coilPoints: THREE.Vector3[] = [];
  const numPts = 32;
  for (let i = 0; i <= numPts; i++) {
    const angle = (i / numPts) * Math.PI * 2;
    coilPoints.push(new THREE.Vector3(coilX, coilY + Math.cos(angle) * coilR, Math.sin(angle) * coilR));
  }

  // Flux indicator: 4 field lines from magnet to coil
  const fieldLines: Array<[THREE.Vector3, THREE.Vector3]> = [];
  const magnetTopY = 3.5, magnetBotY = 0.5;
  for (let y = magnetBotY; y <= magnetTopY; y += 1.5) {
    fieldLines.push([
      new THREE.Vector3(magnetX, y, 0),
      new THREE.Vector3(coilX, y, 0),
    ]);
  }

  // EMF
  const dist = Math.abs(magnetX - coilX);
  const flux = B * 0.01 * Math.exp(-dist * dist / 0.5);
  const emf = -N * B * 0.01 * v * (magnetX - coilX) * Math.exp(-dist * dist / 0.5) / 0.25;
  const emfColor = Math.abs(emf) > 1 ? "#f59e0b" : "#64748b";

  return (
    <group>
      {/* Coil */}
      <Line points={coilPoints} color="#3b82f6" lineWidth={2} />
      <mesh position={[coilX, coilY, 0]}>
        <torusGeometry args={[coilR, 0.03, 16, 32]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
      <Text position={[coilX, coilY + coilR + 0.4, 0]} fontSize={0.2} color="#60a5fa" anchorX="center">{"N=" + N + " turns"}</Text>

      {/* Field lines */}
      {fieldLines.map((l, i) => (
        <Line key={i} points={l} color={Math.abs(emf) > 1 ? "#f59e0b" : "#64748b"} lineWidth={1} transparent opacity={0.5} />
      ))}

      {/* EMF indicator */}
      <Text position={[coilX + 1.2, coilY, 0.4]} fontSize={0.3} color={emfColor} anchorX="left" outlineWidth={0.02} outlineColor="#000000">
        {"EMF=" + emf.toFixed(2) + "V"}
      </Text>

      {/* Direction indicators */}
      <Text position={[magnetX < coilX ? magnetX + 0.6 : coilX + 0.6, coilY - 0.6, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">
        {magnetX < coilX ? "Approaching" : "Leaving"}
      </Text>
    </group>
  );
});

export default FaradayCoil;
