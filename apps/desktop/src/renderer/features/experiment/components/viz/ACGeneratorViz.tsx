import { memo, useMemo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const UP = new THREE.Vector3(0, 1, 0);

const ACGeneratorViz = memo(function ACGeneratorViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  const sim = (scene as any)?.simulation;
  const N = sim?.params?.N ?? 10;
  const BField = sim?.params?.B ?? 1;
  const A = sim?.params?.A ?? 0.05;
  const omega = sim?.params?.omega ?? Math.PI;
  const r = sim?.params?.r ?? 2;

  // Uniform rotation (mirrors simulation.equations in ac-generator-scene.ts)
  const theta = omega * currentTime;
  const emf = N * BField * A * omega * Math.sin(theta);
  const emfPeak = N * BField * A * omega;

  const cy = 2; // coil axis height
  const hh = 0.8; // coil half-height
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Rectangular coil rotating about the Y axis
  const c1 = new THREE.Vector3(r * cos, cy + hh, r * sin);
  const c2 = new THREE.Vector3(r * cos, cy - hh, r * sin);
  const c3 = new THREE.Vector3(-r * cos, cy - hh, -r * sin);
  const c4 = new THREE.Vector3(-r * cos, cy + hh, -r * sin);
  const coilLoop = [c1, c2, c3, c4, c1];

  // Slip rings: two COMPLETE rings (unlike the motor's split commutator),
  // one per coil terminal, rotating with the coil — AC flows out uninterrupted
  const ringY1 = cy - hh - 0.25;
  const ringY2 = cy - hh - 0.5;
  const ringR = 0.3;
  const slipRings = useMemo(() => {
    const mk = (y: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        pts.push(new THREE.Vector3(ringR * Math.cos(a), y, ringR * Math.sin(a)));
      }
      return pts;
    };
    return [mk(ringY1), mk(ringY2)];
  }, []);

  // Stator field: B lines from N (z<0) to S (z>0)
  const bLines = useMemo(() => {
    const lines: Array<[THREE.Vector3, THREE.Vector3]> = [];
    for (let x = -2; x <= 2; x += 1) {
      lines.push([new THREE.Vector3(x, cy, -2.75), new THREE.Vector3(x, cy, 2.75)]);
    }
    return lines;
  }, []);

  // Current direction flips with sign of EMF — this IS alternating current
  const dir = sin >= 0 ? 1 : -1;
  const sideA = new THREE.Vector3(r * cos, cy, r * sin);
  const sideB = new THREE.Vector3(-r * cos, cy, -r * sin);
  const mkArrow = (origin: THREE.Vector3, d: number) => {
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(0, d, 0));
    const tip = origin.clone().add(new THREE.Vector3(0, d * 0.45, 0));
    return { from: origin.clone().add(new THREE.Vector3(0, -d * 0.15, 0)), tip, quat };
  };
  const arrowA = mkArrow(sideA, dir);
  const arrowB = mkArrow(sideB, -dir);

  // EMF sine trace (oscilloscope view, right side): history window of emf(t)
  const waveOx = r + 1.6, waveOy = cy, waveW = 2.6, waveH = 1.0;
  const waveWindow = 4; // seconds of history shown
  const wavePts = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const t0 = Math.max(0, currentTime - waveWindow);
    const samples = 60;
    for (let i = 0; i <= samples; i++) {
      const t = t0 + ((currentTime - t0) * i) / samples;
      const e = N * BField * A * omega * Math.sin(omega * t);
      pts.push(new THREE.Vector3(
        waveOx + ((t - t0) / waveWindow) * waveW,
        waveOy + (e / (emfPeak || 1)) * waveH * 0.8,
        0
      ));
    }
    return pts;
  }, [currentTime, N, BField, A, omega, emfPeak]);
  const emfColor = emf >= 0 ? "#22c55e" : "#ef4444";

  if (activePlugin !== "ac_generator") return null;

  return (
    <group>
      {/* Stator magnets: N (z<0, red) / S (z>0, slate) */}
      <mesh position={[0, cy, -3]}>
        <boxGeometry args={[3.2, 1.8, 0.5]} />
        <meshStandardMaterial color="#991b1b" roughness={0.5} metalness={0.3} />
      </mesh>
      <Text position={[0, cy, -2.72]} fontSize={0.4} color="#fca5a5" anchorX="center">N</Text>
      <mesh position={[0, cy, 3]}>
        <boxGeometry args={[3.2, 1.8, 0.5]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>
      <Text position={[0, cy, 2.72]} fontSize={0.4} color="#cbd5e1" anchorX="center">S</Text>

      {/* B field lines N -> S */}
      {bLines.map((l, i) => (
        <group key={i}>
          <Line points={l} color="#3b82f6" lineWidth={0.8} transparent opacity={0.25} />
          <mesh position={[l[0].x, cy, 0]} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(0, 0, 1))}>
            <coneGeometry args={[0.05, 0.14, 6]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Rotating coil (driven by external mechanical work) */}
      <Line points={coilLoop} color="#f59e0b" lineWidth={3} />
      <Text position={[c4.x, c4.y + 0.3, c4.z]} fontSize={0.18} color="#fbbf24" anchorX="center">
        {"coil N=" + N}
      </Text>

      {/* Current arrows — flip direction every half turn (AC) */}
      {[arrowA, arrowB].map((a, i) => (
        <group key={i}>
          <Line points={[a.from, a.tip]} color={emfColor} lineWidth={2} />
          <mesh position={a.tip} quaternion={a.quat}>
            <coneGeometry args={[0.07, 0.18, 8]} />
            <meshBasicMaterial color={emfColor} />
          </mesh>
        </group>
      ))}

      {/* Axle */}
      <mesh position={[0, cy - 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, hh * 2 + 1.2, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Slip rings (complete rings, one per terminal) + brushes */}
      {slipRings.map((pts, i) => (
        <Line key={i} points={pts} color={i === 0 ? "#f97316" : "#fb923c"} lineWidth={4} />
      ))}
      <mesh position={[ringR + 0.12, ringY1, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.12]} />
        <meshStandardMaterial color="#78716c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[ringR + 0.12, ringY2, 0]}>
        <boxGeometry args={[0.16, 0.1, 0.12]} />
        <meshStandardMaterial color="#78716c" metalness={0.5} roughness={0.4} />
      </mesh>
      <Text position={[ringR + 0.4, ringY2 - 0.2, 0]} fontSize={0.14} color="#a8a29e" anchorX="left">slip rings + brushes</Text>

      {/* EMF sine trace (oscilloscope) */}
      <Text position={[waveOx + waveW / 2, waveOy + waveH + 0.25, 0]} fontSize={0.18} color="#e2e8f0" anchorX="center">
        {"EMF = NBA\u03C9 sin(\u03C9t)"}
      </Text>
      <Line points={[new THREE.Vector3(waveOx, waveOy, 0), new THREE.Vector3(waveOx + waveW, waveOy, 0)]} color="#475569" lineWidth={1} transparent opacity={0.7} />
      <Line points={[new THREE.Vector3(waveOx, waveOy - waveH, 0), new THREE.Vector3(waveOx, waveOy + waveH, 0)]} color="#475569" lineWidth={1} transparent opacity={0.7} />
      {wavePts.length > 1 && <Line points={wavePts} color={emfColor} lineWidth={2.5} />}
      <mesh position={[waveOx + waveW, waveOy + (emf / (emfPeak || 1)) * waveH * 0.8, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color={emfColor} />
      </mesh>
      <Text position={[waveOx + waveW / 2, waveOy - waveH - 0.3, 0]} fontSize={0.2} color={emfColor} anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"EMF = " + emf.toFixed(2) + " V  " + (emf >= 0 ? "(+)" : "(-)")}
      </Text>

      {/* Readouts */}
      <Text position={[0, cy + hh + 0.9, 0]} fontSize={0.25} color="#fbbf24" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"AC output \u00B7 \u03C9 = " + omega.toFixed(1) + " rad/s"}
      </Text>
    </group>
  );
});

export default ACGeneratorViz;
