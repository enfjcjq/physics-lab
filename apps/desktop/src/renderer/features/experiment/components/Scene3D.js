import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../experiment.store";
import { useI18n } from "../../../core/i18n";
import { useVisualization } from "../../../core/visualization.store";
function Axes() {
    const pts = useMemo(() => ({
        x: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(15, 0, 0)],
        y: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 15, 0)],
        z: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 15)],
    }), []);
    return _jsxs("group", { children: [_jsx(Line, { points: pts.x, color: "#ef4444", lineWidth: 2 }), _jsx(Line, { points: pts.y, color: "#22c55e", lineWidth: 2 }), _jsx(Line, { points: pts.z, color: "#3b82f6", lineWidth: 2 }), Array.from({ length: 8 }, (_, i) => { const y = i * 2; return _jsxs("group", { children: [_jsxs("mesh", { position: [0, y, 0], children: [_jsx("boxGeometry", { args: [0.3, 0.02, 0.02] }), _jsx("meshBasicMaterial", { color: "#22c55e" })] }), _jsx(Text, { position: [-0.5, y, 0], fontSize: 0.25, color: "#4ade80", anchorX: "right", children: y + "m" })] }, y); }), _jsx(Text, { position: [15.5, 0, 0], fontSize: 0.4, color: "#ef4444", children: "X" }), _jsx(Text, { position: [0, 15.5, 0], fontSize: 0.4, color: "#22c55e", children: "Y" }), _jsx(Text, { position: [0, 0, 15.5], fontSize: 0.4, color: "#3b82f6", children: "Z" })] });
}
function Ground() { return _jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [20, 20] }), _jsx("meshStandardMaterial", { color: "#1e293b" })] }); }
function Grid() { return _jsx("gridHelper", { args: [20, 20, "#334155", "#1e293b"], position: [0, 0.01, 0] }); }
function Ball() {
    const x = useSimulation(s => s.ballX), y = useSimulation(s => s.ballY), m = useSimulation(s => s.mass), isBouncing = useSimulation(s => s.isBouncing);
    const ref = useRef(null), r = 0.15 + m * 0.05;
    const [squash, setSquash] = useState(1);
    useEffect(() => {
        if (isBouncing) {
            setSquash(0.7);
            const t = setTimeout(() => setSquash(1), 150);
            return () => clearTimeout(t);
        }
    }, [isBouncing]);
    return _jsxs("mesh", { ref: ref, position: [x, y, 0], castShadow: true, scale: [1 / squash, squash, 1 / squash], children: [_jsx("sphereGeometry", { args: [r, 32, 32] }), _jsx("meshStandardMaterial", { color: "#FF6B6B", metalness: 0.3, roughness: 0.4, emissive: isBouncing ? "#661111" : "#331111", emissiveIntensity: isBouncing ? 0.6 : 0.2 })] });
}
function Trail() {
    const t = useSimulation(s => s.trail), pts = useMemo(() => {
        if (!t || t.length === 0)
            return [];
        // Limit to 200 points max for GPU safety
        const limited = t.length > 200 ? t.slice(t.length - 200) : t;
        return limited.map(p => new THREE.Vector3(p.x, p.y, p.z));
    }, [t]);
    if (pts.length < 2)
        return null;
    return _jsx(Line, { points: pts, color: "#FF6B6B", lineWidth: 1, transparent: true, opacity: 0.5 });
}
function Arrow3D({ o, d, len, c }) {
    if (len < 0.05)
        return null;
    const e = [o[0] + d[0] * len, o[1] + d[1] * len, o[2] + d[2] * len];
    const pts = useMemo(() => [new THREE.Vector3(...o), new THREE.Vector3(...e)], [o, e]);
    return _jsxs("group", { children: [_jsx(Line, { points: pts, color: c, lineWidth: 2 }), _jsxs("mesh", { position: e, children: [_jsx("coneGeometry", { args: [0.08, 0.2, 8] }), _jsx("meshBasicMaterial", { color: c })] })] });
}
function VelocityArrow() { const x = useSimulation(s => s.ballX), y = useSimulation(s => s.ballY), v = useSimulation(s => s.ballVelocity), len = Math.min(Math.abs(v) * 0.2, 4), d = v >= 0 ? [0, 1, 0] : [0, -1, 0]; return _jsx(Arrow3D, { o: [x + 0.5, y, 0], d: d, len: len, c: "#3b82f6" }); }
function AccelArrow() { const x = useSimulation(s => s.ballX), y = useSimulation(s => s.ballY), a = useSimulation(s => s.ballAcceleration), len = Math.min(Math.abs(a) * 0.2, 3), d = a >= 0 ? [0, 1, 0] : [0, -1, 0]; return _jsx(Arrow3D, { o: [x - 0.5, y, 0], d: d, len: len, c: "#22c55e" }); }
function ForceArrow() { const x = useSimulation(s => s.ballX), y = useSimulation(s => s.ballY), m = useSimulation(s => s.mass), g = useSimulation(s => s.gravity), len = Math.min(m * g * 0.1, 3); return _jsx(Arrow3D, { o: [x, y + 0.5, 0], d: [0, -1, 0], len: len, c: "#ef4444" }); }
function HeightRuler() { const bx = useSimulation(s => s.ballX), by = useSimulation(s => s.ballY); if (by <= 0.3)
    return null; const pts = useMemo(() => [new THREE.Vector3(bx - 0.5, 0.2, 0), new THREE.Vector3(bx - 0.5, by, 0)], [bx, by]); return _jsxs("group", { children: [_jsx(Line, { points: pts, color: "#94a3b8", lineWidth: 1, dashed: true, transparent: true, opacity: 0.4 }), _jsx(Text, { position: [bx - 0.5, by / 2, 0], fontSize: 0.2, color: "#94a3b8", anchorX: "right", children: by.toFixed(1) + "m" })] }); }
function HudLabels() {
    const bx = useSimulation(s => s.ballX), by = useSimulation(s => s.ballY), bv = useSimulation(s => s.ballVelocity), ct = useSimulation(s => s.currentTime);
    if (by < 0.3)
        return null;
    return _jsxs("group", { children: [_jsx(Text, { position: [bx + 1.2, by, 0], fontSize: 0.3, color: "#f8fafc", anchorX: "left", outlineWidth: 0.02, outlineColor: "#000000", children: "v = " + bv.toFixed(1) + " m/s" }), _jsx(Text, { position: [bx + 1.2, by - 0.4, 0], fontSize: 0.25, color: "#94a3b8", anchorX: "left", outlineWidth: 0.02, outlineColor: "#000000", children: "t = " + ct.toFixed(2) + " s" })] });
}
function FormulaOverlay() {
    const bx = useSimulation(s => s.ballX), h = useSimulation(s => s.height);
    const currentPhaseId = useSimulation(s => s.currentPhaseId);
    const currentTime = useSimulation(s => s.currentTime);
    const scene = useSimulation(s => s.scene);
    const { t } = useI18n();
    const show = useVisualization(s => s.toggles.showFormulas);
    if (!show || !scene?.teacher_steps)
        return null;
    // Find the best formula to show for current phase/time
    const steps = [...scene.teacher_steps].sort((a, b) => a.order - b.order);
    // Strategy: show the formula of the step whose timeStart is closest to currentTime but not after it
    let bestStep = null;
    for (const s of steps) {
        if (s.timeStart <= currentTime && s.formulaKey) {
            bestStep = s;
        }
    }
    // If no step with formula found before current time, find the next one
    if (!bestStep) {
        for (const s of steps) {
            if (s.formulaKey) {
                bestStep = s;
                break;
            }
        }
    }
    if (!bestStep?.formulaKey)
        return null;
    // Split multi-line formulas
    const formula = t(bestStep.formulaKey);
    const lines = formula.split("\n");
    return (_jsx("group", { children: lines.map((line, i) => (_jsx(Text, { position: [bx, h + 2.5 - i * 0.5, 0], fontSize: 0.3, color: "#fbbf24", anchorX: "center", outlineWidth: 0.02, outlineColor: "#000000", children: line.trim() }, i))) }));
}
function Animator() { const tick = useSimulation(s => s.tick); useFrame((_, d) => { tick(d); }); return null; }
// Smooth camera transition between phase presets
function CameraAnimator() {
    const currentPhaseId = useSimulation(s => s.currentPhaseId);
    const phases = useSimulation(s => s.phases);
    const scene = useSimulation(s => s.scene);
    const { camera } = useThree();
    const targetPos = useRef(new THREE.Vector3(8, 6, 8));
    const animating = useRef(false);
    useEffect(() => {
        if (!scene?.camera_script || phases.length === 0)
            return;
        const phase = phases.find(p => p.id === currentPhaseId);
        if (!phase?.cameraPresetId)
            return;
        const preset = scene.camera_script.find(c => c.id === phase.cameraPresetId);
        if (preset) {
            targetPos.current.set(...preset.position);
            animating.current = true;
        }
    }, [currentPhaseId, phases, scene]);
    useFrame((_, delta) => {
        if (!animating.current)
            return;
        const f = 1 - Math.exp(-3 * delta);
        camera.position.lerp(targetPos.current, f);
        if (camera.position.distanceTo(targetPos.current) < 0.05) {
            camera.position.copy(targetPos.current);
            animating.current = false;
        }
    });
    return null;
}
function Ball2() {
    const x = useSimulation(s => s.ball2X), y = useSimulation(s => s.ball2Y), activePlugin = useSimulation(s => s.activePluginId);
    if (activePlugin !== "collision")
        return null;
    const ref = useRef(null), r = 0.25;
    return _jsxs("mesh", { ref: ref, position: [x, y, 0], castShadow: true, children: [_jsx("sphereGeometry", { args: [r, 32, 32] }), _jsx("meshStandardMaterial", { color: "#ef4444", metalness: 0.3, roughness: 0.4, emissive: "#441111", emissiveIntensity: 0.2 })] });
}
export function Scene3D() {
    const viz = useVisualization(s => s.toggles), by = useSimulation(s => s.ballY), h = useSimulation(s => s.height);
    const currentPhaseId = useSimulation(s => s.currentPhaseId);
    const scene = useSimulation(s => s.scene);
    const phases = useSimulation(s => s.phases);
    const targetVec = useMemo(() => {
        if (!scene?.camera_script || phases.length === 0)
            return [0, 5, 0];
        const phase = phases.find(p => p.id === currentPhaseId);
        if (!phase?.cameraPresetId)
            return [0, 5, 0];
        const preset = scene.camera_script.find(c => c.id === phase.cameraPresetId);
        return preset ? preset.target : [0, 5, 0];
    }, [currentPhaseId, phases, scene]);
    return _jsxs(Canvas, { camera: { position: [8, 6, 8], fov: 55, near: 0.1, far: 100 }, gl: { antialias: true, alpha: false, preserveDrawingBuffer: true }, style: { background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }, onCreated: ({ gl }) => { gl.setClearColor(new THREE.Color("#0f172a")); }, children: [_jsx("ambientLight", { intensity: 0.4 }), _jsx("directionalLight", { position: [10, 15, 5], intensity: 0.8, castShadow: true, "shadow-mapSize-width": 1024, "shadow-mapSize-height": 1024 }), _jsx("pointLight", { position: [0, 8, 0], intensity: 0.3, color: "#FF6B6B" }), viz.showAxes && _jsx(Axes, {}), viz.showGrid && _jsx(Grid, {}), _jsx(Ground, {}), _jsx(Ball, {}), viz.showTrail && _jsx(Trail, {}), _jsx(Ball2, {}), viz.showDataLabels && _jsx(HeightRuler, {}), viz.showVelocityArrow && _jsx(VelocityArrow, {}), viz.showAccelArrow && _jsx(AccelArrow, {}), viz.showGravityArrow && _jsx(ForceArrow, {}), viz.showDataLabels && _jsx(HudLabels, {}), _jsx(CameraAnimator, {}), _jsx(OrbitControls, { enableDamping: true, dampingFactor: 0.1, target: targetVec, maxPolarAngle: Math.PI * 0.8 }), _jsx(Animator, {})] });
}
//# sourceMappingURL=Scene3D.js.map