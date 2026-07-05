import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const DopplerWavefronts = memo(function DopplerWavefronts() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "doppler_effect") return null;

  const sim = (scene as any)?.simulation;
  const vs = sim?.params?.vs ?? 1.5;
  const vSound = sim?.params?.v_sound ?? 340;
  const y0 = sim?.params?.y0 ?? 2;
  const observerX = sim?.params?.observer_x ?? 0;

  const sx = -3 + vs * currentTime;
  const sy = y0;

  // Wavefront rings
  const rings: Array<{ cx: number; r: number; opacity: number; color: string }> = [];
  const numRings = 8;
  const period = 1;
  const scale = 0.02;

  for (let i = 0; i < numRings; i++) {
    const emissionTime = currentTime - i * period;
    if (emissionTime < 0) continue;
    const sourceXAtEmission = Math.max(-3, -3 + vs * emissionTime);
    const elapsed = currentTime - emissionTime;
    const r = (vSound * elapsed) * scale;
    const color = sourceXAtEmission < observerX ? "#3b82f6" : "#ef4444";
    const opacity = Math.max(0, 0.18 - elapsed * 0.02);
    if (r < 10) rings.push({ cx: sourceXAtEmission, r, opacity, color });
  }

  const freq = 440;
  const obsFreq = sx < observerX
    ? freq * vSound / (vSound - Math.abs(vs))
    : freq * vSound / (vSound + Math.abs(vs));

  const observerPts = [
    new THREE.Vector3(observerX, sy - 1.5, 0),
    new THREE.Vector3(observerX, sy + 1.5, 0),
  ];

  return (
    <group>
      {rings.map((ring, i) => (
        <mesh key={i} position={[ring.cx, sy, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring.r - 0.04, ring.r + 0.04, 64]} />
          <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} side={2} />
        </mesh>
      ))}
      <Line points={observerPts} color="#22c55e" lineWidth={2} transparent opacity={0.6} />
      <Text position={[observerX, sy - 1.8, 0]} fontSize={0.25} color="#4ade80" anchorX="center">Observer</Text>
      <Text position={[sx, sy + 1.5, 0]} fontSize={0.3} color="#f8fafc" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"f = " + obsFreq.toFixed(0) + " Hz"}
      </Text>
      <Text position={[sx, sy + 1, 0]} fontSize={0.2} color={sx < observerX ? "#3b82f6" : "#ef4444"} anchorX="center">
        {sx < observerX ? "Approaching" : "Receding"}
      </Text>
    </group>
  );
});

export default DopplerWavefronts;
