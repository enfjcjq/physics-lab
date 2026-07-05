import { memo } from "react";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../../experiment.store";

const LensViz = memo(function LensViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const scene = useSimulation((s) => s.scene);

  if (activePlugin !== "lens_optics") return null;

  const sim = (scene as any)?.simulation;
  const f = sim?.params?.f ?? 2;
  const u = sim?.params?.u ?? 4;
  const v = 1 / (1/f - 1/u);
  const lensX = sim?.params?.lens_x ?? 0;
  const objY = sim?.params?.obj_y ?? 2;

  // Lens (vertical double-convex symbol at lensX)
  const lensTop = objY + 1.5, lensBot = objY - 1.5;

  // Object arrow
  const objX = -u;
  const objTop = objY + 1.2;
  const objectPoints: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(objX, objY, 0),
    new THREE.Vector3(objX, objTop, 0),
  ];

  // Image arrow (real, inverted, at v)
  const imgX = v;
  const imgTop = objY - 1.2 * v / u; // Magnification
  const imagePoints: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(imgX, objY, 0),
    new THREE.Vector3(imgX, imgTop, 0),
  ];

  // Rays: from object tip through lens to image
  // Ray 1: parallel to axis → through focal point
  const ray1Pts = [
    new THREE.Vector3(objX, objTop, 0),
    new THREE.Vector3(lensX, objTop, 0),
    new THREE.Vector3(imgX, imgTop, 0),
  ];

  // Ray 2: through center of lens (straight)
  const ray2Pts = [
    new THREE.Vector3(objX, objTop, 0),
    new THREE.Vector3(imgX, imgTop, 0),
  ];

  // Optical axis
  const axisPts: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(objX - 1, objY, 0),
    new THREE.Vector3(imgX + 1, objY, 0),
  ];

  // Focal points
  const f1 = [-f, objY, 0] as [number, number, number];
  const f2 = [f, objY, 0] as [number, number, number];

  return (
    <group>
      {/* Optical axis */}
      <Line points={axisPts} color="#475569" lineWidth={1} transparent opacity={0.6} />

      {/* Lens (vertical line) */}
      <Line points={[new THREE.Vector3(lensX, lensTop, 0), new THREE.Vector3(lensX, lensBot, 0)]} color="#3b82f6" lineWidth={3} />
      <Text position={[lensX + 0.2, lensTop + 0.3, 0]} fontSize={0.2} color="#60a5fa" anchorX="left">{"f=" + f + "m"}</Text>

      {/* Object arrow */}
      <Line points={objectPoints} color="#fbbf24" lineWidth={2} />
      <Text position={[objX, objTop + 0.3, 0]} fontSize={0.2} color="#fbbf24" anchorX="center">Object</Text>

      {/* Image arrow */}
      <Line points={imagePoints} color="#22c55e" lineWidth={2} />
      <Text position={[imgX, imgTop - 0.3, 0]} fontSize={0.2} color="#22c55e" anchorX="center">Image</Text>

      {/* Rays */}
      <Line points={ray1Pts} color="#fbbf24" lineWidth={1} transparent opacity={0.5} />
      <Line points={ray2Pts} color="#fbbf24" lineWidth={1} transparent opacity={0.5} />

      {/* Focal points */}
      <mesh position={f1}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <mesh position={f2}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      <Text position={[-f, objY + 0.3, 0]} fontSize={0.15} color="#f59e0b" anchorX="center">F</Text>
      <Text position={[f, objY + 0.3, 0]} fontSize={0.15} color="#f59e0b" anchorX="center">F'</Text>

      {/* Lens equation */}
      <Text position={[0, objY - 2, 0]} fontSize={0.2} color="#94a3b8" anchorX="center">1/f = 1/u + 1/v</Text>

      {/* Distances */}
      <Text position={[objX / 2, objY - 0.4, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">{"u=" + u + "m"}</Text>
      <Text position={[(lensX + imgX) / 2, objY - 0.4, 0]} fontSize={0.15} color="#94a3b8" anchorX="center">{"v=" + v.toFixed(1) + "m"}</Text>
    </group>
  );
});

export default LensViz;
