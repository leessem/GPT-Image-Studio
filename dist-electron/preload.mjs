"use strict";
const electron = require("electron");
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
  // Project API
  // ==========================
  project: {
    open() {
      return electron.ipcRenderer.invoke("project:open");
    },
    save(filePath, project) {
      return electron.ipcRenderer.invoke(
        "project:save",
        filePath,
        project
      );
    },
    saveAs(project) {
      return electron.ipcRenderer.invoke(
        "project:saveAs",
        project
      );
    }
  }
});
