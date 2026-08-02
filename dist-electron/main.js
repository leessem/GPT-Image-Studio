import { app as o, session as c, ipcMain as r, dialog as g, BrowserWindow as h } from "electron";
import { fileURLToPath as T } from "node:url";
import i from "node:path";
import l from "node:fs";
const P = i.dirname(T(import.meta.url));
process.env.APP_ROOT = i.join(P, "..");
const v = o.requestSingleInstanceLock();
v || o.quit();
o.disableHardwareAcceleration();
o.commandLine.appendSwitch("disable-gpu");
o.commandLine.appendSwitch("disable-gpu-compositing");
const m = process.env.VITE_DEV_SERVER_URL, b = i.join(process.env.APP_ROOT, "dist-electron"), S = i.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? i.join(process.env.APP_ROOT, "public") : S;
let n = null;
const u = i.join(
  o.getPath("downloads"),
  "GPT Image Studio"
);
let p = null;
o.on("second-instance", () => {
  n && (n.isMinimized() && n.restore(), n.focus());
});
function _() {
  n = new h({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio Pro",
    autoHideMenuBar: !0,
    webPreferences: {
      preload: i.join(P, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0
    }
  }), m ? n.loadURL(m) : n.loadFile(i.join(S, "index.html")), n.webContents.openDevTools(), n.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
o.whenReady().then(() => {
  c.defaultSession.setUserAgent(
    c.defaultSession.getUserAgent()
  ), l.existsSync(u) || l.mkdirSync(u, { recursive: !0 });
  const f = (s, e) => {
    const t = p;
    p = null;
    const w = i.extname(e.getFilename()) || ".png", d = `${t ?? "image"}-${Date.now()}${w}`, a = i.join(u, d);
    e.setSavePath(a), e.once("done", (y, I) => {
      n == null || n.webContents.send("image:downloaded", {
        jobId: t,
        filePath: I === "completed" ? a : null
      });
    });
  };
  c.defaultSession.on("will-download", f), c.fromPartition("persist:gpt-image-studio").on("will-download", f), r.on("image:armDownload", (s, e) => {
    p = e, s.returnValue = !0;
  }), r.handle(
    "image:verifyFile",
    async (s, e) => {
      const d = Date.now();
      for (; Date.now() - d <= 3e3; ) {
        try {
          const a = l.statSync(e);
          if (a.size > 0)
            return { exists: !0, size: a.size };
        } catch {
        }
        await new Promise((a) => setTimeout(a, 100));
      }
      return { exists: !1, size: 0 };
    }
  ), r.handle("project:open", async () => {
    const s = await g.showOpenDialog({
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
    const e = s.filePaths[0], t = l.readFileSync(e, "utf8");
    return {
      path: e,
      data: JSON.parse(t)
    };
  }), r.handle(
    "project:saveAs",
    async (s, e) => {
      const t = await g.showSaveDialog({
        filters: [
          {
            name: "GPT Image Studio Project",
            extensions: ["gisp"]
          }
        ]
      });
      return t.canceled || !t.filePath ? null : (l.writeFileSync(
        t.filePath,
        JSON.stringify(e, null, 2),
        "utf8"
      ), t.filePath);
    }
  ), r.handle(
    "project:save",
    async (s, e, t) => (l.writeFileSync(
      e,
      JSON.stringify(t, null, 2),
      "utf8"
    ), !0)
  ), _();
});
o.on("activate", () => {
  h.getAllWindows().length === 0 && _();
});
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
export {
  b as MAIN_DIST,
  S as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
