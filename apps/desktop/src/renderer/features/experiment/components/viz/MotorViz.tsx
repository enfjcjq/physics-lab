import { memo, useMemo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const UP = new THREE.Vector3(0, 1, 0);

const MotorViz = memo(function MotorViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  const sim = (scene as any)?.simulation;
  const N = sim?.params?.N ?? 10;
  const I = sim?.params?.I ?? 2;
  const A = sim?.params?.A ?? 0.05;
  const BField = sim?.params?.B ?? 1;
  const r = sim?.params?.r ?? 2;
  const omega0 = sim?.params?.omega0 ?? 0;

  // Rotation (mirrors simulation.equations in electric-motor-scene.ts)
  const alpha = (N * I * A * BField) / 1.5;
  const theta = omega0 * currentTime + 0.5 * alpha * currentTime * currentTime;
  const omega = alpha * currentTime;
  const torque = N * I * A * BField;

  const cy = 2; // rotor axis height
  const hh = 0.8; // coil half-height
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  // Rectangular coil rotating about the Y axis (loop plane contains the axis)
  const c1 = new THREE.Vector3(r * cos, cy + hh, r * sin);
  const c2 = new THREE.Vector3(r * cos, cy - hh, r * sin);
  const c3 = new THREE.Vector3(-r * cos, cy - hh, -r * sin);
  const c4 = new THREE.Vector3(-r * cos, cy + hh, -r * sin);
  const coilLoop = useMemo(() => [c1, c2, c3, c4, c1], [theta, r]);

  // Commutator: split ring on the axis below the coil, rotates with the coil
  const commY = cy - hh - 0.35;
  const commR = 0.35;
  const commArcs = useMemo(() => {
    const arcs: THREE.Vector3[][] = [];
    for (const [start, end] of [[0.1, Math.PI - 0.1], [Math.PI + 0.1, 2 * Math.PI - 0.1]] as const) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 20; i++) {
        const a = theta + start + ((end - start) * i) / 20;
        pts.push(new THREE.Vector3(commR * Math.cos(a), commY, commR * Math.sin(a)));
      }
      arcs.push(pts);
    }
    return arcs;
  }, [theta]);

  // Stator field: B lines from N (z<0) to S (z>0) through the coil
  const bLines = useMemo(() => {
    const lines: Array<[THREE.Vector3, THREE.Vector3]> = [];
    for (let x = -2; x <= 2; x += 1) {
      lines.push([new THREE.Vector3(x, cy, -2.75), new THREE.Vector3(x, cy, 2.75)]);
    }
    return lines;
  }, []);

  // Current direction on each coil side (commutator keeps spatial direction fixed)
  const sideA = new THREE.Vector3(r * cos, cy, r * sin);
  const sideB = new THREE.Vector3(-r * cos, cy, -r * sin);
  const dirA = cos >= 0 ? 1 : -1;
  const mkArrow = (origin: THREE.Vector3, dir: number) => {
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(0, dir, 0));
    const tip = origin.clone().add(new THREE.Vector3(0, dir * 0.45, 0));
    return { from: origin.clone().add(new THREE.Vector3(0, -dir * 0.15, 0)), tip, quat };
  };
  const arrowA = mkArrow(sideA, dirA);
  const arrowB = mkArrow(sideB, -dirA);

  if (activePlugin !== "electric_motor") return null;

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

      {/* Rotating coil */}
      <Line points={coilLoop} color="#f59e0b" lineWidth={3} />
      <Text position={[c4.x, c4.y + 0.3, c4.z]} fontSize={0.18} color="#fbbf24" anchorX="center">
        {"coil N=" + N}
      </Text>

      {/* Current arrows on the two long sides */}
      {[arrowA, arrowB].map((a, i) => (
        <group key={i}>
          <Line points={[a.from, a.tip]} color="#fde047" lineWidth={2} />
          <mesh position={a.tip} quaternion={a.quat}>
            <coneGeometry args={[0.07, 0.18, 8]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
        </group>
      ))}

      {/* Axle */}
      <mesh position={[0, cy - 0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, hh * 2 + 0.9, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Commutator split ring (rotates with coil) */}
      {commArcs.map((pts, i) => (
        <Line key={i} points={pts} color={i === 0 ? "#f97316" : "#ea580c"} lineWidth={4} />
      ))}

      {/* Brushes (static, touch the split ring) */}
      <mesh position={[commR + 0.12, commY, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.12]} />
        <meshStandardMaterial color="#78716c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-commR - 0.12, commY, 0]}>
        <boxGeometry args={[0.16, 0.12, 0.12]} />
        <meshStandardMaterial color="#78716c" metalness={0.5} roughness={0.4} />
      </mesh>
      <Text position={[commR + 0.35, commY - 0.25, 0]} fontSize={0.14} color="#a8a29e" anchorX="left">brush +</Text>
      <Text position={[-commR - 0.35, commY - 0.25, 0]} fontSize={0.14} color="#a8a29e" anchorX="right">brush -</Text>

      {/* Readouts */}
      <Text position={[0, cy + hh + 0.9, 0]} fontSize={0.25} color="#fbbf24" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"\u03C4 = NIAB = " + torque.toFixed(2) + " N\u00B7m"}
      </Text>
      <Text position={[r + 1.2, cy, 0]} fontSize={0.25} color="#f8fafc" anchorX="left" outlineWidth={0.02} outlineColor="#000000">
        {"\u03C9 = " + omega.toFixed(1) + " rad/s"}
      </Text>
    </group>
  );
});

export default MotorViz;
