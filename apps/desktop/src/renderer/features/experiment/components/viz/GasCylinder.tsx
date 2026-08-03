import { memo, useMemo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

/** Deterministic pseudo-random in [0,1) from integer seeds. */
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Triangle-wave bounce of v within [min, max]. */
function bounce(v: number, min: number, max: number): number {
  const w = max - min;
  if (w <= 0) return min;
  let m = (((v - min) % (2 * w)) + 2 * w) % (2 * w);
  return m > w ? max - (m - w) : min + m;
}

const MOLECULE_COUNT = 18;

const GasCylinder = memo(function GasCylinder() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);

  const sim = (scene as any)?.simulation;
  const n = sim?.params?.n ?? 1;
  const R = sim?.params?.R ?? 8.314;
  const T = sim?.params?.T ?? 300;
  const L0 = sim?.params?.L0 ?? 4;

  // Piston kinematics — mirrors simulation.equations in ideal-gas-scene.ts
  const pistonX = L0 + 1.5 * Math.sin(0.8 * currentTime);
  const V = pistonX * 1; // A_cross = 1
  const P = (n * R * T) / V;

  const cylTop = 2.5, cylBot = 0.5, leftWallX = 0;
  const gasMidX = (leftWallX + pistonX) / 2;

  // Cylinder & piston outlines
  const cylLines = useMemo((): Array<[THREE.Vector3, THREE.Vector3]> => [
    [new THREE.Vector3(leftWallX, cylBot, -0.5), new THREE.Vector3(leftWallX, cylTop, -0.5)],
    [new THREE.Vector3(leftWallX, cylBot, 0.5), new THREE.Vector3(leftWallX, cylTop, 0.5)],
    [new THREE.Vector3(leftWallX, cylBot, -0.5), new THREE.Vector3(pistonX, cylBot, -0.5)],
    [new THREE.Vector3(leftWallX, cylTop, -0.5), new THREE.Vector3(pistonX, cylTop, -0.5)],
    [new THREE.Vector3(leftWallX, cylBot, 0.5), new THREE.Vector3(pistonX, cylBot, 0.5)],
    [new THREE.Vector3(leftWallX, cylTop, 0.5), new THREE.Vector3(pistonX, cylTop, 0.5)],
  ], [pistonX]);
  const pistonLines = useMemo((): Array<[THREE.Vector3, THREE.Vector3]> => [
    [new THREE.Vector3(pistonX, cylBot, -0.5), new THREE.Vector3(pistonX, cylTop, -0.5)],
    [new THREE.Vector3(pistonX, cylBot, 0.5), new THREE.Vector3(pistonX, cylTop, 0.5)],
    [new THREE.Vector3(pistonX, cylBot, -0.5), new THREE.Vector3(pistonX, cylBot, 0.5)],
    [new THREE.Vector3(pistonX, cylTop, -0.5), new THREE.Vector3(pistonX, cylTop, 0.5)],
  ], [pistonX]);

  // Gas molecules bouncing inside the chamber (speed scales with sqrt(T))
  const speed = Math.sqrt(T / 300) * 1.2;
  const molecules = useMemo(() => {
    return Array.from({ length: MOLECULE_COUNT }, (_, i) => ({
      x0: rnd(i, 1), y0: rnd(i, 2), z0: rnd(i, 3),
      vx: (rnd(i, 4) - 0.5) * 2, vy: (rnd(i, 5) - 0.5) * 2, vz: (rnd(i, 6) - 0.5) * 2,
    }));
  }, []);
  const molPositions = molecules.map((m): [number, number, number] => [
    bounce(m.x0 * 4 + m.vx * speed * currentTime, leftWallX + 0.15, Math.max(pistonX - 0.15, leftWallX + 0.2)),
    bounce(m.y0 * 2 + m.vy * speed * currentTime, cylBot + 0.15, cylTop - 0.15),
    bounce(m.z0 + m.vz * speed * currentTime, -0.35, 0.35),
  ]);

  // ---- P-V diagram (right of the cylinder) ----
  const Vmin = L0 - 1.5, Vmax = L0 + 1.5;
  const Pmin = (n * R * T) / Vmax, Pmax = (n * R * T) / Vmin;
  const ox = L0 + 2.4, oy = 0.6, dw = 2.6, dh = 2.2; // diagram origin & size
  const mapV = (v_: number) => ox + ((v_ - Vmin) / (Vmax - Vmin)) * dw;
  const mapP = (p_: number) => oy + ((p_ - Pmin) / (Pmax - Pmin)) * dh;

  const isotherm = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const v_ = Vmin + ((Vmax - Vmin) * i) / 40;
      pts.push(new THREE.Vector3(mapV(v_), mapP((n * R * T) / v_), 0));
    }
    return pts;
  }, [Vmin, Vmax, n, R, T]);

  // Traced state path from t=0 to now (bright segment on the isotherm)
  const trace = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = (currentTime * i) / steps;
      const v_ = L0 + 1.5 * Math.sin(0.8 * t);
      pts.push(new THREE.Vector3(mapV(v_), mapP((n * R * T) / v_), 0));
    }
    return pts;
  }, [currentTime, L0, n, R, T]);

  if (activePlugin !== "ideal_gas") return null;

  return (
    <group>
      {/* Gas volume */}
      <mesh position={[gasMidX, (cylTop + cylBot) / 2, 0]}>
        <boxGeometry args={[Math.max(pistonX - leftWallX, 0.1), cylTop - cylBot, 1]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} />
      </mesh>

      {/* Gas molecules */}
      {molPositions.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#fdba74" transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Cylinder & piston */}
      {cylLines.map((l, i) => (
        <Line key={"c" + i} points={l} color="#64748b" lineWidth={1} transparent opacity={0.6} />
      ))}
      {pistonLines.map((l, i) => (
        <Line key={"p" + i} points={l} color="#f59e0b" lineWidth={2} />
      ))}
      <Text position={[pistonX + 0.15, cylTop + 0.25, 0]} fontSize={0.16} color="#f59e0b" anchorX="left">piston</Text>

      {/* Live readouts */}
      <Text position={[gasMidX, cylTop + 0.3, 0]} fontSize={0.2} color="#f8fafc" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"V = " + V.toFixed(2) + " m\u00B3"}
      </Text>
      <Text position={[gasMidX, cylBot - 0.4, 0]} fontSize={0.2} color="#ef4444" anchorX="center" outlineWidth={0.02} outlineColor="#000000">
        {"P = " + (P / 1000).toFixed(1) + " kPa"}
      </Text>
      <Text position={[gasMidX, cylBot - 0.7, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">
        {"T = " + T + " K (isothermal)"}
      </Text>

      {/* ---- P-V diagram ---- */}
      <Text position={[ox + dw / 2, oy + dh + 0.35, 0]} fontSize={0.18} color="#e2e8f0" anchorX="center">P-V Diagram</Text>
      {/* Axes */}
      <Line points={[new THREE.Vector3(ox, oy, 0), new THREE.Vector3(ox + dw, oy, 0)]} color="#94a3b8" lineWidth={1.5} />
      <Line points={[new THREE.Vector3(ox, oy, 0), new THREE.Vector3(ox, oy + dh, 0)]} color="#94a3b8" lineWidth={1.5} />
      <Text position={[ox + dw + 0.15, oy - 0.05, 0]} fontSize={0.14} color="#94a3b8" anchorX="left">V</Text>
      <Text position={[ox - 0.12, oy + dh + 0.08, 0]} fontSize={0.14} color="#94a3b8" anchorX="right">P</Text>
      <Text position={[ox + dw, oy - 0.22, 0]} fontSize={0.12} color="#64748b" anchorX="right">{"V=" + Vmax.toFixed(1)}</Text>
      <Text position={[ox - 0.08, oy + dh, 0]} fontSize={0.12} color="#64748b" anchorX="right">{(Pmax / 1000).toFixed(0) + "k"}</Text>
      {/* Isotherm + traced path + current state */}
      <Line points={isotherm} color="#38bdf8" lineWidth={1.5} transparent opacity={0.4} />
      {trace.length > 1 && <Line points={trace} color="#f59e0b" lineWidth={3} />}
      <mesh position={[mapV(V), mapP(P), 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Text position={[ox + dw / 2, oy - 0.5, 0]} fontSize={0.16} color="#94a3b8" anchorX="center">PV = nRT (hyperbola)</Text>
    </group>
  );
});

export default GasCylinder;
