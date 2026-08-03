import { memo, useMemo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

/** Deterministic unit vector for flux-line arrowheads. */
const X_AXIS = new THREE.Vector3(1, 0, 0);

const FaradayCoil = memo(function FaradayCoil() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const ballX = useSimulation((s) => s.ballX); // magnet x (frame cache tracks 1st entity)
  const scene = useSimulation((s) => s.scene);

  const sim = (scene as any)?.simulation;
  const B = sim?.params?.B ?? 0.5;
  const N = sim?.params?.N ?? 100;
  const A = sim?.params?.A ?? 0.01;
  const v = sim?.params?.v ?? 1;
  const coilX = sim?.params?.coil_x ?? 1;

  const coilY = 2;
  const coilR = 0.6;

  // Physics — mirrors simulation.equations in faraday-law-scene.ts
  const dx = ballX - coilX;
  const coupling = Math.exp(-(dx * dx) / 0.5);
  const flux = B * A * coupling;
  const emf = (-N * B * A * v * dx * coupling) / 0.25;
  const emfMax = (N * B * A * v * 0.5 * Math.exp(-0.5)) / 0.25; // |dx·e^{-dx²/0.5}| max at |dx|=0.5
  const active = Math.abs(emf) > emfMax * 0.05;
  const emfColor = active ? "#f59e0b" : "#64748b";

  // Multi-turn coil: 4 stacked loops (visual richness for N turns)
  const turns = useMemo(() => {
    const loops: THREE.Vector3[][] = [];
    for (let t = 0; t < 4; t++) {
      const x = coilX - 0.12 + t * 0.08;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        pts.push(new THREE.Vector3(x, coilY + Math.cos(a) * coilR, Math.sin(a) * coilR));
      }
      loops.push(pts);
    }
    return loops;
  }, [coilX]);

  // Flux lines through the coil disc; opacity follows magnet-coil coupling
  const fluxLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    const x0 = Math.min(ballX - 0.8, coilX - 1.6);
    const x1 = Math.max(ballX + 0.8, coilX + 1.6);
    for (const dy of [-0.36, 0, 0.36]) {
      for (const dz of [-0.36, 0, 0.36]) {
        lines.push([new THREE.Vector3(x0, coilY + dy, dz), new THREE.Vector3(x1, coilY + dy, dz)]);
      }
    }
    return lines;
  }, [ballX, coilX]);

  // EMF gauge (semicircular dial with needle), fixed to the right of the coil
  const gx = coilX + 2.4, gy = 3.1, gr = 0.55;
  const gaugeArc = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      pts.push(new THREE.Vector3(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr, 0.5));
    }
    return pts;
  }, [gx, gy, gr]);
  const needleAngle = Math.PI / 2 - (THREE.MathUtils.clamp(emf / (emfMax || 1), -1, 1) * Math.PI) / 3;
  const needleTip: [number, number, number] = [gx + Math.cos(needleAngle) * gr * 0.75, gy + Math.sin(needleAngle) * gr * 0.75, 0.5];

  const arrowDir = ballX < coilX ? 1 : -1; // field through coil points away from N pole

  if (activePlugin !== "faraday_law") return null;

  return (
    <group>
      {/* Bar magnet: S (blue, left) / N (red, right) */}
      <mesh position={[ballX - 0.24, coilY, 0]}>
        <boxGeometry args={[0.48, 0.3, 0.3]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[ballX + 0.24, coilY, 0]}>
        <boxGeometry args={[0.48, 0.3, 0.3]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.4} />
      </mesh>
      <Text position={[ballX - 0.24, coilY + 0.28, 0]} fontSize={0.18} color="#93c5fd" anchorX="center">S</Text>
      <Text position={[ballX + 0.24, coilY + 0.28, 0]} fontSize={0.18} color="#fca5a5" anchorX="center">N</Text>

      {/* Coil turns */}
      {turns.map((pts, i) => (
        <Line key={i} points={pts} color={active ? "#60a5fa" : "#3b82f6"} lineWidth={2} />
      ))}
      <mesh position={[coilX, coilY, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[coilR, 0.035, 16, 32]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive={active ? (emf > 0 ? "#22c55e" : "#ef4444") : "#000000"}
          emissiveIntensity={active ? 0.8 : 0}
        />
      </mesh>
      <Text position={[coilX, coilY + coilR + 0.35, 0]} fontSize={0.2} color="#60a5fa" anchorX="center">
        {"N=" + N + " turns"}
      </Text>

      {/* Flux lines through coil (opacity = coupling strength) */}
      {fluxLines.map((pts, i) => (
        <group key={i}>
          <Line points={pts} color="#818cf8" lineWidth={1} transparent opacity={0.08 + coupling * 0.5} />
          <mesh
            position={[(pts[0].x + pts[1].x) / 2, pts[0].y, pts[0].z]}
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), X_AXIS.clone().multiplyScalar(arrowDir))}
          >
            <coneGeometry args={[0.05, 0.14, 6]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0.15 + coupling * 0.6} />
          </mesh>
        </group>
      ))}

      {/* Flux readout */}
      <Text position={[coilX, coilY - coilR - 0.35, 0]} fontSize={0.16} color="#a5b4fc" anchorX="center">
        {"\u03A6 = " + flux.toExponential(2) + " Wb"}
      </Text>

      {/* EMF gauge */}
      <mesh position={[gx, gy, 0.48]}>
        <circleGeometry args={[gr, 32]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
      </mesh>
      <Line points={gaugeArc} color="#64748b" lineWidth={2} />
      {[0.25, 0.5, 0.75].map((f) => {
        const a = f * Math.PI;
        return (
          <Line
            key={f}
            points={[
              new THREE.Vector3(gx + Math.cos(a) * gr * 0.85, gy + Math.sin(a) * gr * 0.85, 0.5),
              new THREE.Vector3(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr, 0.5),
            ]}
            color="#94a3b8"
            lineWidth={1.5}
          />
        );
      })}
      <Text position={[gx - gr * 0.8, gy - 0.18, 0.5]} fontSize={0.13} color="#94a3b8" anchorX="center">-</Text>
      <Text position={[gx, gy + gr + 0.12, 0.5]} fontSize={0.13} color="#94a3b8" anchorX="center">0</Text>
      <Text position={[gx + gr * 0.8, gy - 0.18, 0.5]} fontSize={0.13} color="#94a3b8" anchorX="center">+</Text>
      <Line points={[new THREE.Vector3(gx, gy, 0.5), new THREE.Vector3(...needleTip)]} color={emfColor} lineWidth={3} />
      <mesh position={[gx, gy, 0.5]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={emfColor} />
      </mesh>
      <Text position={[gx, gy - 0.32, 0.5]} fontSize={0.18} color={emfColor} anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"EMF = " + emf.toFixed(2) + " V"}
      </Text>

      {/* Motion state */}
      <Text position={[(ballX + coilX) / 2, coilY - 0.9, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">
        {Math.abs(dx) < 0.3 ? "Inside coil" : ballX < coilX ? "Approaching" : "Leaving"}
      </Text>
    </group>
  );
});

export default FaradayCoil;
