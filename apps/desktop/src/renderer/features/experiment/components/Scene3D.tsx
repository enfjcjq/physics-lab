import { useRef, useMemo, useEffect, useState, useCallback, Component, ReactNode, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../experiment.store";
import { useVisualization } from "../../../core/visualization.store";
import { useCompare } from "../../../core/compare.store";
import { useI18n } from "../../../core/i18n";
import { useCameraControl } from "../../../core/camera-control.store";
import CoulombField from "./viz/CoulombField";
import RefractionBoundary from "./viz/RefractionBoundary";
import DopplerWavefronts from "./viz/DopplerWavefronts";
import FaradayCoil from "./viz/FaradayCoil";
import MotorViz from "./viz/MotorViz";
import GasCylinder from "./viz/GasCylinder";
import LensViz from "./viz/LensViz";
import ACGeneratorViz from "./viz/ACGeneratorViz";
import { ForceCalloutLayer, EventPulseLayer } from "./teaching/S72CanvasLayers";

// ---- Inner Error Boundary for 3D scene children ----
interface SceneErrorBoundaryState { hasError: boolean; error: string | null }
class SceneErrorBoundary extends Component<{children: ReactNode}, SceneErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Physics Lab] Scene3D inner error:", error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 2.5, -5]}>
            <boxGeometry args={[4, 2, 0.1]} />
            <meshBasicMaterial color="#7f1d1d" transparent opacity={0.8} />
          </mesh>
          <Text position={[0, 2.5, -4.9]} fontSize={0.2} color="#fca5a5" anchorX="center">
            {"Scene Error: " + (this.state.error || "unknown")}
          </Text>
        </group>
      );
    }
    return this.props.children;
  }
}

let orbitControlsRef: { target: THREE.Vector3 } | null = null;

const Axes = memo(function Axes() {
  const pts = useMemo(() => ({
    x: [new THREE.Vector3(0,0,0), new THREE.Vector3(15,0,0)],
    y: [new THREE.Vector3(0,0,0), new THREE.Vector3(0,15,0)],
    z: [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,15)],
  }), []);
  return <group>
    <Line points={pts.x} color="#ef4444" lineWidth={2}/><Line points={pts.y} color="#22c55e" lineWidth={2}/><Line points={pts.z} color="#3b82f6" lineWidth={2}/>
    {Array.from({length:8},(_,i)=>{const y=i*2;return<group key={y}><mesh position={[0,y,0]}><boxGeometry args={[0.3,0.02,0.02]}/><meshBasicMaterial color="#22c55e"/></mesh><Text position={[-0.5,y,0]} fontSize={0.25} color="#4ade80" anchorX="right">{y+"m"}</Text></group>;})}
    <Text position={[15.5,0,0]} fontSize={0.4} color="#ef4444">X</Text><Text position={[0,15.5,0]} fontSize={0.4} color="#22c55e">Y</Text><Text position={[0,0,15.5]} fontSize={0.4} color="#3b82f6">Z</Text>
  </group>;
});

const Ground = memo(function Ground() {return<mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[20,20]}/><meshStandardMaterial color="#1e293b" roughness={1} metalness={0}/></mesh>;});
const Grid = memo(function Grid(){const ref=useRef<any>(null);useEffect(()=>{const m=ref.current?.material;if(m){m.transparent=true;m.opacity=0.12;}},[ref]);return<gridHelper ref={ref} args={[20,20,"#334155","#1e293b"]} position={[0,0.01,0]}/>;});

const Ball = memo(function Ball(){
  const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),m=useSimulation(s=>s.mass),isBouncing=useSimulation(s=>s.isBouncing);
  const ref=useRef<THREE.Mesh>(null),r=0.15+m*0.05;
  const [squash,setSquash]=useState(1);
  
  useEffect(()=>{
    if(isBouncing){
      setSquash(0.7);
      const t=setTimeout(()=>setSquash(1),150);
      return ()=>clearTimeout(t);
    }
  },[isBouncing]);
  
  return<mesh ref={ref} position={[x,y,0]} castShadow scale={[1/squash,squash,1/squash]}>
    <sphereGeometry args={[r,32,32]}/>
    <meshStandardMaterial color="#FF6B6B" metalness={0.3} roughness={0.4} emissive={isBouncing?"#661111":"#331111"} emissiveIntensity={isBouncing?0.6:0.2}/>
  </mesh>;
});

const Trail = memo(function Trail(){
  const t=useSimulation(s=>s.trail),pts=useMemo(()=>{
    if (!t || t.length === 0) return [];
    const limited = t.length > 200 ? t.slice(t.length - 200) : t;
    return limited.map(p=>new THREE.Vector3(p.x,p.y,p.z));
  },[t]);
  if (pts.length < 2) return null;
  return <Line points={pts} color="#FF6B6B" lineWidth={1} transparent opacity={0.5}/>;
});

const Arrow3D = memo(function Arrow3D({o,d,len,c}:{o:[number,number,number];d:[number,number,number];len:number;c:string}){
  const e:[number,number,number]=[o[0]+d[0]*len,o[1]+d[1]*len,o[2]+d[2]*len];
  const pts=useMemo(()=>[new THREE.Vector3(...o),new THREE.Vector3(...e)],[o,e]);
  if(len<0.05)return null;
  return<group>
    {/* Glow arrow */}
    <Line points={pts} color={c} lineWidth={2} transparent opacity={0.08}/>
    {/* Core arrow */}
    <Line points={pts} color={c} lineWidth={2}/>
    <mesh position={e}>
      <coneGeometry args={[0.1,0.25,8]}/>
      <meshBasicMaterial color={c}/>
    </mesh>
  </group>;
});

function VelocityArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),v=useSimulation(s=>s.ballVelocity),len=Math.min(Math.abs(v)*0.2,4),d:[number,number,number]=v>=0?[0,1,0]:[0,-1,0];return<Arrow3D o={[x+0.5,y,0]} d={d} len={len} c="#3b82f6"/>;}
function AccelArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),a=useSimulation(s=>s.ballAcceleration),len=Math.min(Math.abs(a)*0.2,3),d:[number,number,number]=a>=0?[0,1,0]:[0,-1,0];return<Arrow3D o={[x-0.5,y,0]} d={d} len={len} c="#22c55e"/>;}
function ForceArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),m=useSimulation(s=>s.mass),g=useSimulation(s=>s.gravity),len=Math.min(m*g*0.1,3);return<Arrow3D o={[x,y+0.5,0]} d={[0,-1,0]} len={len} c="#ef4444"/>;}

function HeightRuler(){const bx=useSimulation(s=>s.ballX),by=useSimulation(s=>s.ballY);const pts=useMemo(()=>[new THREE.Vector3(bx-0.5,0.2,0),new THREE.Vector3(bx-0.5,by,0)],[bx,by]);if(by<=0.3)return null;return<group><Line points={pts} color="#94a3b8" lineWidth={1} dashed transparent opacity={0.4}/><Text position={[bx-0.5,by/2,0]} fontSize={0.2} color="#94a3b8" anchorX="right">{by.toFixed(1)+"m"}</Text></group>;}

function HudLabels(){
  const bx=useSimulation(s=>s.ballX),by=useSimulation(s=>s.ballY),bv=useSimulation(s=>s.ballVelocity),ct=useSimulation(s=>s.currentTime);
  if(by<0.3)return null;
  return<group><Text position={[bx+1.2,by,0]} fontSize={0.3} color="#f8fafc" anchorX="left" outlineWidth={0.02} outlineColor="#000000">{"v = "+bv.toFixed(1)+" m/s"}</Text><Text position={[bx+1.2,by-0.4,0]} fontSize={0.25} color="#94a3b8" anchorX="left" outlineWidth={0.02} outlineColor="#000000">{"t = "+ct.toFixed(2)+" s"}</Text></group>;
}

// FormulaOverlay removed - HTML version in CenterPanel.tsx

function Animator(){const tick=useSimulation(s=>s.tick);useFrame((_,d)=>{tick(d)});return null;}


// Impact particle burst
function ImpactParticles() {
  const isBouncing = useSimulation(s => s.isBouncing);
  const bx = useSimulation(s => s.ballX);
  const by = useSimulation(s => s.ballY);
  const [particles, setParticles] = useState<Array<{id:number; x:number; y:number; z:number; vx:number; vy:number; life:number}>>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (isBouncing) {
      const newParticles = Array.from({ length: 15 }, () => ({
        id: nextId.current++,
        x: bx, y: 0.2, z: 0,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 5 + 2,
        life: 1.0,
      }));
      setParticles(prev => [...prev, ...newParticles].slice(-30));
    }
  }, [isBouncing, bx, by]);

  useFrame((_, delta) => {
    if (particles.length === 0) return;
    setParticles(prev => prev
      .map(p => ({ ...p, x: p.x + p.vx * delta, y: p.y + p.vy * delta, vy: p.vy - 9.8 * delta, life: p.life - delta * 2 }))
      .filter(p => p.life > 0)
    );
  });

  return (
    <group>
      {particles.map(p => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={p.life * 0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Smooth camera transitions (S86 M2) + S87 camera control (teaching/free, reset view)
function CameraAnimator(){
  const currentPhaseId = useSimulation(s=>s.currentPhaseId);
  const phases = useSimulation(s=>s.phases);
  const scene = useSimulation(s=>s.scene);
  const playing = useSimulation(s=>s.playing);
  const mode = useCameraControl(s=>s.mode);
  const backNonce = useCameraControl(s=>s.backNonce);
  const resetNonce = useCameraControl(s=>s.resetNonce);
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const timeRef = useRef(0);
  const anim = useRef<{fromPos: THREE.Vector3; toPos: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; fromFov: number; toFov: number; t0: number} | null>(null);
  const prevPresetRef = useRef<string | null>(null);

  const presetForPhase = useCallback((phaseId: string) => {
    if (!scene?.camera_script || phases.length===0) return null;
    const phase = phases.find(p=>p.id===phaseId);
    if (!phase?.cameraPresetId) return null;
    return scene.camera_script.find(c=>c.id===phase.cameraPresetId) ?? null;
  }, [scene, phases]);

  const firstPreset = useMemo(() => {
    if (!scene?.camera_script || scene.camera_script.length===0) return null;
    return [...scene.camera_script].sort((a,b)=>a.time-b.time)[0];
  }, [scene]);

  const startTransition = useCallback((to: { position: [number,number,number]; target?: [number,number,number]; fov?: number; id: string }) => {
    const target = orbitControlsRef?.target ?? new THREE.Vector3(0, 2, 0);
    anim.current = {
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...to.position),
      fromTarget: target.clone(),
      toTarget: new THREE.Vector3(...(to.target ?? [0, 2, 0])),
      fromFov: cam.fov,
      toFov: to.fov ?? cam.fov,
      t0: timeRef.current,
    };
    prevPresetRef.current = to.id;
  }, [camera, cam]);

  // C5: snap to recommended teaching view on scene load
  useEffect(() => {
    if (!firstPreset) return;
    camera.position.set(...firstPreset.position);
    if (orbitControlsRef) orbitControlsRef.target.set(...(firstPreset.target ?? [0, 2, 0]));
    cam.fov = firstPreset.fov ?? cam.fov;
    cam.updateProjectionMatrix();
    prevPresetRef.current = firstPreset.id;
  }, [firstPreset, camera, cam]);

  // User drag takes over: forget the guided preset so return re-snaps cleanly
  useEffect(() => {
    if (mode === "free") prevPresetRef.current = null;
  }, [mode]);

  // Phase change -> guided transition (teaching mode only)
  useEffect(() => {
    if (mode !== "teaching") return;
    const preset = presetForPhase(currentPhaseId);
    if (!preset || preset.id === prevPresetRef.current) return;
    startTransition(preset);
  }, [currentPhaseId, mode, presetForPhase, startTransition]);

  // Back to guided view command (current phase preset)
  useEffect(() => {
    if (backNonce === 0) return;
    const preset = presetForPhase(currentPhaseId) ?? firstPreset;
    if (preset) startTransition(preset);
  }, [backNonce, currentPhaseId, presetForPhase, firstPreset, startTransition]);

  // Reset view command -> recommended teaching view (camera_script first frame)
  useEffect(() => {
    if (resetNonce === 0) return;
    const preset = firstPreset ?? presetForPhase(currentPhaseId);
    if (preset) startTransition(preset);
  }, [resetNonce, currentPhaseId, firstPreset, presetForPhase, startTransition]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (mode === "free") { anim.current = null; return; } // user priority: no script writes
    const a = anim.current;
    const MIN_DUR = 0.6;
    if (a) {
      const t = Math.min(1, (timeRef.current - a.t0) / MIN_DUR);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
      camera.position.lerpVectors(a.fromPos, a.toPos, e);
      if (orbitControlsRef) orbitControlsRef.target.lerpVectors(a.fromTarget, a.toTarget, e);
      if (Math.abs(a.fromFov - a.toFov) > 0.01) { cam.fov = a.fromFov + (a.toFov - a.fromFov) * e; cam.updateProjectionMatrix(); }
      if (t >= 1) anim.current = null;
    } else if (playing && orbitControlsRef) {
      // Idle breathing drift during narration (<2% of scene scale, gentle)
      const drift = Math.sin(timeRef.current * 0.5) * 0.06;
      orbitControlsRef.target.set(0 + drift, 2, 0 + Math.cos(timeRef.current * 0.4) * 0.05);
    }
  });
  return null;
}
const Ball2 = memo(function Ball2(){
  const x=useSimulation(s=>s.ball2X),y=useSimulation(s=>s.ball2Y),activePlugin=useSimulation(s=>s.activePluginId);
  const ref=useRef<THREE.Mesh>(null),r=0.25;
  if(activePlugin!=="collision")return null;
  return<mesh ref={ref} position={[x,y,0]} castShadow>
    <sphereGeometry args={[r,32,32]}/>
    <meshStandardMaterial color="#ef4444" metalness={0.3} roughness={0.4} emissive="#441111" emissiveIntensity={0.2}/>
  </mesh>;
});


// Ghost trajectory comparison overlay
function GhostTrails() {
  const ghostTrails = useCompare((s) => s.ghostTrails);
  if (ghostTrails.length === 0) return null;

  return (
    <group>
      {ghostTrails.map(function(ghost, gi) {
        if (ghost.points.length < 2) return null;
        const pts = ghost.points.map(function(p) { return new THREE.Vector3(p.x, p.y, p.z); });
        return (
          <Line key={gi} points={pts} color={ghost.color} lineWidth={1.5} transparent opacity={0.4} />
        );
      })}
    </group>
  );
}

// Wave visualization: multiple particles showing wave propagation
const WavePoints = memo(function WavePoints() {
  const currentTime = useSimulation((s) => s.currentTime);
  const activePlugin = useSimulation((s) => s.activePluginId);
  const scene = useSimulation((s) => s.scene);
  
  if (activePlugin !== "transverse_wave" && activePlugin !== "waves") return null;
  
  const sim = (scene as any)?.simulation;
  if (!sim) return null;
  const A = sim.params?.A ?? 1.5;
  const k = sim.params?.k ?? 1.5;
  const omega = sim.params?.omega ?? 2;
  const y0 = sim.params?.y0 ?? 2;
  
  const points: Array<[number, number, number]> = [];
  const numPoints = 20;
  const spacing = 0.5;
  
  for (let i = 0; i < numPoints; i++) {
    const x = i * spacing;
    const y = y0 + A * Math.sin(k * x - omega * currentTime);
    points.push([x, y, 0]);
  }
  
  return (
    <group>
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={i === 0 ? "#FF6B6B" : "#" + Math.floor(60 + i * 10).toString(16) + Math.floor(150 - i * 5).toString(16) + Math.floor(200 - i * 5).toString(16)} />
        </mesh>
      ))}
    </group>
  );
});

// Circuit visualization for Ohm's Law
const CircuitViz = memo(function CircuitViz() {
  const activePlugin = useSimulation((s) => s.activePluginId);
  const currentTime = useSimulation((s) => s.currentTime);
  const scene = useSimulation((s) => s.scene);
  
  if (activePlugin !== "ohms_law") return null;
  
  const sim = (scene as any)?.simulation;
  const V = sim?.params?.V ?? 12;
  const R = sim?.params?.R ?? 4;
  const I = V / R;
  
  // Circuit wire path: battery on left, resistor in middle, returning wire
  const circuitY = 2;
  const wirePoints = [
    [0, circuitY + 0.8, 0], [0.8, circuitY + 0.8, 0], // Top wire
  ];
  
  return (
    <group>
      {/* Battery symbol (left) */}
      <mesh position={[0, circuitY, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.2]} />
        <meshBasicMaterial color="#4ade80" />
      </mesh>
      <Text position={[0, circuitY - 0.8, 0]} fontSize={0.2} color="#4ade80" anchorX="center">{"V=" + V + "V"}</Text>
      
      {/* Wire lines */}
      <Line points={[new THREE.Vector3(0.3, circuitY + 0.6, 0), new THREE.Vector3(3.7, circuitY + 0.6, 0)]} color="#94a3b8" lineWidth={1} transparent opacity={0.4} />
      <Line points={[new THREE.Vector3(3.7, circuitY - 0.6, 0), new THREE.Vector3(0.3, circuitY - 0.6, 0)]} color="#94a3b8" lineWidth={1} transparent opacity={0.4} />
      
      {/* Resistor symbol (right, zigzag) */}
      <mesh position={[3.7, circuitY, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.2]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Text position={[3.7, circuitY - 0.8, 0]} fontSize={0.2} color="#f59e0b" anchorX="center">{"R=" + R + "\u03A9"}</Text>
      
      {/* Current indicator */}
      <Text position={[2, circuitY + 1.2, 0]} fontSize={0.25} color="#38bdf8" anchorX="center">{"I=" + I.toFixed(1) + "A"}</Text>
    </group>
  );
});

export const Scene3D = memo(function Scene3D() {
  const [transitioning, setTransitioning] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const activePluginId = useSimulation(s => s.activePluginId);

  const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
    // Verify WebGL context is healthy
    const gl = state.gl;
    console.log("[Physics Lab] Scene3D onCreated triggered, renderer:", gl.constructor.name);

    try {
      const ctx = gl.getContext();
      if (!ctx) {
        setCanvasError("WebGL context is null (GPU/driver issue?)");
        console.error("[Physics Lab] WebGL context is null");
        return;
      }
      if (ctx.isContextLost()) {
        setCanvasError("WebGL context lost (try restarting app)");
        console.error("[Physics Lab] WebGL context lost");
        return;
      }

      // Log GPU info for diagnostics
      const debugInfo = ctx.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        console.log("[Physics Lab] GPU:", ctx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
      console.log("[Physics Lab] WebGL version:", ctx instanceof WebGL2RenderingContext ? "WebGL 2.0" : "WebGL 1.0");
      console.log("[Physics Lab] Max texture size:", ctx.getParameter(ctx.MAX_TEXTURE_SIZE));
      console.log("[Physics Lab] Canvas size:", gl.domElement.width, "x", gl.domElement.height);

      gl.setClearColor(new THREE.Color("#0f172a"));
      console.log("[Physics Lab] Scene3D Canvas initialized successfully ✅");
    } catch (err) {
      setCanvasError(err instanceof Error ? err.message : String(err));
      console.error("[Physics Lab] handleCreated error:", err);
    }
  }, []);

  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => setTransitioning(false), 400);
    return () => clearTimeout(t);
  }, [activePluginId]);
  const viz=useVisualization(s=>s.toggles),by=useSimulation(s=>s.ballY),h=useSimulation(s=>s.height);
  const currentPhaseId=useSimulation(s=>s.currentPhaseId);
  const scene=useSimulation(s=>s.scene);
  const phases=useSimulation(s=>s.phases);
  const mode=useCameraControl((s)=>s.mode);
  const backToTeaching=useCameraControl((s)=>s.backToTeaching);
  const resetView=useCameraControl((s)=>s.resetView);
  const { t } = useI18n();
  const targetVec=useMemo(()=>{
    if(!scene?.camera_script||phases.length===0)return [0,5,0] as [number,number,number];
    const phase=phases.find(p=>p.id===currentPhaseId);
    if(!phase?.cameraPresetId)return [0,5,0] as [number,number,number];
    const preset=scene.camera_script.find(c=>c.id===phase.cameraPresetId);
    return preset?preset.target as [number,number,number]:[0,5,0] as [number,number,number];
  },[currentPhaseId,phases,scene]);

  // Fallback UI when Canvas fails to render
  if (canvasError) {
    return <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)" }}>
      <div style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ color: "#f1f5f9", fontSize: 16, marginBottom: 8 }}>3D Render Error</h3>
        <p style={{ fontSize: 12, color: "#ef4444", maxWidth: 300 }}>{canvasError}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, background: "#0ea5e9", color: "white", border: "none", cursor: "pointer", fontSize: 13 }}>Reload App</button>
      </div>
    </div>;
  }

  return <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <Canvas
      camera={{position:[8,6,8],fov:55,near:0.1,far:100}}
      gl={{antialias:true,alpha:false,preserveDrawingBuffer:true,failIfMajorPerformanceCaveat:false}}
      style={{background:"linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)"}}
      onCreated={handleCreated}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.55}/>
      <directionalLight position={[10,15,5]} intensity={0.85} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.0002}/>
      <pointLight position={[0,8,0]} intensity={0.35} color="#FF6B6B"/>
      <SceneErrorBoundary>
        {viz.showAxes&&<Axes/>}{viz.showGrid&&<Grid/>}<Ground/><Ball/>
        {viz.showTrail&&<Trail/>}
        <GhostTrails/><Ball2/>{viz.showDataLabels&&<HeightRuler/>}
        {viz.showVelocityArrow&&<VelocityArrow/>}{viz.showAccelArrow&&<AccelArrow/>}{viz.showGravityArrow&&<ForceArrow/>}
        <ForceCalloutLayer /><EventPulseLayer />
        {viz.showDataLabels&&<HudLabels/>}
        <WavePoints/><CircuitViz/><CoulombField/><RefractionBoundary/><DopplerWavefronts/><FaradayCoil/><MotorViz/><GasCylinder/><LensViz/><ACGeneratorViz/>
        <CameraAnimator/><OrbitControls ref={(ctl) => { orbitControlsRef = ctl as unknown as { target: THREE.Vector3 } | null; }} enableDamping dampingFactor={0.1} target={targetVec} maxPolarAngle={Math.PI*0.8} onStart={() => useCameraControl.getState().goFree()}/>
        <Animator/>
      </SceneErrorBoundary>
    </Canvas>
    {/* S87 camera control overlay */}
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
      {mode === "free" && (
        <div className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/80 text-amber-300 border border-amber-500/20">
          {t("camera.free_mode")}
        </div>
      )}
      <div className="flex gap-1.5 pointer-events-auto">
        {mode === "free" && (
          <button onClick={backToTeaching} className="px-2 py-1 rounded-md text-[11px] bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors">
            {t("camera.back_to_teaching")}
          </button>
        )}
        <button onClick={resetView} className="px-2 py-1 rounded-md text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
          {t("camera.reset_view")}
        </button>
      </div>
    </div>
    {/* Transition overlay */}
    {transitioning && (
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.95) 100%)",
        zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 150ms ease-out"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "3px solid rgba(14,165,233,0.2)",
            borderTopColor: "#0ea5e9",
            animation: "spin 0.6s linear infinite",
            margin: "0 auto 12px"
          }} />
          <span style={{ color: "#94a3b8", fontSize: 12 }}>Loading...</span>
        </div>
      </div>
    )}
  </div>;
});


