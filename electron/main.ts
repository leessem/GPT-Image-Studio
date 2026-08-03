// electron/main.ts
// ===== COMPLETE FILE =====

import { app, BrowserWindow, session, dialog, shell } from "electron";
import { ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

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

// ==============================
// Settings persistence
// ==============================
//
// V1.0 Settings only persists the Download Folder (the Prompt Library
// persists separately, via the renderer's own localStorage store).
// Kept as a small standalone JSON file in userData rather than
// localStorage, since the main process - not the renderer - is the one
// that needs this value (it owns the download-redirect logic below).

const settingsFilePath = path.join(app.getPath("userData"), "settings.json");

interface PersistedSettings {
  downloadFolder?: string;
  filenamePrefix?: string;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = fs.readFileSync(settingsFilePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === "object") {
      return parsed as PersistedSettings;
    }
  }
  catch {
    // no settings file yet, or it's corrupt - fall back to defaults
  }

  return {};
}

function saveSettings(settings: PersistedSettings): void {
  fs.writeFileSync(
    settingsFilePath,
    JSON.stringify(settings, null, 2),
    "utf-8"
  );
}

const persistedSettings = loadSettings();

let generatedImagesDir =
  persistedSettings.downloadFolder ??
  path.join(app.getPath("downloads"), "GPT Image Studio");

// V1.0 filename system: {Prefix}{Work Type Prefix?}{Prompt Title}.png,
// pure concatenation - the app never inserts a separator of its own.
// Only the global Prefix is user-configurable (Settings > Filename,
// default "★"); the Prompt Title is always appended automatically and
// is never editable. If a user wants an underscore between any of
// these parts, they type it themselves (in the Prefix and/or a Work
// Type's own Filename Prefix, e.g. "만삭_") - the app must never add
// one automatically, or a Prefix/Work Type Prefix that already ends in
// "_" ends up with a doubled "__" the user never asked for.
let filenamePrefix = persistedSettings.filenamePrefix ?? "★";

interface PendingDownload {
  id: string;
  baseName: string;
  workTypePrefix: string;
}

let pendingDownload: PendingDownload | null = null;

/**
 * Strips illegal Windows filename characters and surrounding
 * whitespace. Used on the Prefix, the Work Type Prefix, and the Prompt
 * Title, since all three are free user text.
 */
function sanitizeFilenamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim();
}

/**
 * "{Prefix}{Work Type Prefix?}{Prompt Title}.png" the first time that
 * exact name is saved - no numeric suffix at all. Only once a file
 * with that exact name already exists does a plain incrementing number
 * get appended directly to the base name (no separator, no zero-
 * padding): `...Title2.png`, `...Title3.png`, ... Never overwrites an
 * existing file. An empty title falls back to "Untitled" so the
 * filename can never be empty even if the Prefix is also empty.
 */
function buildAutoFilename(
  dir: string,
  baseName: string,
  workTypePrefix: string
): string {

  const safeName = sanitizeFilenamePart(baseName) || "Untitled";

  const safePrefix = sanitizeFilenamePart(filenamePrefix);

  const safeWorkTypePrefix = sanitizeFilenamePart(workTypePrefix);

  const base = `${safePrefix}${safeWorkTypePrefix}${safeName}`;

  const firstCandidate = `${base}.png`;

  if (!fs.existsSync(path.join(dir, firstCandidate))) {
    return firstCandidate;
  }

  let n = 2;

  let candidate = `${base}${n}.png`;

  while (fs.existsSync(path.join(dir, candidate))) {

    n++;

    candidate = `${base}${n}.png`;

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

    title: "GPT Image Studio",

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
      pending?.baseName ?? "Untitled",
      pending?.workTypePrefix ?? ""
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
    (event, id: string, baseName: string, workTypePrefix: string) => {
      pendingDownload = { id, baseName, workTypePrefix };

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

  // ===============================
  // Settings
  // ===============================

  ipcMain.handle("settings:getDownloadFolder", () => generatedImagesDir);

  ipcMain.handle("settings:browseDownloadFolder", async () => {
    if (!win) {
      return { success: false };
    }

    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"],
    });

    if (result.canceled || !result.filePaths[0]) {
      return { success: false, canceled: true };
    }

    const folder = result.filePaths[0];

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    generatedImagesDir = folder;

    persistedSettings.downloadFolder = folder;

    saveSettings(persistedSettings);

    return { success: true, folder };
  });

  ipcMain.handle("settings:getFilenamePrefix", () => filenamePrefix);

  ipcMain.handle("settings:setFilenamePrefix", (_, prefix: string) => {
    filenamePrefix = prefix;

    persistedSettings.filenamePrefix = prefix;

    saveSettings(persistedSettings);

    return { success: true };
  });

  ipcMain.handle("settings:openDownloadFolder", async () => {
    if (!fs.existsSync(generatedImagesDir)) {
      fs.mkdirSync(generatedImagesDir, { recursive: true });
    }

    const result = await shell.openPath(generatedImagesDir);

    return { success: result === "", error: result || null };
  });

  ipcMain.handle("settings:getAppInfo", () => {
    let gitCommit: string | null = null;

    try {
      gitCommit = execSync("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .toString()
        .trim();
    }
    catch {
      gitCommit = null;
    }

    return {
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit,
    };
  });

  // ===============================
  // Prompt Library Backup
  // ===============================

  ipcMain.handle(
    "promptLibrary:export",
    async (_, json: string) => {
      if (!win) {
        return { success: false };
      }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: "prompt-library.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(result.filePath, json, "utf-8");

      return { success: true, filePath: result.filePath };
    }
  );

  ipcMain.handle("promptLibrary:import", async () => {
    if (!win) {
      return { success: false };
    }

    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (result.canceled || !result.filePaths[0]) {
      return { success: false, canceled: true };
    }

    try {
      const raw = fs.readFileSync(result.filePaths[0], "utf-8");
      const data = JSON.parse(raw) as unknown;

      return { success: true, data };
    }
    catch {
      return {
        success: false,
        error: "Could not read or parse the selected file.",
      };
    }
  });

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