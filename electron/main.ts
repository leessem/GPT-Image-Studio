// electron/main.ts
// ===== COMPLETE FILE =====

import { app, BrowserWindow, session } from "electron";
import { ipcMain } from "electron";
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

// Single flag controlling DevTools availability for both the main window
// and the ChatGPT <webview>. DevTools are never opened automatically
// regardless of this flag - when true it only makes manual opening
// (e.g. the default F12 / Ctrl+Shift+I shortcut) possible; when false
// (the default) DevTools cannot be opened at all.
const DEVTOOLS_ENABLED = process.env.DEVTOOLS_ENABLED === "true";

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

interface PendingDownload {
  id: string;
  baseName: string;
}

let pendingDownload: PendingDownload | null = null;

/**
 * V1.0 automatic saving: "★_{PromptTitle}_{NNN}.png", numbered
 * sequentially against whatever already exists on disk for that same
 * base name - never overwrites, never asks the user to rename anything.
 */
function buildAutoFilename(dir: string, baseName: string): string {

  const safeName =
    baseName.replace(/[\\/:*?"<>|]/g, "_").trim() || "Untitled";

  let n = 1;

  let candidate = `★_${safeName}_${String(n).padStart(3, "0")}.png`;

  while (fs.existsSync(path.join(dir, candidate))) {

    n++;

    candidate = `★_${safeName}_${String(n).padStart(3, "0")}.png`;

  }

  return candidate;

}

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// Gates DevTools availability for the ChatGPT <webview> guest the same
// way `devTools` below gates it for the main window's own webContents.
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (_event, webPreferences) => {
    webPreferences.devTools = DEVTOOLS_ENABLED;
  });
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
      sandbox: true,
      devTools: DEVTOOLS_ENABLED
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

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

  const handleWillDownload: Parameters<
    Electron.Session["on"]
  >[1] = (_event, item) => {
    const pending = pendingDownload;

    pendingDownload = null;

    const fileName = buildAutoFilename(
      generatedImagesDir,
      pending?.baseName ?? "Untitled"
    );

    const filePath = path.join(generatedImagesDir, fileName);

    item.setSavePath(filePath);

    item.once("done", (_, state) => {
      win?.webContents.send("image:downloaded", {
        id: pending?.id ?? null,
        filePath: state === "completed" ? filePath : null
      });
    });
  };

  // The ChatGPT <webview> runs on its own partitioned session
  // (partition="persist:gpt-image-studio"), which is a different
  // Session object from session.defaultSession - downloads triggered
  // inside the webview fire "will-download" on that session, not the
  // default one. Listen on both so downloads are captured regardless
  // of which session actually triggers them.
  session.defaultSession.on("will-download", handleWillDownload);

  session
    .fromPartition("persist:gpt-image-studio")
    .on("will-download", handleWillDownload);

  // ===============================
  // Generated Image Download
  // ===============================

  ipcMain.on(
    "image:armDownload",
    (event, id: string, baseName: string) => {
      pendingDownload = { id, baseName };

      event.returnValue = true;
    }
  );

  // Verifies the downloaded file actually exists on disk (a non-zero
  // size, not just the will-download "completed" event). Polls for a
  // bounded time instead of assuming the write is already visible.
  ipcMain.handle(
    "image:verifyFile",
    async (_, filePath: string) => {
      const timeoutMs = 3000;
      const pollMs = 100;
      const startedAt = Date.now();

      while (Date.now() - startedAt <= timeoutMs) {
        try {
          const stat = fs.statSync(filePath);

          if (stat.size > 0) {
            return { exists: true, size: stat.size };
          }
        }
        catch {
          // not yet present - keep polling
        }

        await new Promise(resolve => setTimeout(resolve, pollMs));
      }

      return { exists: false, size: 0 };
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