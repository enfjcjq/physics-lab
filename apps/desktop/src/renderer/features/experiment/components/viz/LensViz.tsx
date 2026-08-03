import { memo, useMemo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const UP = new THREE.Vector3(0, 1, 0);

interface RaySeg {
  from: THREE.Vector3;
  to: THREE.Vector3;
  dashed?: boolean;
}

/** A ray segment with an arrowhead cone at its midpoint. */
function Ray({ seg, color }: { seg: RaySeg; color: string }) {
  const dir = useMemo(() => seg.to.clone().sub(seg.from), [seg.from, seg.to]);
  const len = dir.length();
  if (len < 1e-6) return null;
  const mid = seg.from.clone().add(dir.clone().multiplyScalar(0.55));
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
  return (
    <group>
      <Line points={[seg.from, seg.to]} color={color} lineWidth={1.5} transparent opacity={seg.dashed ? 0.35 : 0.75} dashed={seg.dashed} dashSize={0.12} gapSize={0.08} />
      {!seg.dashed && (
        <mesh position={mid} quaternion={quat}>
          <coneGeometry args={[0.05, 0.14, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

const LensViz = memo(function LensViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const scene = useSimulation((s) => s.scene);

  const sim = (scene as any)?.simulation;
  const f = sim?.params?.f ?? 2;
  const u = sim?.params?.u ?? 4;
  const lensX = sim?.params?.lens_x ?? 0;
  const objY = sim?.params?.obj_y ?? 2;

  const h = 1.2; // object height
  const objX = lensX - u;
  const atFocus = Math.abs(u - f) < 1e-6;
  const v = atFocus ? Infinity : 1 / (1 / f - 1 / u); // image distance (negative = virtual)
  const isVirtual = v < 0;
  const imgX = atFocus ? 0 : lensX + v;
  const imgH = atFocus ? 0 : (-h * v) / u; // signed image height (negative = inverted)
  const endX = Math.max(Math.abs(imgX), u, f) + 2.5;

  const P = (x: number, relY: number) => new THREE.Vector3(x, objY + relY, 0);

  // Three principal rays from the object tip O = (objX, h)
  const rays = useMemo((): RaySeg[] => {
    const segs: RaySeg[] = [];
    const O = P(objX, h);
    const y3 = (h * f) / (f - u); // lens crossing height of the through-near-focus ray (may be Infinity at u=f)

    // Ray 1: parallel to axis -> refracts through far focal point F'
    segs.push({ from: O, to: P(lensX, h) });
    const dir1 = new THREE.Vector3(f, -h, 0).normalize();
    if (!atFocus && !isVirtual) {
      segs.push({ from: P(lensX, h), to: P(imgX, imgH) }); // converges to real image tip
    } else {
      segs.push({ from: P(lensX, h), to: P(lensX, h).add(dir1.clone().multiplyScalar(endX * 1.5)) }); // diverges / parallel
      if (isVirtual) segs.push({ from: P(lensX, h), to: P(imgX, imgH), dashed: true }); // backward extension
    }

    // Ray 2: through the lens center, undeviated
    const dir2 = new THREE.Vector3(u, -h, 0).normalize();
    if (!atFocus && !isVirtual) {
      segs.push({ from: O, to: P(imgX, imgH) }); // straight through center to image tip
    } else {
      segs.push({ from: O, to: O.clone().add(dir2.clone().multiplyScalar(endX * 1.5)) });
      if (isVirtual) segs.push({ from: O, to: P(imgX, imgH), dashed: true });
    }

    // Ray 3: through near focal point F -> emerges parallel (skipped when u = f)
    if (!atFocus && Number.isFinite(y3)) {
      segs.push({ from: O, to: P(lensX, y3) });
      segs.push({ from: P(lensX, y3), to: P(lensX + endX * 1.5, y3) }); // parallel to axis
      if (isVirtual) segs.push({ from: P(lensX, y3), to: P(imgX, imgH), dashed: true });
    }
    return segs;
  }, [objX, lensX, h, f, u, v, imgX, imgH, atFocus, isVirtual, endX]);

  if (activePlugin !== "lens_optics") return null;

  const lensHalf = 1.55;
  const M = atFocus ? Infinity : Math.abs(v / u);
  const imgLabel = atFocus
    ? "Image at infinity"
    : isVirtual
      ? "Virtual image (upright, M=" + M.toFixed(1) + "x)"
      : "Real image (inverted, M=" + M.toFixed(1) + "x)";

  return (
    <group>
      {/* Optical axis */}
      <Line points={[P(objX - 1, 0), P(endX, 0)]} color="#475569" lineWidth={1} transparent opacity={0.6} />

      {/* Biconvex lens (ellipsoid silhouette) */}
      <mesh position={[lensX, objY, 0]} scale={[0.22, 1, 0.5]}>
        <sphereGeometry args={[lensHalf, 24, 24]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.3} roughness={0.1} metalness={0.1} />
      </mesh>
      <Text position={[lensX + 0.35, objY + lensHalf + 0.25, 0]} fontSize={0.2} color="#60a5fa" anchorX="left">
        {"f = " + f + " m"}
      </Text>

      {/* Focal points F / F' */}
      <mesh position={P(lensX - f, 0)}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <mesh position={P(lensX + f, 0)}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <Text position={P(lensX - f, 0.28)} fontSize={0.15} color="#f59e0b" anchorX="center">F</Text>
      <Text position={P(lensX + f, 0.28)} fontSize={0.15} color="#f59e0b" anchorX="center">F'</Text>

      {/* Object arrow */}
      <Line points={[P(objX, 0), P(objX, h)]} color="#fbbf24" lineWidth={3} />
      <mesh position={P(objX, h)}><coneGeometry args={[0.07, 0.18, 8]} /><meshBasicMaterial color="#fbbf24" /></mesh>
      <Text position={P(objX, h + 0.35)} fontSize={0.2} color="#fbbf24" anchorX="center">Object</Text>

      {/* Image arrow (real: inverted below axis; virtual: upright, same side) */}
      {!atFocus && (
        <group>
          <Line points={[P(imgX, 0), P(imgX, imgH)]} color="#22c55e" lineWidth={3} dashed={isVirtual} dashSize={0.1} gapSize={0.07} transparent opacity={isVirtual ? 0.7 : 1} />
          <mesh position={P(imgX, imgH)} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(0, Math.sign(imgH) || 1, 0))}>
            <coneGeometry args={[0.07, 0.18, 8]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={isVirtual ? 0.7 : 1} />
          </mesh>
        </group>
      )}

      {/* Principal rays */}
      {rays.map((seg, i) => (
        <Ray key={i} seg={seg} color="#fbbf24" />
      ))}

      {/* Labels */}
      <Text position={[imgX || lensX, objY + imgH + (imgH >= 0 ? 0.35 : -0.35), 0]} fontSize={0.18} color="#22c55e" anchorX="center">
        {imgLabel}
      </Text>
      <Text position={[objX / 2 + lensX / 2, objY - 0.35, 0]} fontSize={0.14} color="#94a3b8" anchorX="center">
        {"u = " + u + " m"}
      </Text>
      {!atFocus && !isVirtual && (
        <Text position={[(lensX + imgX) / 2, objY - 0.35, 0]} fontSize={0.14} color="#94a3b8" anchorX="center">
          {"v = " + v.toFixed(1) + " m"}
        </Text>
      )}
      <Text position={[lensX, objY - 2, 0]} fontSize={0.2} color="#94a3b8" anchorX="center">1/f = 1/u + 1/v</Text>
    </group>
  );
});

export default LensViz;
