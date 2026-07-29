import { app, BrowserWindow, session } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null = null;

function createWindow() {

  win = new BrowserWindow({

    width: 1800,
    height: 1100,

    minWidth: 1400,
    minHeight: 900,

    title: "GPT Image Studio Pro",

    autoHideMenuBar: true,

    webPreferences: {

      preload: path.join(__dirname, "preload.mjs"),

      contextIsolation: true,

      nodeIntegration: false,

      webviewTag: true,

      sandbox: false

    }

  });

  if (VITE_DEV_SERVER_URL) {

    win.loadURL(VITE_DEV_SERVER_URL);

  } else {

    win.loadFile(path.join(RENDERER_DIST, "index.html"));

  }

  win.webContents.openDevTools();

  win.webContents.setWindowOpenHandler(() => {

    return {
      action: "deny"
    };

  });

}

app.whenReady().then(() => {

  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent()
  );

  const downloadDir = path.join(app.getPath("downloads"), "GPT Image Studio");

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  session.defaultSession.on("will-download", (event, item) => {

    const fileName =
      Date.now() + path.extname(item.getFilename());

    item.setSavePath(
      path.join(downloadDir, fileName)
    );

    item.on("done", (_, state) => {

      console.log("Download:", state);

    });

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