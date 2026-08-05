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

// TEMPORARY (V1.1.1 dev-vs-production divergence investigation - see
// WORKLOG): flip to true ONLY to rebuild the one-off "GPT Image Studio
// Debug.exe" diagnostic artifact - forces DevTools + WS-AUDIT logging
// on unconditionally, so it behaves like the real packaged app but is
// fully instrumented out of the box (no env vars to set, no terminal
// needed - just run the exe). Left false for every normal build (dev
// or the real packaged release, both unaffected by this flag either
// way - dev already forces its own diagnostics on via import.meta.env.
// DEV, and a real release must never ship with this true).
const FORCE_DEBUG_BUILD = false;

// Single flag controlling DevTools availability for both the main window
// and the ChatGPT <webview>. DevTools are never opened automatically
// regardless of this flag - when true it only makes manual opening
// (e.g. the default F12 / Ctrl+Shift+I shortcut) possible; when false
// (the default) DevTools cannot be opened at all.
const DEVTOOLS_ENABLED = process.env.DEVTOOLS_ENABLED === "true" || FORCE_DEBUG_BUILD;

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
  firstLaunchNoticeShown?: boolean;
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

// V1.0 multi-Workspace isolation: a download must always be attributed to
// the Workspace whose own <webview> guest actually triggered it - never to
// "whichever Workspace armed most recently" (a single shared variable here
// let a fast Workspace B armDownload() overwrite a slower Workspace A's
// still-pending entry, so A's real download got saved under B's name/id
// and A's own waitForDownload() timed out into a false "error" state, even
// though A's generation had actually succeeded). Keyed by workspaceId
// (the same id armDownload/waitForDownload already use), and resolved via
// each download's own triggering webContents.id, looked up in
// webviewOwners below - never by call order.
const pendingDownloads = new Map<string, PendingDownload>();

// Maps a Workspace's <webview> guest webContents.id to its owning
// workspaceId, populated by Browser.tsx right after each webview's own
// dom-ready (browser:registerWebview) and cleared when that Workspace is
// closed (browser:unregisterWebview). This is what lets `will-download`
// resolve a download back to the correct Workspace even when several
// Workspaces are generating at the same moment.
const webviewOwners = new Map<number, string>();

// TEMPORARY (V1.1 Workspace-isolation audit - see WORKLOG): logs every
// main-process event that touches the shared pendingDownloads/
// webviewOwners maps, tagged with the resolved Workspace ID (or "unknown"
// if webContents.id has no owner), the triggering webContents.id, and a
// timestamp, so a live repro's terminal output can be read back as an
// exact per-Workspace event timeline. Remove once the isolation bug is
// found and verified fixed.
//
// app.isPackaged (not the VITE_DEV_SERVER_URL check used elsewhere in
// this file for the load-URL-vs-load-file branch) is the right gate
// here specifically because it's true for BOTH `Setup.exe` and
// `Portable.exe` output, whereas VITE_DEV_SERVER_URL is only ever set
// by the `npm run dev` script - this must never log in a packaged
// build regardless of how it's launched.
//
// WS_AUDIT_FORCE is the escape hatch for force-enabling this in an
// already-packaged build (e.g. to investigate a production-only
// report) without a dev rebuild - see preload.ts for the matching
// renderer-side override. Default (env var unset) behavior is
// unchanged: packaged builds stay silent. FORCE_DEBUG_BUILD is the
// unconditional override for the one-off debug artifact (see above).
const DIAGNOSTICS_ENABLED = !app.isPackaged || process.env.WS_AUDIT_FORCE === "true" || FORCE_DEBUG_BUILD;

// A packaged Windows build runs under the GUI subsystem with no
// attached console - console.log from the main process has nowhere to
// go and is silently lost (confirmed live: redirecting stdout/stderr
// of a launched Setup/Portable .exe captures nothing, even with
// WS_AUDIT_FORCE=true). This is a logging-capture gap, unrelated to
// the Workspace bug itself - write to a file as well, so logs survive
// application exit and don't require DevTools to be open at all.
//
// PORTABLE_EXECUTABLE_DIR is set by electron-builder's portable
// launcher to the folder the actual .exe lives in (NOT the ephemeral
// temp dir it self-extracts to at runtime) - using it is what makes
// "logs/" show up next to the exe for a Portable build the same way
// it would for an installed one (app.getPath("exe")'s directory, which
// is writable under this app's per-user NSIS install).
const logsDir = process.env.PORTABLE_EXECUTABLE_DIR
  ? path.join(process.env.PORTABLE_EXECUTABLE_DIR, "logs")
  : path.join(path.dirname(app.getPath("exe")), "logs");

const wsAuditLogPath = path.join(logsDir, "ws-audit.log");

if (DIAGNOSTICS_ENABLED) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  catch {
    // best-effort - never let diagnostic logging crash the app
  }
}

function logMainEvent(
  workspaceId: string | undefined,
  event: string,
  details?: Record<string, unknown>
): void {
  if (!DIAGNOSTICS_ENABLED)
    return;

  const line = `[WS-AUDIT][main] ${new Date().toISOString()} | workspace=${workspaceId ?? "unknown"} | event=${event} ${JSON.stringify(details ?? {})}`;

  console.log(line);

  try {
    fs.appendFileSync(wsAuditLogPath, line + "\n", "utf-8");
  }
  catch {
    // best-effort - never let diagnostic logging crash the app
  }
}

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

    icon: path.join(process.env.VITE_PUBLIC, "icon.ico"),

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
  >[1] = (_event, item, webContents) => {
    const workspaceId = webviewOwners.get(webContents.id);

    const pending = workspaceId ? pendingDownloads.get(workspaceId) : undefined;

    logMainEvent(workspaceId, "Download Started", {
      webContentsId: webContents.id,
      pendingArmedFor: pending?.id ?? null,
      pendingBaseName: pending?.baseName ?? null,
    });

    if (workspaceId) {
      pendingDownloads.delete(workspaceId);
    }

    const fileName = buildAutoFilename(
      generatedImagesDir,
      pending?.baseName ?? "Untitled",
      pending?.workTypePrefix ?? ""
    );

    const filePath = path.join(generatedImagesDir, fileName);

    item.setSavePath(filePath);

    logMainEvent(workspaceId, "Save Started", {
      webContentsId: webContents.id,
      filePath,
    });

    item.once("done", (_, state) => {
      logMainEvent(workspaceId, "Save Completed", {
        webContentsId: webContents.id,
        filePath,
        state,
      });

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
      pendingDownloads.set(id, { id, baseName, workTypePrefix });

      logMainEvent(id, "Download Armed", { baseName, workTypePrefix });

      event.returnValue = true;
    }
  );

  // Registers/unregisters which Workspace owns a given <webview> guest, so
  // handleWillDownload can resolve a download back to the Workspace that
  // actually triggered it (see webviewOwners above) instead of relying on
  // arm order.
  ipcMain.on(
    "browser:registerWebview",
    (_event, workspaceId: string, webContentsId: number) => {
      webviewOwners.set(webContentsId, workspaceId);

      logMainEvent(workspaceId, "Webview Registered", { webContentsId });
    }
  );

  ipcMain.on(
    "browser:unregisterWebview",
    (_event, workspaceId: string) => {
      for (const [webContentsId, ownerId] of webviewOwners) {
        if (ownerId === workspaceId) {
          webviewOwners.delete(webContentsId);

          logMainEvent(workspaceId, "Webview Unregistered", { webContentsId });
        }
      }

      pendingDownloads.delete(workspaceId);
    }
  );

  // Forwards a renderer-side WS-AUDIT log line (already formatted by
  // src/utils/workspaceLogger.ts) into the SAME logs/ws-audit.log file
  // main-process events write to, so the two interleave into one
  // chronological timeline instead of two files to cross-reference by
  // hand - and so capturing renderer events never depends on DevTools
  // being open. event.sender.id is the IPC Sender ID (the renderer
  // webContents that sent this - the main window itself, not a
  // <webview> guest, since workspaceLogger.ts runs in the app's own
  // renderer, not inside a Workspace's ChatGPT webview).
  ipcMain.on("ws-audit:log", (event, line: string) => {
    if (!DIAGNOSTICS_ENABLED)
      return;

    console.log(line);

    try {
      fs.appendFileSync(wsAuditLogPath, `${line} | ipcSenderId=${event.sender.id}\n`, "utf-8");
    }
    catch {
      // best-effort - never let diagnostic logging crash the app
    }
  });

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

  // First Launch Notice (internal-business-use / copyright notice) -
  // must appear exactly once, ever, then never again. Persisted in the
  // same settings.json as everything else so it survives a restart.
  ipcMain.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!persistedSettings.firstLaunchNoticeShown
  );

  ipcMain.handle("settings:markFirstLaunchNoticeShown", () => {
    persistedSettings.firstLaunchNoticeShown = true;

    saveSettings(persistedSettings);

    return { success: true };
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