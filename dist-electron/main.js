import { app as e, session as l, ipcMain as c, dialog as p, BrowserWindow as u } from "electron";
import { fileURLToPath as h } from "node:url";
import o from "node:path";
import a from "node:fs";
const f = o.dirname(h(import.meta.url));
process.env.APP_ROOT = o.join(f, "..");
const P = e.requestSingleInstanceLock();
P || e.quit();
e.disableHardwareAcceleration();
e.commandLine.appendSwitch("disable-gpu");
e.commandLine.appendSwitch("disable-gpu-compositing");
const d = process.env.VITE_DEV_SERVER_URL, I = o.join(process.env.APP_ROOT, "dist-electron"), w = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = d ? o.join(process.env.APP_ROOT, "public") : w;
let i = null;
e.on("second-instance", () => {
  i && (i.isMinimized() && i.restore(), i.focus());
});
function m() {
  i = new u({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio Pro",
    autoHideMenuBar: !0,
    webPreferences: {
      preload: o.join(f, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0
    }
  }), d ? i.loadURL(d) : i.loadFile(o.join(w, "index.html")), i.webContents.openDevTools(), i.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
e.whenReady().then(() => {
  l.defaultSession.setUserAgent(
    l.defaultSession.getUserAgent()
  );
  const r = o.join(
    e.getPath("downloads"),
    "GPT Image Studio"
  );
  a.existsSync(r) || a.mkdirSync(r, { recursive: !0 }), l.defaultSession.on("will-download", (s, n) => {
    const t = Date.now() + o.extname(n.getFilename());
    n.setSavePath(o.join(r, t)), n.on("done", (S, g) => {
      console.log("Download:", g);
    });
  }), c.handle("project:open", async () => {
    const s = await p.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "GPT Image Studio Project",
          extensions: ["gisp"]
        }
      ]
    });
    if (s.canceled)
      return null;
    const n = s.filePaths[0], t = a.readFileSync(n, "utf8");
    return {
      path: n,
      data: JSON.parse(t)
    };
  }), c.handle(
    "project:saveAs",
    async (s, n) => {
      const t = await p.showSaveDialog({
        filters: [
          {
            name: "GPT Image Studio Project",
            extensions: ["gisp"]
          }
        ]
      });
      return t.canceled || !t.filePath ? null : (a.writeFileSync(
        t.filePath,
        JSON.stringify(n, null, 2),
        "utf8"
      ), t.filePath);
    }
  ), c.handle(
    "project:save",
    async (s, n, t) => (a.writeFileSync(
      n,
      JSON.stringify(t, null, 2),
      "utf8"
    ), !0)
  ), m();
});
e.on("activate", () => {
  u.getAllWindows().length === 0 && m();
});
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
export {
  I as MAIN_DIST,
  w as RENDERER_DIST,
  d as VITE_DEV_SERVER_URL
};
