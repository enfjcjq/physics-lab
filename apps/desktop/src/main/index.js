import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
// Fix Windows sandbox permission issues
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-gpu-sandbox");
// Use temp directory for cache to avoid permission errors
app.setPath("userData", path.join(app.getPath("temp"), "physics-lab-electron"));
let mainWindow = null;
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
        mainWindow?.webContents.openDevTools({ mode: "bottom" });
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    // Dev: Vite dev server; Prod: built files
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        console.log("Loading dev server:", process.env.VITE_DEV_SERVER_URL);
    }
    else {
        const rendererPath = path.join(__dirname, "../renderer/index.html");
        console.log("Loading file:", rendererPath);
        mainWindow.loadFile(rendererPath);
    }
}
function registerIPC() {
    ipcMain.handle("scene:getDefault", async () => {
        const { FREE_FALL_SCENE } = await import("@physics-lab/shared");
        return FREE_FALL_SCENE;
    });
}
app.whenReady().then(() => {
    registerIPC();
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});
//# sourceMappingURL=index.js.map