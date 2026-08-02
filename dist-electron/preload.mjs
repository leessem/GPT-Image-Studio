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
  },
  // ==========================
  // Image API
  // ==========================
  image: {
    armDownload(jobId) {
      electron.ipcRenderer.sendSync("image:armDownload", jobId);
    },
    waitForDownload(jobId) {
      return new Promise((resolve, reject) => {
        const handler = (_event, payload) => {
          if (payload.jobId !== jobId)
            return;
          electron.ipcRenderer.off("image:downloaded", handler);
          if (payload.filePath) {
            resolve(payload.filePath);
          } else {
            reject(new Error("Download failed for job " + jobId));
          }
        };
        electron.ipcRenderer.on("image:downloaded", handler);
      });
    }
  }
});
