"use strict";
const electron = require("electron");
const api = {
  scene: {
    getDefault: () => electron.ipcRenderer.invoke("scene:getDefault")
  },
  platform: process.platform
};
electron.contextBridge.exposeInMainWorld("physicsLab", api);
