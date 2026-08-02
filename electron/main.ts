// electron/main.ts
// ===== COMPLETE FILE =====

import { app, BrowserWindow, session } from "electron";
import { ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null = null;

const generatedImagesDir = path.join(
  app.getPath("downloads"),
  "GPT Image Studio"
);

let pendingDownloadJobId: string | null = null;

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
      preload: path.join(__dirname, "preload.mjs"),
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
    const jobId = pendingDownloadJobId;

    pendingDownloadJobId = null;

    const ext = path.extname(item.getFilename()) || ".png";

    const fileName = `${jobId ?? "image"}-${Date.now()}${ext}`;

    const filePath = path.join(generatedImagesDir, fileName);

    item.setSavePath(filePath);

    item.once("done", (_, state) => {
      win?.webContents.send("image:downloaded", {
        jobId,
        filePath: state === "completed" ? filePath : null
      });
    });
  });

  // ===============================
  // Generated Image Download
  // ===============================

  ipcMain.on("image:armDownload", (event, jobId: string) => {
    pendingDownloadJobId = jobId;

    event.returnValue = true;
  });

  // ===============================
  // Project Open
  // ===============================

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

  // ===============================
  // Save As
  // ===============================

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

  // ===============================
  // Save
  // ===============================

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