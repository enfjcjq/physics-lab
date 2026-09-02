import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
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
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    // DevTools is available via F12 / Ctrl+Shift+I; do not auto-open
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Dev: Vite dev server; Prod: built files
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    console.log("Loading dev server:", process.env.VITE_DEV_SERVER_URL);
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    console.log("Loading file:", rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  // 🔍 Diagnostic: log renderer process console & errors
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
  ipcMain.handle("scene:getDefault", async () => {
    const { FREE_FALL_SCENE } = await import("@physics-lab/shared");
    return FREE_FALL_SCENE;
  });
}

app.whenReady().then(() => {
  // GPU / sandbox switches must be inside whenReady — app is not fully initialized at module scope
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
  app.commandLine.appendSwitch("enable-features", "VaapiVideoDecoder");
  app.commandLine.appendSwitch("disable-renderer-backgrounding"); // Keep GPU awake
  app.commandLine.appendSwitch("ignore-gpu-blocklist"); // Force-enable WebGL on older GPUs

  // Stable userData location: %TEMP% gets wiped by OS cleanup and loses saved settings.
  app.setPath("userData", path.join(app.getPath("appData"), "physics-lab"));

  registerIPC();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
