"use strict";
const electron = require("electron");
const path = require("path");
electron.app.commandLine.appendSwitch("no-sandbox");
electron.app.commandLine.appendSwitch("disable-gpu-sandbox");
electron.app.setPath("userData", path.join(electron.app.getPath("temp"), "physics-lab-electron"));
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Physics Lab",
    backgroundColor: "#020617",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
    mainWindow == null ? void 0 : mainWindow.webContents.openDevTools({ mode: "bottom" });
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    console.log("Loading dev server:", process.env.VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    console.log("Loading file:", rendererPath);
    mainWindow.loadFile(rendererPath);
  }
}
function registerIPC() {
  electron.ipcMain.handle("scene:getDefault", async () => {
    const { FREE_FALL_SCENE } = await Promise.resolve().then(() => require("./index-CUK0k_9Q.js"));
    return FREE_FALL_SCENE;
  });
}
electron.app.whenReady().then(() => {
  registerIPC();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
