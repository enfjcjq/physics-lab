import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "../experiment.store";
import { useVisualization } from "../../../core/visualization.store";

function Axes() {
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
}

function Ground(){return<mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><planeGeometry args={[20,20]}/><meshStandardMaterial color="#1e293b"/></mesh>;}
function Grid(){return<gridHelper args={[20,20,"#334155","#1e293b"]} position={[0,0.01,0]}/>;}

function Ball(){
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
}

function Trail(){
  const t=useSimulation(s=>s.trail),pts=useMemo(()=>t.map(p=>new THREE.Vector3(p.x,p.y,p.z)),[t]);
  return pts.length<2?null:<Line points={pts} color="#FF6B6B" lineWidth={1} transparent opacity={0.5}/>;
}

function Arrow3D({o,d,len,c}:{o:[number,number,number];d:[number,number,number];len:number;c:string}){
  if(len<0.05)return null;
  const e:[number,number,number]=[o[0]+d[0]*len,o[1]+d[1]*len,o[2]+d[2]*len];
  const pts=useMemo(()=>[new THREE.Vector3(...o),new THREE.Vector3(...e)],[o,e]);
  return<group><Line points={pts} color={c} lineWidth={2}/><mesh position={e}><coneGeometry args={[0.08,0.2,8]}/><meshBasicMaterial color={c}/></mesh></group>;
}

function VelocityArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),v=useSimulation(s=>s.ballVelocity),len=Math.min(Math.abs(v)*0.2,4),d:[number,number,number]=v>=0?[0,1,0]:[0,-1,0];return<Arrow3D o={[x+0.5,y,0]} d={d} len={len} c="#3b82f6"/>;}
function AccelArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),a=useSimulation(s=>s.ballAcceleration),len=Math.min(Math.abs(a)*0.2,3),d:[number,number,number]=a>=0?[0,1,0]:[0,-1,0];return<Arrow3D o={[x-0.5,y,0]} d={d} len={len} c="#22c55e"/>;}
function ForceArrow(){const x=useSimulation(s=>s.ballX),y=useSimulation(s=>s.ballY),m=useSimulation(s=>s.mass),g=useSimulation(s=>s.gravity),len=Math.min(m*g*0.1,3);return<Arrow3D o={[x,y+0.5,0]} d={[0,-1,0]} len={len} c="#ef4444"/>;}

function HeightRuler(){const bx=useSimulation(s=>s.ballX),by=useSimulation(s=>s.ballY);if(by<=0.3)return null;const pts=useMemo(()=>[new THREE.Vector3(bx-0.5,0.2,0),new THREE.Vector3(bx-0.5,by,0)],[bx,by]);return<group><Line points={pts} color="#94a3b8" lineWidth={1} dashed transparent opacity={0.4}/><Text position={[bx-0.5,by/2,0]} fontSize={0.2} color="#94a3b8" anchorX="right">{by.toFixed(1)+"m"}</Text></group>;}

function HudLabels(){
  const bx=useSimulation(s=>s.ballX),by=useSimulation(s=>s.ballY),bv=useSimulation(s=>s.ballVelocity),ct=useSimulation(s=>s.currentTime);
  if(by<0.3)return null;
  return<group><Text position={[bx+1.2,by,0]} fontSize={0.3} color="#f8fafc" anchorX="left" outlineWidth={0.02} outlineColor="#000000">{"v = "+bv.toFixed(1)+" m/s"}</Text><Text position={[bx+1.2,by-0.4,0]} fontSize={0.25} color="#94a3b8" anchorX="left" outlineWidth={0.02} outlineColor="#000000">{"t = "+ct.toFixed(2)+" s"}</Text></group>;
}

function FormulaOverlay(){
  const bx=useSimulation(s=>s.ballX),h=useSimulation(s=>s.height),g=useSimulation(s=>s.gravity),show=useVisualization(s=>s.toggles.showFormulas);
  if(!show)return null;
  return<Text position={[bx,h+3,0]} fontSize={0.35} color="#facc15" anchorX="center" outlineWidth={0.03} outlineColor="#000000">{"h = h0 - 1/2 * g * t^2"}</Text>;
}

function Animator(){const tick=useSimulation(s=>s.tick);useFrame((_,d)=>{tick(d)});return null;}

// Smooth camera transition between phase presets
function CameraAnimator(){
  const currentPhaseId = useSimulation(s=>s.currentPhaseId);
  const phases = useSimulation(s=>s.phases);
  const scene = useSimulation(s=>s.scene);
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(8,6,8));
  const animating = useRef(false);

  useEffect(() => {
    if (!scene?.camera_script || phases.length===0) return;
    const phase = phases.find(p=>p.id===currentPhaseId);
    if (!phase?.cameraPresetId) return;
    const preset = scene.camera_script.find(c=>c.id===phase.cameraPresetId);
    if (preset) {
      targetPos.current.set(...preset.position);
      animating.current = true;
    }
  }, [currentPhaseId, phases, scene]);

  useFrame((_, delta) => {
    if (!animating.current) return;
    const f = 1 - Math.exp(-3 * delta);
    camera.position.lerp(targetPos.current, f);
    if (camera.position.distanceTo(targetPos.current) < 0.05) {
      camera.position.copy(targetPos.current);
      animating.current = false;
    }
  });

  return null;
}

export function Scene3D(){
  const viz=useVisualization(s=>s.toggles),by=useSimulation(s=>s.ballY),h=useSimulation(s=>s.height);
  const currentPhaseId=useSimulation(s=>s.currentPhaseId);
  const scene=useSimulation(s=>s.scene);
  const phases=useSimulation(s=>s.phases);
  const targetVec=useMemo(()=>{
    if(!scene?.camera_script||phases.length===0)return [0,5,0] as [number,number,number];
    const phase=phases.find(p=>p.id===currentPhaseId);
    if(!phase?.cameraPresetId)return [0,5,0] as [number,number,number];
    const preset=scene.camera_script.find(c=>c.id===phase.cameraPresetId);
    return preset?preset.target as [number,number,number]:[0,5,0] as [number,number,number];
  },[currentPhaseId,phases,scene]);
  return<Canvas camera={{position:[8,6,8],fov:55,near:0.1,far:100}} gl={{antialias:true,alpha:false,preserveDrawingBuffer:true}} style={{background:"linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)"}} onCreated={({gl})=>{gl.setClearColor(new THREE.Color("#0f172a"))}}>
    <ambientLight intensity={0.4}/>
    <directionalLight position={[10,15,5]} intensity={0.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
    <pointLight position={[0,8,0]} intensity={0.3} color="#FF6B6B"/>
    {viz.showAxes&&<Axes/>}{viz.showGrid&&<Grid/>}<Ground/><Ball/>
    {viz.showTrail&&<Trail/>}{viz.showDataLabels&&<HeightRuler/>}
    {viz.showVelocityArrow&&<VelocityArrow/>}{viz.showAccelArrow&&<AccelArrow/>}{viz.showGravityArrow&&<ForceArrow/>}
    {viz.showDataLabels&&<HudLabels/>}{viz.showFormulas&&<FormulaOverlay/>}
    <CameraAnimator/><OrbitControls enableDamping dampingFactor={0.1} target={targetVec} maxPolarAngle={Math.PI*0.8}/>
    <Animator/>
  </Canvas>;
}
