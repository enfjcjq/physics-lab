import { pluginRegistry } from "../core/plugin-registry";
import { createVirtualPlugin } from "@physics-lab/shared";

// ============================================================
// Extension point for scene-only experiments.
//
// To add a new experiment WITHOUT touching App.tsx:
//   1. Create packages/shared/src/constants/<your>-scene.ts
//   2. Export it from packages/shared/src/index.ts
//   3. Import it here and register via createVirtualPlugin
//   4. (Optional) add a custom viz component in
//      features/experiment/components/viz/ and mount in Scene3D
//
// See FARADAY_SCENE registration in App.tsx for the pattern.
// ============================================================
export function registerExtraScenes(): void {
  // Agent B: register new scenes here, e.g.
  // pluginRegistry.register(createVirtualPlugin(TRANSFORMER_SCENE as any));
}
