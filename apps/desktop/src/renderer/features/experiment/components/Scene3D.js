import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("group", { children: [_jsx(Line, { points: points.x, color: "#ef4444", lineWidth: 2 }), _jsx(Line, { points: points.y, color: "#22c55e", lineWidth: 2 }), _jsx(Line, { points: points.z, color: "#3b82f6", lineWidth: 2 }), Array.from({ length: 8 }, (_, i) => {
                const y = i * 2;
                return (_jsx("group", { children: _jsxs("mesh", { position: [0, y, 0], children: [_jsx("boxGeometry", { args: [0.3, 0.02, 0.02] }), _jsx("meshBasicMaterial", { color: "#22c55e" })] }) }, `tick-${y}`));
            })] }));
}
// ============================================================
// Ground Plane
// ============================================================
function Ground() {
    return (_jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [20, 20] }), _jsx("meshStandardMaterial", { color: "#1e293b" })] }));
}
// Grid on ground
function Grid() {
    return (_jsx("gridHelper", { args: [20, 20, "#334155", "#1e293b"], position: [0, 0.01, 0] }));
}
// ============================================================
// Ball
// ============================================================
function Ball() {
    const ballY = useSimulation((s) => s.ballY);
    const mass = useSimulation((s) => s.mass);
    const meshRef = useRef(null);
    // Scale radius with mass for visual feedback
    const radius = 0.15 + mass * 0.05;
    return (_jsxs("mesh", { ref: meshRef, position: [0, ballY, 0], castShadow: true, children: [_jsx("sphereGeometry", { args: [radius, 32, 32] }), _jsx("meshStandardMaterial", { color: "#FF6B6B", metalness: 0.3, roughness: 0.4, emissive: "#331111", emissiveIntensity: 0.2 })] }));
}
// ============================================================
// Trail Line
// ============================================================
function Trail() {
    const trail = useSimulation((s) => s.trail);
    const lineRef = useRef(null);
    const points = useMemo(() => trail.map((p) => new THREE.Vector3(p.x, p.y, p.z)), [trail]);
    if (points.length < 2)
        return null;
    return (_jsx(Line, { ref: lineRef, points: points, color: "#FF6B6B", lineWidth: 1, transparent: true, opacity: 0.5 }));
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
    const points = useMemo(() => [
        new THREE.Vector3(0, ballY, 0),
        new THREE.Vector3(0, ballY - arrowLength, 0),
    ], [ballY, arrowLength]);
    return (_jsxs("group", { children: [_jsx(Line, { points: points, color: "#ef4444", lineWidth: 2 }), _jsxs("mesh", { position: [0, ballY - arrowLength, 0], children: [_jsx("coneGeometry", { args: [0.1, 0.25, 8] }), _jsx("meshBasicMaterial", { color: "#ef4444" })] })] }));
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
    return (_jsxs(Canvas, { camera: { position: [8, 6, 8], fov: 55, near: 0.1, far: 100 }, gl: { antialias: true, alpha: false }, style: { background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)" }, onCreated: ({ gl }) => {
            gl.setClearColor(new THREE.Color("#0f172a"));
        }, children: [_jsx("ambientLight", { intensity: 0.4 }), _jsx("directionalLight", { position: [10, 15, 5], intensity: 0.8, castShadow: true, "shadow-mapSize-width": 1024, "shadow-mapSize-height": 1024 }), _jsx("pointLight", { position: [0, 8, 0], intensity: 0.3, color: "#FF6B6B" }), viz.showAxes && _jsx(Axes, {}), viz.showGrid && _jsx(Grid, {}), _jsx(Ground, {}), _jsx(Ball, {}), viz.showTrail && _jsx(Trail, {}), viz.showGravityArrow && _jsx(ForceArrow, {}), _jsx(OrbitControls, { enableDamping: true, dampingFactor: 0.1, target: [0, 5, 0], maxPolarAngle: Math.PI * 0.8 }), _jsx(Animator, {})] }));
}
//# sourceMappingURL=Scene3D.js.map