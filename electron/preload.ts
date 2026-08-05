// electron/preload.ts
// ===== COMPLETE FILE =====

import { ipcRenderer, contextBridge } from "electron";

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
    }
  },

  // ==========================
  // Prompt Library Backup API
  // ==========================

  promptLibrary: {
    export(json: string) {
      return ipcRenderer.invoke("promptLibrary:export", json);
    },

    import() {
      return ipcRenderer.invoke("promptLibrary:import");
    }
  }
});

declare global {
  interface Window {
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
      };

      promptLibrary: {
        export(json: string): Promise<
          | { success: true; filePath: string }
          | { success: false; canceled?: boolean }
        >;

        import(): Promise<
          | { success: true; data: unknown }
          | { success: false; canceled?: boolean; error?: string }
        >;
      };
    };
  }
}

export {};
