"use strict";const e=require("electron"),t={scene:{getDefault:()=>e.ipcRenderer.invoke("scene:getDefault")},platform:process.platform};e.contextBridge.exposeInMainWorld("physicsLab",t);
