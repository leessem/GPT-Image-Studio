import { app, session, ipcMain, dialog, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
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
      sandbox: false
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
  const downloadDir = path.join(
    app.getPath("downloads"),
    "GPT Image Studio"
  );
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  session.defaultSession.on("will-download", (event, item) => {
    const fileName = Date.now() + path.extname(item.getFilename());
    item.setSavePath(path.join(downloadDir, fileName));
    item.on("done", (_, state) => {
      console.log("Download:", state);
    });
  });
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
