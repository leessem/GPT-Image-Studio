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
    armDownload(id: string, baseName: string) {
      ipcRenderer.sendSync("image:armDownload", id, baseName);
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
        armDownload(id: string, baseName: string): void;

        waitForDownload(id: string): Promise<string>;

        verifyFile(
          filePath: string
        ): Promise<{ exists: boolean; size: number }>;
      };
    };
  }
}

export {};
