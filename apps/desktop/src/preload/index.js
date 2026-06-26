import { contextBridge, ipcRenderer } from "electron";
const api = {
    scene: {
        getDefault: () => ipcRenderer.invoke("scene:getDefault"),
    },
    platform: process.platform,
};
contextBridge.exposeInMainWorld("physicsLab", api);
//# sourceMappingURL=index.js.map