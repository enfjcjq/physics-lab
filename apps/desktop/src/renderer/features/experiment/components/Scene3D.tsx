import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../experiment.store";
import { useVisualization } from "../../../core/visualization.store";

// ============================================================
// Coordinate Axes with labels
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
      <Line points={points.x} color="#ef4444" lineWidth={2} />
      <Line points={points.y} color="#22c55e" lineWidth={2} />
      <Line points={points.z} color="#3b82f6" lineWidth={2} />
      {/* Y-axis ticks every 2 units */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = i * 2;
        return (
          <group key={`tick-${y}`}>
            <mesh position={[0, y, 0]}>
              <boxGeometry args={[0.3, 0.02, 0.02]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
            <Text position={[-0.5, y, 0]} fontSize={0.25} color="#4ade80" anchorX="right">
              {`${y}m`}
            </Text>
          </group>
        );
      })}
      {/* Axis labels */}
      <Text position={[15.5, 0, 0]} fontSize={0.4} color="#ef4444">X</Text>
      <Text position={[0, 15.5, 0]} fontSize={0.4} color="#22c55e">Y</Text>
      <Text position={[0, 0, 15.5]} fontSize={0.4} color="#3b82f6">Z</Text>
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

function Grid() {
  return <gridHelper args={[20, 20, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />;
}

// ============================================================
// Height ruler (vertical dashed line from ground to ball)
// ============================================================
function HeightRuler({ ballY, maxH }: { ballY: number; maxH: number }) {
  if (ballY <= 0.3) return null;
  const pts = useMemo(
    () => [new THREE.Vector3(-0.5, 0.2, 0), new THREE.Vector3(-0.5, ballY, 0)],
    [ballY]
  );
  return (
    <group>
      <Line points={pts} color="#94a3b8" lineWidth={1} dashed transparent opacity={0.4} />
      <Text position={[-0.5, ballY / 2, 0]} fontSize={0.2} color="#94a3b8" anchorX="right">
        {ballY.toFixed(1)}m
      </Text>
    </group>
  );
}

// ============================================================
// Ball
// ============================================================
function Ball() {
  const ballY = useSimulation((s) => s.ballY);
  const mass = useSimulation((s) => s.mass);
  const meshRef = useRef<THREE.Mesh>(null);
  const radius = 0.15 + mass * 0.05;

  return (
    <mesh ref={meshRef} position={[0, ballY, 0]} castShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color="#FF6B6B" metalness={0.3} roughness={0.4} emissive="#331111" emissiveIntensity={0.2} />
    </mesh>
  );
}

// ============================================================
// Trail Line
// ============================================================
function Trail() {
  const trail = useSimulation((s) => s.trail);
  const points = useMemo(() => trail.map((p) => new THREE.Vector3(p.x, p.y, p.z)), [trail]);
  if (points.length < 2) return null;
  return <Line points={points} color="#FF6B6B" lineWidth={1} transparent opacity={0.5} />;
}

// ============================================================
// Arrow helper
// ============================================================
function Arrow3D({
  origin,
  direction,
  length,
  color,
}: {
  origin: [number, number, number];
  direction: [number, number, number];
  length: number;
  color: string;
}) {
  if (length < 0.05) return null;
  const end: [number, number, number] = [
    origin[0] + direction[0] * length,
    origin[1] + direction[1] * length,
    origin[2] + direction[2] * length,
  ];
  const pts = useMemo(
    () => [new THREE.Vector3(...origin), new THREE.Vector3(...end)],
    [origin, end]
  );
  return (
    <group>
      <Line points={pts} color={color} lineWidth={2} />
      <mesh position={end}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// ============================================================
// Velocity Arrow (blue) - points in direction of motion
// ============================================================
function VelocityArrow() {
  const ballY = useSimulation((s) => s.ballY);
  const ballVelocity = useSimulation((s) => s.ballVelocity);
  const len = Math.min(Math.abs(ballVelocity) * 0.2, 4);
  const dir: [number, number, number] = ballVelocity >= 0 ? [0, 1, 0] : [0, -1, 0];
  return <Arrow3D origin={[0.5, ballY, 0]} direction={dir} length={len} color="#3b82f6" />;
}

// ============================================================
// Acceleration Arrow (green) - always points down (gravity)
// ============================================================
function AccelArrow() {
  const ballY = useSimulation((s) => s.ballY);
  const gravity = useSimulation((s) => s.gravity);
  const len = Math.min(gravity * 0.2, 3);
  return <Arrow3D origin={[-0.5, ballY, 0]} direction={[0, -1, 0]} length={len} color="#22c55e" />;
}

// ============================================================
// Force Arrow (red) - gravity force
// ============================================================
function ForceArrow() {
  const ballY = useSimulation((s) => s.ballY);
  const mass = useSimulation((s) => s.mass);
  const gravity = useSimulation((s) => s.gravity);
  const len = Math.min(mass * gravity * 0.1, 3);
  return <Arrow3D origin={[0, ballY + 0.5, 0]} direction={[0, -1, 0]} length={len} color="#ef4444" />;
}

// ============================================================
// HUD Labels in 3D space
// ============================================================
function HudLabels() {
  const ballY = useSimulation((s) => s.ballY);
  const ballVelocity = useSimulation((s) => s.ballVelocity);
  const currentTime = useSimulation((s) => s.currentTime);

  if (ballY < 0.3) return null;
  return (
    <group>
      <Text position={[1.2, ballY, 0]} fontSize={0.3} color="#f8fafc" anchorX="left" outlineWidth={0.02} outlineColor="#000000">
        {`v = ${ballVelocity.toFixed(1)} m/s`}
      </Text>
      <Text position={[1.2, ballY - 0.4, 0]} fontSize={0.25} color="#94a3b8" anchorX="left" outlineWidth={0.02} outlineColor="#000000">
        {`t = ${currentTime.toFixed(2)} s`}
      </Text>
    </group>
  );
}

// ============================================================
// Dynamic formula display in 3D
// ============================================================
function FormulaOverlay() {
  const height = useSimulation((s) => s.height);
  const gravity = useSimulation((s) => s.gravity);
  const viz = useVisualization((s) => s.toggles);
  if (!viz.showFormulas) return null;
  return (
    <Text position={[0, height + 3, 0]} fontSize={0.35} color="#facc15" anchorX="center" outlineWidth={0.03} outlineColor="#000000">
      {`h = h0 - 1/2 * g * t^2`}
    </Text>
  );
}

// ============================================================
// Animation Loop - memoized to prevent re-renders
// ============================================================
function Animator() {
  const tick = useSimulation((s) => s.tick);
  useFrame((_, delta) => { tick(delta); });
  return null;
}

// ============================================================
// Scene3D - Main Export
// ============================================================
export function Scene3D() {
  const viz = useVisualization((s) => s.toggles);
  const ballY = useSimulation((s) => s.ballY);
  const height = useSimulation((s) => s.height);

  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 55, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)" }}
      onCreated={({ gl }) => { gl.setClearColor(new THREE.Color("#0f172a")); }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#FF6B6B" />

      {/* Scene objects */}
      {viz.showAxes && <Axes />}
      {viz.showGrid && <Grid />}
      <Ground />
      <Ball />
      {viz.showTrail && <Trail />}
      {viz.showDataLabels && <HeightRuler ballY={ballY} maxH={height} />}
      {viz.showVelocityArrow && <VelocityArrow />}
      {viz.showAccelArrow && <AccelArrow />}
      {viz.showGravityArrow && <ForceArrow />}
      {viz.showDataLabels && <HudLabels />}
      {viz.showFormulas && <FormulaOverlay />}

      {/* Controls */}
      <OrbitControls enableDamping dampingFactor={0.1} target={[0, 5, 0]} maxPolarAngle={Math.PI * 0.8} />

      {/* Animation driver */}
      <Animator />
    </Canvas>
  );
}
