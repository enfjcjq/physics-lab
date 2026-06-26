import { contextBridge, ipcRenderer } from "electron";
import type { PhysicsScene } from "@physics-lab/shared";

const api = {
  scene: {
    getDefault: (): Promise<PhysicsScene> =>
      ipcRenderer.invoke("scene:getDefault"),
  },
  platform: process.platform,
} as const;

contextBridge.exposeInMainWorld("physicsLab", api);

export type PhysicsLabAPI = typeof api;
