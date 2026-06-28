"use strict";
const electron = require("electron");
const path = require("path");
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
  mainWindow.webContents.on("console-message", (_e, _level, msg) => {
    console.log("[Renderer]", msg);
  });
  mainWindow.webContents.on("did-fail-load", (_event, _code, desc, url) => {
    console.error("[FAIL-LOAD]", url, desc);
  });
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("[FINISH-LOAD] Page loaded successfully");
  });
}
function registerIPC() {
  electron.ipcMain.handle("scene:getDefault", async () => {
    const { FREE_FALL_SCENE } = await Promise.resolve().then(() => require("./index-_z3rMSPB.js"));
    return FREE_FALL_SCENE;
  });
}
electron.app.whenReady().then(() => {
  electron.app.commandLine.appendSwitch("no-sandbox");
  electron.app.commandLine.appendSwitch("disable-gpu-sandbox");
  electron.app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder");
  electron.app.commandLine.appendSwitch("disable-renderer-backgrounding");
  electron.app.commandLine.appendSwitch("ignore-gpu-blocklist");
  electron.app.setPath("userData", path.join(electron.app.getPath("temp"), "physics-lab-electron"));
  registerIPC();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
