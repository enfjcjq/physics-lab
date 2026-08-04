import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useSimulation } from "../../experiment.store";
import { useTeaching } from "../../../../core/teaching.store";
import { getForceCalloutData, getPulsableEvents } from "./teaching-layer-data";
import type { PhysicsScene, Entity } from "@physics-lab/shared";

interface LivePos { ballX: number; ballY: number; ball2X: number; ball2Y: number; }

function resolveEntityPos(scene: PhysicsScene, entityId: string, live: LivePos): [number, number, number] {
  const entities = scene.entities;
  const primaryIdx = entities.findIndex((e) => (e.properties as { mass?: number })?.mass && (e.properties as { mass?: number })?.mass! > 0);
  const primary = primaryIdx >= 0 ? entities[primaryIdx] : undefined;
  const secondary = primaryIdx === 0 ? entities[1] : undefined;
  if (primary && entityId === primary.id) return [live.ballX, live.ballY, primary.position[2] ?? 0];
  if (secondary && entityId === secondary.id) return [live.ball2X, live.ball2Y, secondary.position[2] ?? 0];
  const e: Entity | undefined = entities.find((x) => x.id === entityId);
  return e ? e.position : [0, 2, 0];
}

function calloutOffset(type: string): [number, number, number] {
  if (type === "gravity") return [0, -0.9, 0];
  if (type === "normal") return [0, 0.9, 0];
  return [0, 1.0, 0];
}

/** ForceCallout: annotate "why this force" next to the arrow (screen-space, follows camera). */
export function ForceCalloutLayer() {
  const scene = useSimulation((s) => s.scene);
  const time = useSimulation((s) => s.currentTime);
  const show = useTeaching((s) => s.showForceCallout);
  const layerOn = useTeaching((s) => s.teachingLayerEnabled);
  const live = {
    ballX: useSimulation((s) => s.ballX),
    ballY: useSimulation((s) => s.ballY),
    ball2X: useSimulation((s) => s.ball2X),
    ball2Y: useSimulation((s) => s.ball2Y),
  };

  if (!scene || !layerOn || !show) return null;
  const { callouts, hidden } = getForceCalloutData(scene, time);

  return (
    <group>
      {callouts.map((c) => {
        const base = resolveEntityPos(scene, c.entityId, live);
        const offset = calloutOffset(c.label.toLowerCase().includes("gravity") ? "gravity" : c.label.toLowerCase().includes("normal") ? "normal" : "other");
        return (
          <Html key={c.forceId} position={[base[0] + offset[0], base[1] + offset[1], base[2] + offset[2]]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className="force-callout" style={{ borderColor: "var(--color-force, #EF4444)" }}>
              <span className="force-callout-label">{c.label}</span>
              {c.formula && <span className="force-callout-formula">{c.formula}</span>}
            </div>
          </Html>
        );
      })}
      {hidden > 0 && (
        <Html position={[0, 4, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div className="force-callout-more">+{hidden}</div>
        </Html>
      )}
    </group>
  );
}

/** EventPulse: orange expanding ring at key moments — playback-only, never on scrub. */
export function EventPulseLayer() {
  const scene = useSimulation((s) => s.scene);
  const time = useSimulation((s) => s.currentTime);
  const playing = useSimulation((s) => s.playing);
  const show = useTeaching((s) => s.showEventPulse);
  const layerOn = useTeaching((s) => s.teachingLayerEnabled);
  const ballX = useSimulation((s) => s.ballX);
  const ballY = useSimulation((s) => s.ballY);
  const [rings, setRings] = useState<{ key: number; x: number; y: number }[]>([]);
  const prevTimeRef = useRef(0);
  const keyRef = useRef(0);

  const events = useMemo(() => (scene ? getPulsableEvents(scene) : []), [scene]);

  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = time;
    if (!playing || !scene) return;
    const delta = Math.abs(time - prev);
    if (delta >= 0.25) return; // jump/scrub: no pulse
    for (const e of events) {
      if (e.time > prev && e.time <= time) {
        const k = ++keyRef.current;
        setRings((rs) => [...rs, { key: k, x: ballX, y: ballY }]);
        setTimeout(() => setRings((rs) => rs.filter((r) => r.key !== k)), 700);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, playing, events]);

  if (!scene || !layerOn || !show) return null;

  return (
    <group>
      {rings.map((r) => (
        <Html key={r.key} position={[r.x, r.y, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div className="event-pulse-ring" />
        </Html>
      ))}
    </group>
  );
}
