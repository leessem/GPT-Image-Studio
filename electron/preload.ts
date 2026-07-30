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
  // Project API
  // ==========================

  project: {
    open() {
      return ipcRenderer.invoke("project:open");
    },

    save(filePath: string, project: unknown) {
      return ipcRenderer.invoke(
        "project:save",
        filePath,
        project
      );
    },

    saveAs(project: unknown) {
      return ipcRenderer.invoke(
        "project:saveAs",
        project
      );
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

      project: {
        open(): Promise<any>;

        save(
          filePath: string,
          project: unknown
        ): Promise<boolean>;

        saveAs(
          project: unknown
        ): Promise<string | null>;
      };
    };
  }
}

export {};