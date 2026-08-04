import { useEffect, useRef, useState } from "react";
import { useSimulation } from "../../experiment.store";
import type { SpeedLevel } from "../../experiment.store";
import { useTeaching } from "../../../../core/teaching.store";
import { getPhaseCardData, getFormulaStripData } from "./teaching-layer-data";
import type { PhaseCardData } from "./teaching-layer-data";
import { PhaseCardView } from "./PhaseCard";
import { FormulaStripView } from "./FormulaStrip";

/**
 * S71 Teaching Layer (2D HTML overlay over the 3D canvas).
 * Deterministic: content = f(scene, currentTime), no playback history.
 * - PhaseCard: top-left stage card.
 * - FormulaStrip: bottom-center formula derivation strip.
 * Fallback: master switch off / reduced motion -> layer hidden entirely
 * (existing side-panel teaching remains as fallback linkage).
 */
export function TeachingLayer() {
  const scene = useSimulation((s) => s.scene);
  const currentTime = useSimulation((s) => s.currentTime);
  const currentPhaseId = useSimulation((s) => s.currentPhaseId);
  const playing = useSimulation((s) => s.playing);
  const timeScale = useSimulation((s) => s.timeScale);
  const setSpeed = useSimulation((s) => s.setSpeed);
  const showPhaseCard = useTeaching((s) => s.showPhaseCard);
  const showFormulaStrip = useTeaching((s) => s.showFormulaStrip);
  const teachingLayerEnabled = useTeaching((s) => s.teachingLayerEnabled);

  // ---- Slow-mo to 0.3x for 1.2s when a phase starts during playback ----
  const prevPhaseRef = useRef<string | null>(null);
  const prevTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const prevTime = prevTimeRef.current;
    prevTimeRef.current = currentTime;
    const phaseChanged = currentPhaseId !== prevPhaseRef.current;
    if (
      playing && phaseChanged &&
      prevPhaseRef.current !== null && currentPhaseId !== null &&
      Math.abs(currentTime - prevTime) < 0.25 // playback crossing, not a jump/scrub
    ) {
      const restore = timeScale;
      setSpeed(0.3);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSpeed((restore === 0.3 ? 1 : restore) as SpeedLevel), 1200);
    }
    prevPhaseRef.current = currentPhaseId;
  }, [currentPhaseId, currentTime, playing, timeScale, setSpeed]);

  // ---- PhaseCard with 200ms fade-out after the phase ends ----
  const activeCard = scene ? getPhaseCardData(scene, currentTime) : null;
  const [cards, setCards] = useState<{ data: PhaseCardData; leaving: boolean }[]>([]);
  useEffect(() => {
    setCards((prev) => {
      let next = prev.filter((c) => c.data.id === activeCard?.id || c.leaving);
      if (activeCard) {
        next = next.map((c) => (c.data.id !== activeCard.id && !c.leaving ? { ...c, leaving: true } : c));
        if (!next.some((c) => c.data.id === activeCard.id)) {
          next = [{ data: activeCard, leaving: false }, ...next];
        }
      } else {
        next = next.map((c) => (c.leaving ? c : { ...c, leaving: true }));
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCard?.id]);
  useEffect(() => {
    if (!cards.some((c) => c.leaving)) return;
    const timer = setTimeout(() => setCards((prev) => prev.filter((c) => !c.leaving)), 220);
    return () => clearTimeout(timer);
  }, [cards]);

  const formula = scene ? getFormulaStripData(scene, currentTime) : null;

  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!teachingLayerEnabled || reducedMotion) return null;

  return (
    <>
      {showPhaseCard && cards.map((c) => (
        <PhaseCardView key={c.data.id} data={c.data} leaving={c.leaving} />
      ))}
      {showFormulaStrip && formula && <FormulaStripView data={formula} />}
    </>
  );
}
