"use strict";
const electron = require("electron");
const FORCE_DEBUG_BUILD = false;
electron.contextBridge.exposeInMainWorld(
  "__WS_AUDIT_FORCE__",
  process.env.WS_AUDIT_FORCE === "true" || FORCE_DEBUG_BUILD
);
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // ==========================
  // Image API
  // ==========================
  image: {
    armDownload(id, baseName, workTypePrefix) {
      electron.ipcRenderer.sendSync("image:armDownload", id, baseName, workTypePrefix);
    },
    // v1.3.0 Custom Image Revision
    armRevisionDownload(id, sourceFilePath) {
      electron.ipcRenderer.sendSync("image:armRevisionDownload", id, sourceFilePath);
    },
    waitForDownload(id) {
      return new Promise((resolve, reject) => {
        const handler = (_event, payload) => {
          if (payload.id !== id)
            return;
          electron.ipcRenderer.off("image:downloaded", handler);
          if (payload.filePath) {
            resolve(payload.filePath);
          } else {
            reject(new Error("Download failed for " + id));
          }
        };
        electron.ipcRenderer.on("image:downloaded", handler);
      });
    },
    verifyFile(filePath) {
      return electron.ipcRenderer.invoke("image:verifyFile", filePath);
    },
    // v1.3.0 Custom Image Revision
    readAsDataUrl(filePath) {
      return electron.ipcRenderer.invoke("image:readAsDataUrl", filePath);
    }
  },
  // ==========================
  // Browser API
  // ==========================
  browser: {
    registerWebview(workspaceId, webContentsId) {
      electron.ipcRenderer.send("browser:registerWebview", workspaceId, webContentsId);
    },
    unregisterWebview(workspaceId) {
      electron.ipcRenderer.send("browser:unregisterWebview", workspaceId);
    }
  },
  // ==========================
  // Settings API
  // ==========================
  settings: {
    getDownloadFolder() {
      return electron.ipcRenderer.invoke("settings:getDownloadFolder");
    },
    browseDownloadFolder() {
      return electron.ipcRenderer.invoke("settings:browseDownloadFolder");
    },
    openDownloadFolder() {
      return electron.ipcRenderer.invoke("settings:openDownloadFolder");
    },
    getFilenamePrefix() {
      return electron.ipcRenderer.invoke("settings:getFilenamePrefix");
    },
    setFilenamePrefix(prefix) {
      return electron.ipcRenderer.invoke("settings:setFilenamePrefix", prefix);
    },
    getFirstLaunchNoticeShown() {
      return electron.ipcRenderer.invoke("settings:getFirstLaunchNoticeShown");
    },
    markFirstLaunchNoticeShown() {
      return electron.ipcRenderer.invoke("settings:markFirstLaunchNoticeShown");
    },
    getAppInfo() {
      return electron.ipcRenderer.invoke("settings:getAppInfo");
    },
    getDebugMode() {
      return electron.ipcRenderer.invoke("settings:getDebugMode");
    },
    setDebugMode(enabled) {
      return electron.ipcRenderer.invoke("settings:setDebugMode", enabled);
    },
    getDebugLogsPath() {
      return electron.ipcRenderer.invoke("settings:getDebugLogsPath");
    }
  },
  // ==========================
  // Backup / Restore API (Prompt Library + Work Type List, unified)
  // ==========================
  backup: {
    export(json) {
      return electron.ipcRenderer.invoke("backup:export", json);
    },
    import() {
      return electron.ipcRenderer.invoke("backup:import");
    }
  },
  // ==========================
  // Debug API (Version 1.2.3 Debug Build - forensic Generate-pipeline
  // logging, gated end-to-end by Settings > Debug Mode)
  // ==========================
  debug: {
    log(sessionId, file, line) {
      electron.ipcRenderer.send("debug:log", sessionId, file, line);
    },
    savePromptData(payload) {
      return electron.ipcRenderer.invoke("debug:savePromptData", payload);
    },
    saveWorkspaceSnapshot(sessionId, phase, workspaceJson) {
      return electron.ipcRenderer.invoke("debug:saveWorkspaceSnapshot", sessionId, phase, workspaceJson);
    },
    saveComposerSnapshot(sessionId, payload) {
      return electron.ipcRenderer.invoke("debug:saveComposerSnapshot", sessionId, payload);
    },
    captureError(payload) {
      return electron.ipcRenderer.invoke("debug:captureError", payload);
    },
    screenshot(sessionId, workspaceId, phase) {
      return electron.ipcRenderer.invoke("debug:screenshot", sessionId, workspaceId, phase);
    },
    exportDiagnostics(sessionId) {
      return electron.ipcRenderer.invoke("debug:exportDiagnostics", sessionId);
    }
  }
});
