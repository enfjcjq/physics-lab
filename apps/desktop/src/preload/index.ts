import { contextBridge, ipcRenderer } from "electron";
import type { PhysicsScene } from "@physics-lab/shared";

const api = {
  scene: {
    getDefault: (): Promise<PhysicsScene> =>
      ipcRenderer.invoke("scene:getDefault"),
  },
  settings: {
    read: (): Promise<Record<string, unknown> | null> =>
      ipcRenderer.invoke("settings:read"),
    write: (value: Record<string, unknown>): Promise<boolean> =>
      ipcRenderer.invoke("settings:write", value),
  },
  platform: process.platform,
} as const;

contextBridge.exposeInMainWorld("physicsLab", api);

export type PhysicsLabAPI = typeof api;
