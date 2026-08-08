// electron/main.ts
// ===== COMPLETE FILE =====

import { app, BrowserWindow, session, dialog, shell, webContents } from "electron";
import { ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as archiverModule from "archiver";

// @types/archiver's published shape (a set of named exports/classes)
// doesn't match archiver 5.x's actual runtime API (a callable function
// returning a stream) - confirmed directly: `typeof require("archiver")
// === "function"`. Minimal local typing for just what
// debug:exportDiagnostics below actually uses, cast once here, rather
// than fighting the mismatched published types.
interface ArchiverInstance {
  pipe(dest: NodeJS.WritableStream): void;
  directory(dirpath: string, destpath: string | false): ArchiverInstance;
  finalize(): Promise<void>;
  on(event: "error", cb: (err: Error) => void): ArchiverInstance;
  on(event: "warning", cb: (err: Error) => void): ArchiverInstance;
}

type ArchiverFactory = (
  format: "zip",
  options?: { zlib?: { level: number } }
) => ArchiverInstance;

// Confirmed live (2026-08-08) via the new export-failure capture itself:
// `import * as archiverModule` compiles (Vite/esbuild's CJS interop) to a
// merged namespace OBJECT, not the callable export - `archiverModule` was
// never actually callable at runtime despite the `as unknown as
// ArchiverFactory` cast (a compile-time-only lie). archiver's own default
// export - the real callable factory - lives at `.default`; every prior
// export attempt threw "archiver is not a function" synchronously inside
// the Promise executor, silently caught by the outer try/catch.
const archiver = (archiverModule as unknown as { default: ArchiverFactory }).default;

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
  debugMode?: boolean;
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

// Version 1.2.3 Debug Build: a permanent, user-toggleable (Settings >
// Debug Mode) forensic logging system for the Generate pipeline -
// distinct from the WS-AUDIT system above (which is dev-only/env-gated
// and explicitly temporary). Defaults false; every debug IPC handler
// below starts with `if (!debugMode) return` so leaving this off is
// truly zero new behavior, not just quieter behavior. FORCE_DEBUG_BUILD
// forces it on regardless of the persisted setting - this is what makes
// the dedicated "GPT Image Studio Debug.exe" artifact self-instrumenting
// out of the box (no Settings click needed before reproducing an issue).
// The user can still uncheck it in that build's own Settings for one
// session, but it comes back on the next launch as long as this build
// was produced with FORCE_DEBUG_BUILD = true.
let debugMode: boolean = (persistedSettings.debugMode ?? false) || FORCE_DEBUG_BUILD;

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

// Reverse of webviewOwners - workspaceId -> its <webview> guest's own
// webContents.id. Populated/cleared in lockstep with webviewOwners
// (same browser:registerWebview/unregisterWebview handlers below).
// Needed for the Debug Build's debug:screenshot handler, which captures
// a specific Workspace's own ChatGPT webview on a pipeline failure -
// webviewOwners alone only supports the opposite lookup direction
// (already-download-attribution's own need).
const workspaceWebContentsIds = new Map<string, number>();

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

// ==============================
// Version 1.2.3 Debug Build - forensic Generate-pipeline logging
// ==============================
//
// A permanent, Settings-toggleable diagnostics tool (distinct from the
// WS-AUDIT system above) - writes to app.getPath("userData")/DebugLogs/,
// which resolves correctly in dev, installed, and portable builds alike
// (unlike a path relative to the source repo or the .exe, which only
// make sense while developing). Every handler below starts with
// `if (!debugMode) return`, so leaving Debug Mode off is truly zero new
// disk I/O, not just quieter output.
//
// One self-contained folder per Generate attempt
// (DebugLogs/<sessionId>/, sessionId minted by generate.ts as a
// filesystem-safe timestamp) rather than one running log file, so a
// single reproduction's complete evidence - every log, the exact
// Prompt, before/after Workspace state, the composer's own HTML/text,
// and before/after screenshots - can be zipped and handed over as one
// unit via Export Diagnostics, with zero cross-run interleaving to
// untangle by hand.

const debugLogsDir = path.join(app.getPath("userData"), "DebugLogs");

function ensureSessionDir(sessionId: string): string {
  const dir = path.join(debugLogsDir, sessionId);

  fs.mkdirSync(dir, { recursive: true });

  return dir;
}

const DEBUG_LOG_FILES = ["pipeline", "prompt", "workspace", "dom", "error"] as const;
type DebugLogFile = (typeof DEBUG_LOG_FILES)[number];

function isDebugLogFile(value: string): value is DebugLogFile {
  return (DEBUG_LOG_FILES as readonly string[]).includes(value);
}

/**
 * Line-based unified diff via a standard LCS table - small inputs only
 * (a single Prompt's text), so an O(n*m) table is fine. Used to produce
 * prompt.log's diff.txt, the same technique already verified live this
 * session while investigating the Markdown-autoformat verification fix.
 */
function buildUnifiedDiff(original: string, inserted: string): string {
  const a = original.split("\n");
  const b = inserted.split("\n");
  const n = a.length;
  const m = b.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const lines: string[] = [
    "--- original.txt",
    "+++ inserted.txt",
    `@@ -1,${n} +1,${m} @@`,
  ];

  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push("  " + a[i]);
      i++;
      j++;
    }
    else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push("- " + a[i]);
      i++;
    }
    else {
      lines.push("+ " + b[j]);
      j++;
    }
  }

  while (i < n) {
    lines.push("- " + a[i]);
    i++;
  }

  while (j < m) {
    lines.push("+ " + b[j]);
    j++;
  }

  return lines.join("\n");
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
      workspaceWebContentsIds.set(workspaceId, webContentsId);

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

      workspaceWebContentsIds.delete(workspaceId);

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
  // Version 1.2.3 Debug Build - forensic Generate-pipeline logging
  // ===============================

  ipcMain.handle("settings:getDebugMode", () => debugMode);

  ipcMain.handle("settings:setDebugMode", (_, value: boolean) => {
    debugMode = value;

    persistedSettings.debugMode = value;

    saveSettings(persistedSettings);

    return { success: true };
  });

  ipcMain.handle("settings:getDebugLogsPath", () => debugLogsDir);

  // Single funnel for the five pre-formatted-line log files
  // (pipeline/prompt/workspace/dom/error) - mirrors the existing
  // "ws-audit:log" handler above exactly, just written into a specific
  // session's own folder instead of one running file.
  ipcMain.on("debug:log", (_event, sessionId: string, file: string, line: string) => {
    if (!debugMode || !isDebugLogFile(file))
      return;

    try {
      const dir = ensureSessionDir(sessionId);
      fs.appendFileSync(path.join(dir, `${file}.log`), line + "\n", "utf-8");
    }
    catch {
      // best-effort - never let debug logging crash the app
    }
  });

  interface PromptDataPayload {
    sessionId: string;
    workspaceId: string;
    promptName: string;
    promptId: string;
    original: string;
    substituted: string;
    composerReadback: string;
  }

  ipcMain.handle(
    "debug:savePromptData",
    (_, payload: PromptDataPayload) => {
      if (!debugMode)
        return { success: false };

      try {
        const dir = ensureSessionDir(payload.sessionId);

        fs.writeFileSync(path.join(dir, "original_prompt.txt"), payload.original, "utf-8");
        fs.writeFileSync(path.join(dir, "resolved_prompt.txt"), payload.substituted, "utf-8");
        fs.writeFileSync(path.join(dir, "composer_readback.txt"), payload.composerReadback, "utf-8");
        fs.writeFileSync(
          path.join(dir, "prompt_diff.txt"),
          buildUnifiedDiff(payload.substituted, payload.composerReadback),
          "utf-8"
        );

        const sha256 = createHash("sha256").update(payload.substituted, "utf-8").digest("hex");

        const summary = [
          `[PROMPT] ${new Date().toISOString()} | workspace=${payload.workspaceId}`,
          `  name=${payload.promptName} id=${payload.promptId}`,
          `  originalCharCount=${payload.original.length} originalLineCount=${payload.original.split("\n").length}`,
          `  substitutedCharCount=${payload.substituted.length} substitutedLineCount=${payload.substituted.split("\n").length}`,
          `  sha256=${sha256}`,
        ].join("\n");

        fs.appendFileSync(path.join(dir, "prompt.log"), summary + "\n\n", "utf-8");

        return { success: true, sha256 };
      }
      catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );

  ipcMain.handle(
    "debug:saveWorkspaceSnapshot",
    (_, sessionId: string, phase: "before" | "after", workspaceJson: string) => {
      if (!debugMode)
        return { success: false };

      try {
        const dir = ensureSessionDir(sessionId);

        fs.writeFileSync(path.join(dir, `workspace_${phase}.json`), workspaceJson, "utf-8");

        return { success: true };
      }
      catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );

  ipcMain.handle(
    "debug:saveComposerSnapshot",
    (_, sessionId: string, payload: { html: string | null; text: string | null }) => {
      if (!debugMode)
        return { success: false };

      try {
        const dir = ensureSessionDir(sessionId);

        fs.writeFileSync(path.join(dir, "composer.html"), payload.html ?? "", "utf-8");
        fs.writeFileSync(path.join(dir, "composer.txt"), payload.text ?? "", "utf-8");

        return { success: true };
      }
      catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );

  interface ErrorCapturePayload {
    sessionId: string;
    workspaceId: string;
    stage: string;
    reason: string;
    exception: string | null;
    stack: string | null;
  }

  ipcMain.handle(
    "debug:captureError",
    (_, payload: ErrorCapturePayload) => {
      if (!debugMode)
        return { success: false };

      try {
        const dir = ensureSessionDir(payload.sessionId);

        const summary = [
          `[ERROR] ${new Date().toISOString()} | workspace=${payload.workspaceId} | stage=${payload.stage}`,
          `  reason=${payload.reason}`,
          `  exception=${payload.exception ?? "(none)"}`,
          `  stack=${payload.stack ?? "(none)"}`,
        ].join("\n");

        fs.appendFileSync(path.join(dir, "error.log"), summary + "\n\n", "utf-8");

        return { success: true };
      }
      catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );

  ipcMain.handle(
    "debug:screenshot",
    async (_, sessionId: string, workspaceId: string, phase: "before_send" | "after_send") => {
      if (!debugMode)
        return { success: false };

      try {
        const webContentsId = workspaceWebContentsIds.get(workspaceId);
        const contents = webContentsId !== undefined
          ? webContents.fromId(webContentsId)
          : undefined;

        if (!contents) {
          return { success: false, error: "no webview webContents for this workspace" };
        }

        const image = await contents.capturePage();
        const dir = ensureSessionDir(sessionId);
        const filePath = path.join(dir, `screenshot_${phase}.png`);

        fs.writeFileSync(filePath, image.toPNG());

        return { success: true, filePath };
      }
      catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );

  // Second confirmed-live bug (2026-08-08), found after the fix above:
  // that fix correctly stopped *lying* about a failed export, but the
  // real underlying error (whatever archive/output actually failed
  // with) still only ever went to console.error - invisible in a
  // packaged build, and not persisted anywhere. ExportFailureDetails is
  // the one shape every failure path below reports through, so the
  // Debug Window and export-error.txt always show the same real
  // message/code/stack/path instead of a generic "Export failed".
  interface ExportFailureDetails {
    message: string;
    code: string | null;
    stack: string | null;
    path: string;
  }

  function toFailureDetails(err: unknown, failingPath: string): ExportFailureDetails {
    if (err instanceof Error) {
      return {
        message: err.message,
        code: (err as NodeJS.ErrnoException).code ?? null,
        stack: err.stack ?? null,
        path: failingPath,
      };
    }

    return { message: String(err), code: null, stack: null, path: failingPath };
  }

  // Overwritten on every failed export - one file with the most recent
  // failure, not a per-session log, since it exists purely so the exact
  // error survives being handed over even if the Debug Window's status
  // line was missed or the app was closed right after. Best-effort: a
  // problem writing this file must never mask the real export error it
  // was trying to record.
  function writeExportErrorLog(details: ExportFailureDetails): void {
    try {
      fs.mkdirSync(debugLogsDir, { recursive: true });

      const report = [
        "Timestamp:",
        new Date().toISOString(),
        "",
        "Output path:",
        details.path,
        "",
        "Error message:",
        details.message,
        "",
        "Error code:",
        details.code ?? "(none)",
        "",
        "Error stack:",
        details.stack ?? "(none)",
        "",
      ].join("\n");

      fs.writeFileSync(path.join(debugLogsDir, "export-error.txt"), report, "utf-8");
    }
    catch {
      // best-effort - never let error-logging itself crash the exporter
    }
  }

  function reportExportFailure(details: ExportFailureDetails) {
    writeExportErrorLog(details);

    return {
      success: false as const,
      error: details.message,
      code: details.code,
      stack: details.stack,
      path: details.path,
    };
  }

  // Zips one Generate attempt's entire session folder (every log, the
  // exact Prompt, before/after Workspace state, the composer's own
  // HTML/text, and before/after screenshots) into one file the user can
  // hand over as-is - "everything needed to diagnose failures", per the
  // Debug Build's own purpose, without asking them to gather individual
  // files themselves.
  ipcMain.handle("debug:exportDiagnostics", async (_, sessionId: string) => {
    if (!win) {
      return { success: false };
    }

    const sessionDir = path.join(debugLogsDir, sessionId);

    if (!fs.existsSync(sessionDir)) {
      return { success: false, error: "no debug session found for this Generate run" };
    }

    let sessionEntries: string[];

    try {
      sessionEntries = fs.readdirSync(sessionDir);
    }
    catch (err) {
      return reportExportFailure(toFailureDetails(err, sessionDir));
    }

    // Every entry in sessionDir is written by this app's own debug
    // handlers - an empty folder here means the session never logged
    // anything (e.g. Debug Mode was flipped on after the run started),
    // not a transient failure, so it's reported as its own explicit
    // "missing source" case rather than being handed to archiver, which
    // would otherwise happily produce a valid but empty (and useless)
    // zip and report success.
    if (sessionEntries.length === 0) {
      return reportExportFailure({
        message: `debug session folder has no files to export: ${sessionDir}`,
        code: null,
        stack: null,
        path: sessionDir,
      });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    const defaultName = `Diagnostics_${stamp}.zip`;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: defaultName,
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const outputPath = result.filePath;

    // A failed export can still leave a file on disk - fs.createWriteStream
    // creates it as soon as the handle opens, before a single byte (or
    // any error) arrives. Destroying the stream releases Windows' file
    // handle immediately (confirmed live: without this, a locked 0-byte
    // file can survive long enough that an immediate retry into the same
    // path fails with EBUSY), then the stray file itself is removed so a
    // failed export never leaves behind something that could pass for a
    // real one.
    const cleanupFailedOutput = (output: fs.WriteStream) => {
      try {
        output.destroy();
      }
      catch {
        // best-effort
      }

      try {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
      catch {
        // best-effort - Windows may hold the handle for a moment after
        // destroy(); nothing more to do synchronously here
      }
    };

    try {

      // Confirmed live (2026-08-07): the write stream's own "error"
      // event was never handled here, only archive's - when opening
      // result.filePath failed, the write stream still emitted a
      // "close" right after its "error", which resolved this Promise
      // as if the zip had actually been written, producing a real
      // 0-byte .zip on disk with a false "success: true". Both streams'
      // error events are now handled, and a zero-length result is
      // treated as a failure explicitly rather than trusted implicitly.
      await new Promise<void>((resolve, reject) => {

        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        let settled = false;

        const fail = (err: Error) => {
          if (settled) return;
          settled = true;
          cleanupFailedOutput(output);
          reject(err);
        };

        output.on("close", () => {
          if (settled) return;
          settled = true;
          resolve();
        });

        output.on("error", fail);
        archive.on("error", fail);

        // archiver treats a source file it can't stat (e.g. deleted or
        // permission-denied mid-archive) as a non-fatal "warning", not
        // "error" - left alone, that's a missing-source-file failure
        // that would silently produce an incomplete zip and still
        // report success. ENOENT specifically is promoted to a real
        // failure; any other warning is still logged for visibility but
        // doesn't abort the export.
        archive.on("warning", warning => {
          console.error("[debug:exportDiagnostics] archiver warning:", warning);

          if ((warning as NodeJS.ErrnoException).code === "ENOENT") {
            fail(warning);
          }
        });

        archive.pipe(output);
        archive.directory(sessionDir, false);

        archive.finalize().catch(fail);

      });

      const stat = fs.statSync(outputPath);

      if (stat.size === 0) {
        try {
          fs.unlinkSync(outputPath);
        }
        catch {
          // best-effort
        }

        return reportExportFailure({
          message: "archive completed with no error but produced a 0-byte file",
          code: null,
          stack: null,
          path: outputPath,
        });
      }

      return { success: true, filePath: outputPath };

    }
    catch (err) {
      return reportExportFailure(toFailureDetails(err, outputPath));
    }

  });

  // ===============================
  // Backup / Restore (Prompt Library + Work Type List, unified - v1.2.0)
  // ===============================

  ipcMain.handle(
    "backup:export",
    async (_, json: string) => {
      if (!win) {
        return { success: false };
      }

      const result = await dialog.showSaveDialog(win, {
        defaultPath: "GPT_Image_Studio_Backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(result.filePath, json, "utf-8");

      return { success: true, filePath: result.filePath };
    }
  );

  ipcMain.handle("backup:import", async () => {
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