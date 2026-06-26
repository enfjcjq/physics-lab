import type { PhysicsScene } from "@physics-lab/shared";

// Extend Window to include physicsLab API
declare global {
  interface Window {
    physicsLab?: {
      scene: {
        getDefault: () => Promise<PhysicsScene>;
      };
      platform: string;
    };
  }
}

export {};
