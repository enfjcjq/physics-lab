import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../experiment.store";
import { useVisualization } from "../../../core/visualization.store";

// ============================================================
// Coordinate Axes
// ============================================================
function Axes() {
  const points = useMemo(() => {
    const len = 15;
    return {
      x: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(len, 0, 0)],
      y: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, len, 0)],
      z: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, len)],
    };
  }, []);

  return (
    <group>
      {/* Axes lines */}
      <Line points={points.x} color="#ef4444" lineWidth={2} />
      <Line points={points.y} color="#22c55e" lineWidth={2} />
      <Line points={points.z} color="#3b82f6" lineWidth={2} />
      {/* Tick marks on Y axis every 2 units */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = i * 2;
        return (
          <group key={`tick-${y}`}>
            <mesh position={[0, y, 0]}>
              <boxGeometry args={[0.3, 0.02, 0.02]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================================
// Ground Plane
// ============================================================
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

// Grid on ground
function Grid() {
  return (
    <gridHelper
      args={[20, 20, "#334155", "#1e293b"]}
      position={[0, 0.01, 0]}
    />
  );
}

// ============================================================
// Ball
// ============================================================
function Ball() {
  const ballY = useSimulation((s) => s.ballY);
  const mass = useSimulation((s) => s.mass);
  const meshRef = useRef<THREE.Mesh>(null);

  // Scale radius with mass for visual feedback
  const radius = 0.15 + mass * 0.05;

  return (
    <mesh ref={meshRef} position={[0, ballY, 0]} castShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color="#FF6B6B"
        metalness={0.3}
        roughness={0.4}
        emissive="#331111"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// ============================================================
// Trail Line
// ============================================================
function Trail() {
  const trail = useSimulation((s) => s.trail);
  const lineRef = useRef<any>(null);

  const points = useMemo(
    () => trail.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    [trail]
  );

  if (points.length < 2) return null;

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#FF6B6B"
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  );
}

// ============================================================
// Force Arrow (Gravity)
// ============================================================
function ForceArrow() {
  const ballY = useSimulation((s) => s.ballY);
  const mass = useSimulation((s) => s.mass);
  const gravity = useSimulation((s) => s.gravity);

  const forceMagnitude = mass * gravity;
  // Scale arrow length to visible range (0.5 - 3 units)
  const arrowLength = Math.min(Math.max(forceMagnitude * 0.1, 0.5), 3);

  const points = useMemo(
    () => [
      new THREE.Vector3(0, ballY, 0),
      new THREE.Vector3(0, ballY - arrowLength, 0),
    ],
    [ballY, arrowLength]
  );

  return (
    <group>
      <Line points={points} color="#ef4444" lineWidth={2} />
      {/* Arrowhead */}
      <mesh position={[0, ballY - arrowLength, 0]}>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// ============================================================
// Animation Loop
// ============================================================
function Animator() {
  const tick = useSimulation((s) => s.tick);

  useFrame((_, delta) => {
    tick(delta);
  });

  return null;
}

// ============================================================
// Scene3D — Main Export
// ============================================================
export function Scene3D() {
  const viz = useVisualization((s) => s.toggles);

  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)" }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color("#0f172a"));
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#FF6B6B" />

      {/* Scene Objects */}
      {viz.showAxes && <Axes />}
      {viz.showGrid && <Grid />}
      <Ground />
      <Ball />
      {viz.showTrail && <Trail />}
      {viz.showGravityArrow && <ForceArrow />}

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        target={[0, 5, 0]}
        maxPolarAngle={Math.PI * 0.8}
      />

      {/* Animation driver */}
      <Animator />
    </Canvas>
  );
}
