import { app, session, ipcMain, dialog, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
const generatedImagesDir = path.join(
  app.getPath("downloads"),
  "GPT Image Studio"
);
app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
function createWindow() {
  win = new BrowserWindow({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio Pro",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.openDevTools();
  win.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
app.whenReady().then(() => {
  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent()
  );
  if (!fs.existsSync(generatedImagesDir)) {
    fs.mkdirSync(generatedImagesDir, { recursive: true });
  }
  session.defaultSession.on("will-download", (_event, item) => {
    const fileName = Date.now() + path.extname(item.getFilename());
    item.setSavePath(path.join(generatedImagesDir, fileName));
    item.on("done", (_, state) => {
      console.log("Download:", state);
    });
  });
  ipcMain.handle(
    "image:save",
    async (_, dataUrl, fileName) => {
      const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl);
      if (!match) {
        return null;
      }
      const [, ext, base64] = match;
      const filePath = path.join(
        generatedImagesDir,
        `${fileName}-${Date.now()}.${ext}`
      );
      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
      return filePath;
    }
  );
  ipcMain.handle("project:open", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "GPT Image Studio Project",
          extensions: ["gisp"]
        }
      ]
    });
    if (result.canceled) {
      return null;
    }
    const filePath = result.filePaths[0];
    const text = fs.readFileSync(filePath, "utf8");
    return {
      path: filePath,
      data: JSON.parse(text)
    };
  });
  ipcMain.handle(
    "project:saveAs",
    async (_, project) => {
      const result = await dialog.showSaveDialog({
        filters: [
          {
            name: "GPT Image Studio Project",
            extensions: ["gisp"]
          }
        ]
      });
      if (result.canceled || !result.filePath) {
        return null;
      }
      fs.writeFileSync(
        result.filePath,
        JSON.stringify(project, null, 2),
        "utf8"
      );
      return result.filePath;
    }
  );
  ipcMain.handle(
    "project:save",
    async (_, filePath, project) => {
      fs.writeFileSync(
        filePath,
        JSON.stringify(project, null, 2),
        "utf8"
      );
      return true;
    }
  );
  createWindow();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
