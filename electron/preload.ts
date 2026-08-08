// electron/preload.ts
// ===== COMPLETE FILE =====

import { ipcRenderer, contextBridge } from "electron";

// TEMPORARY (V1.1.1 dev-vs-production divergence investigation - see
// WORKLOG): WS-AUDIT diagnostic logging is dev-only by default
// (src/utils/workspaceLogger.ts checks import.meta.env.DEV, which Vite
// bakes to a literal `false` in a production build - the logging calls
// don't even exist in the shipped bundle). This env var is the escape
// hatch for force-enabling it in an already-packaged build without a
// dev rebuild, since the renderer has no other way to see
// process.env at runtime. Remove alongside the rest of WS-AUDIT once
// the isolation bug is fully closed.
//
// FORCE_DEBUG_BUILD mirrors electron/main.ts's own flag of the same
// name (duplicated here, not imported, since main.ts and preload.ts
// are separate Vite entry points) - flip both to true together only to
// rebuild the one-off "GPT Image Studio Debug.exe" artifact.
const FORCE_DEBUG_BUILD = false;

contextBridge.exposeInMainWorld(
  "__WS_AUDIT_FORCE__",
  process.env.WS_AUDIT_FORCE === "true" || FORCE_DEBUG_BUILD
);

contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;

    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },

  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;

    return ipcRenderer.off(channel, ...omit);
  },

  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;

    return ipcRenderer.send(channel, ...omit);
  },

  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;

    return ipcRenderer.invoke(channel, ...omit);
  },

  // ==========================
  // Image API
  // ==========================

  image: {
    armDownload(id: string, baseName: string, workTypePrefix: string) {
      ipcRenderer.sendSync("image:armDownload", id, baseName, workTypePrefix);
    },

    waitForDownload(id: string) {
      return new Promise<string>((resolve, reject) => {
        const handler = (
          _event: Electron.IpcRendererEvent,
          payload: { id: string | null; filePath: string | null }
        ) => {
          if (payload.id !== id)
            return;

          ipcRenderer.off("image:downloaded", handler);

          if (payload.filePath) {
            resolve(payload.filePath);
          } else {
            reject(new Error("Download failed for " + id));
          }
        };

        ipcRenderer.on("image:downloaded", handler);
      });
    },

    verifyFile(filePath: string) {
      return ipcRenderer.invoke("image:verifyFile", filePath);
    }
  },

  // ==========================
  // Browser API
  // ==========================

  browser: {
    registerWebview(workspaceId: string, webContentsId: number) {
      ipcRenderer.send("browser:registerWebview", workspaceId, webContentsId);
    },

    unregisterWebview(workspaceId: string) {
      ipcRenderer.send("browser:unregisterWebview", workspaceId);
    }
  },

  // ==========================
  // Settings API
  // ==========================

  settings: {
    getDownloadFolder() {
      return ipcRenderer.invoke("settings:getDownloadFolder");
    },

    browseDownloadFolder() {
      return ipcRenderer.invoke("settings:browseDownloadFolder");
    },

    openDownloadFolder() {
      return ipcRenderer.invoke("settings:openDownloadFolder");
    },

    getFilenamePrefix() {
      return ipcRenderer.invoke("settings:getFilenamePrefix");
    },

    setFilenamePrefix(prefix: string) {
      return ipcRenderer.invoke("settings:setFilenamePrefix", prefix);
    },

    getFirstLaunchNoticeShown() {
      return ipcRenderer.invoke("settings:getFirstLaunchNoticeShown");
    },

    markFirstLaunchNoticeShown() {
      return ipcRenderer.invoke("settings:markFirstLaunchNoticeShown");
    },

    getAppInfo() {
      return ipcRenderer.invoke("settings:getAppInfo");
    },

    getDebugMode() {
      return ipcRenderer.invoke("settings:getDebugMode");
    },

    setDebugMode(enabled: boolean) {
      return ipcRenderer.invoke("settings:setDebugMode", enabled);
    },

    getDebugLogsPath() {
      return ipcRenderer.invoke("settings:getDebugLogsPath");
    }
  },

  // ==========================
  // Backup / Restore API (Prompt Library + Work Type List, unified)
  // ==========================

  backup: {
    export(json: string) {
      return ipcRenderer.invoke("backup:export", json);
    },

    import() {
      return ipcRenderer.invoke("backup:import");
    }
  },

  // ==========================
  // Debug API (Version 1.2.3 Debug Build - forensic Generate-pipeline
  // logging, gated end-to-end by Settings > Debug Mode)
  // ==========================

  debug: {
    log(sessionId: string, file: string, line: string) {
      ipcRenderer.send("debug:log", sessionId, file, line);
    },

    savePromptData(payload: {
      sessionId: string;
      workspaceId: string;
      promptName: string;
      promptId: string;
      original: string;
      substituted: string;
      composerReadback: string;
    }) {
      return ipcRenderer.invoke("debug:savePromptData", payload);
    },

    saveWorkspaceSnapshot(sessionId: string, phase: "before" | "after", workspaceJson: string) {
      return ipcRenderer.invoke("debug:saveWorkspaceSnapshot", sessionId, phase, workspaceJson);
    },

    saveComposerSnapshot(sessionId: string, payload: { html: string | null; text: string | null }) {
      return ipcRenderer.invoke("debug:saveComposerSnapshot", sessionId, payload);
    },

    captureError(payload: {
      sessionId: string;
      workspaceId: string;
      stage: string;
      reason: string;
      exception: string | null;
      stack: string | null;
    }) {
      return ipcRenderer.invoke("debug:captureError", payload);
    },

    screenshot(sessionId: string, workspaceId: string, phase: "before_send" | "after_send") {
      return ipcRenderer.invoke("debug:screenshot", sessionId, workspaceId, phase);
    },

    exportDiagnostics(sessionId: string) {
      return ipcRenderer.invoke("debug:exportDiagnostics", sessionId);
    }
  }
});

declare global {
  interface Window {
    __WS_AUDIT_FORCE__: boolean;

    ipcRenderer: {
      on: typeof ipcRenderer.on;
      off: typeof ipcRenderer.off;
      send: typeof ipcRenderer.send;
      invoke: typeof ipcRenderer.invoke;

      image: {
        armDownload(id: string, baseName: string, workTypePrefix: string): void;

        waitForDownload(id: string): Promise<string>;

        verifyFile(
          filePath: string
        ): Promise<{ exists: boolean; size: number }>;
      };

      browser: {
        registerWebview(workspaceId: string, webContentsId: number): void;

        unregisterWebview(workspaceId: string): void;
      };

      settings: {
        getDownloadFolder(): Promise<string>;

        browseDownloadFolder(): Promise<
          | { success: true; folder: string }
          | { success: false; canceled?: boolean }
        >;

        openDownloadFolder(): Promise<{
          success: boolean;
          error: string | null;
        }>;

        getFilenamePrefix(): Promise<string>;

        setFilenamePrefix(prefix: string): Promise<{ success: boolean }>;

        getFirstLaunchNoticeShown(): Promise<boolean>;

        markFirstLaunchNoticeShown(): Promise<{ success: boolean }>;

        getAppInfo(): Promise<{
          appVersion: string;
          electronVersion: string;
          nodeVersion: string;
          gitCommit: string | null;
        }>;

        getDebugMode(): Promise<boolean>;

        setDebugMode(enabled: boolean): Promise<{ success: boolean }>;

        getDebugLogsPath(): Promise<string>;
      };

      backup: {
        export(json: string): Promise<
          | { success: true; filePath: string }
          | { success: false; canceled?: boolean }
        >;

        import(): Promise<
          | { success: true; data: unknown }
          | { success: false; canceled?: boolean; error?: string }
        >;
      };

      debug: {
        log(sessionId: string, file: string, line: string): void;

        savePromptData(payload: {
          sessionId: string;
          workspaceId: string;
          promptName: string;
          promptId: string;
          original: string;
          substituted: string;
          composerReadback: string;
        }): Promise<
          | { success: true; sha256: string }
          | { success: false; error?: string }
        >;

        saveWorkspaceSnapshot(
          sessionId: string,
          phase: "before" | "after",
          workspaceJson: string
        ): Promise<{ success: boolean; error?: string }>;

        saveComposerSnapshot(
          sessionId: string,
          payload: { html: string | null; text: string | null }
        ): Promise<{ success: boolean; error?: string }>;

        captureError(payload: {
          sessionId: string;
          workspaceId: string;
          stage: string;
          reason: string;
          exception: string | null;
          stack: string | null;
        }): Promise<{ success: boolean; error?: string }>;

        screenshot(
          sessionId: string,
          workspaceId: string,
          phase: "before_send" | "after_send"
        ): Promise<
          | { success: true; filePath: string }
          | { success: false; error?: string }
        >;

        exportDiagnostics(sessionId: string): Promise<
          | { success: true; filePath: string }
          | {
            success: false;
            canceled?: boolean;
            error?: string;
            code?: string | null;
            stack?: string | null;
            path?: string;
          }
        >;
      };
    };
  }
}

export {};
