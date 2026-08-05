import { app as i, session as g, ipcMain as o, shell as I, BrowserWindow as O, dialog as y } from "electron";
import { fileURLToPath as j } from "node:url";
import c from "node:path";
import a from "node:fs";
import { execSync as R } from "node:child_process";
const x = c.dirname(j(import.meta.url));
process.env.APP_ROOT = c.join(x, "..");
const A = i.requestSingleInstanceLock();
A || i.quit();
i.disableHardwareAcceleration();
i.commandLine.appendSwitch("disable-gpu");
i.commandLine.appendSwitch("disable-gpu-compositing");
const T = process.env.DEVTOOLS_ENABLED === "true", b = process.env.VITE_DEV_SERVER_URL, C = c.join(process.env.APP_ROOT, "dist-electron"), E = c.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = b ? c.join(process.env.APP_ROOT, "public") : E;
let s = null;
const L = c.join(i.getPath("userData"), "settings.json");
function N() {
  try {
    const l = a.readFileSync(L, "utf-8"), e = JSON.parse(l);
    if (e && typeof e == "object")
      return e;
  } catch {
  }
  return {};
}
function v(l) {
  a.writeFileSync(
    L,
    JSON.stringify(l, null, 2),
    "utf-8"
  );
}
const p = N();
let f = p.downloadFolder ?? c.join(i.getPath("downloads"), "GPT Image Studio"), D = p.filenamePrefix ?? "★";
const S = /* @__PURE__ */ new Map(), P = /* @__PURE__ */ new Map();
function _(l) {
  return l.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function V(l, e, t) {
  const n = _(e) || "Untitled", d = _(D), r = _(t), u = `${d}${r}${n}`, w = `${u}.png`;
  if (!a.existsSync(c.join(l, w)))
    return w;
  let m = 2, h = `${u}${m}.png`;
  for (; a.existsSync(c.join(l, h)); )
    m++, h = `${u}${m}.png`;
  return h;
}
i.on("second-instance", () => {
  s && (s.isMinimized() && s.restore(), s.focus());
});
i.on("web-contents-created", (l, e) => {
  e.on("will-attach-webview", (t, n) => {
    n.devTools = T;
  });
});
function F() {
  s = new O({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: c.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: c.join(x, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0,
      devTools: T
    }
  }), b ? s.loadURL(b) : s.loadFile(c.join(E, "index.html")), s.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
i.whenReady().then(() => {
  g.defaultSession.setUserAgent(
    g.defaultSession.getUserAgent()
  ), a.existsSync(f) || a.mkdirSync(f, { recursive: !0 });
  const l = (e, t, n) => {
    const d = P.get(n.id), r = d ? S.get(d) : void 0;
    d && S.delete(d);
    const u = V(
      f,
      (r == null ? void 0 : r.baseName) ?? "Untitled",
      (r == null ? void 0 : r.workTypePrefix) ?? ""
    ), w = c.join(f, u);
    t.setSavePath(w), t.once("done", (m, h) => {
      s == null || s.webContents.send("image:downloaded", {
        id: (r == null ? void 0 : r.id) ?? null,
        filePath: h === "completed" ? w : null
      });
    });
  };
  g.defaultSession.on("will-download", l), g.fromPartition("persist:gpt-image-studio").on("will-download", l), o.on(
    "image:armDownload",
    (e, t, n, d) => {
      S.set(t, { id: t, baseName: n, workTypePrefix: d }), e.returnValue = !0;
    }
  ), o.on(
    "browser:registerWebview",
    (e, t, n) => {
      P.set(n, t);
    }
  ), o.on(
    "browser:unregisterWebview",
    (e, t) => {
      for (const [n, d] of P)
        d === t && P.delete(n);
      S.delete(t);
    }
  ), o.handle(
    "image:verifyFile",
    async (e, t) => {
      const r = Date.now();
      for (; Date.now() - r <= 3e3; ) {
        try {
          const u = a.statSync(t);
          if (u.size > 0)
            return { exists: !0, size: u.size };
        } catch {
        }
        await new Promise((u) => setTimeout(u, 100));
      }
      return { exists: !1, size: 0 };
    }
  ), o.handle("settings:getDownloadFolder", () => f), o.handle("settings:browseDownloadFolder", async () => {
    if (!s)
      return { success: !1 };
    const e = await y.showOpenDialog(s, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (e.canceled || !e.filePaths[0])
      return { success: !1, canceled: !0 };
    const t = e.filePaths[0];
    return a.existsSync(t) || a.mkdirSync(t, { recursive: !0 }), f = t, p.downloadFolder = t, v(p), { success: !0, folder: t };
  }), o.handle("settings:getFilenamePrefix", () => D), o.handle("settings:setFilenamePrefix", (e, t) => (D = t, p.filenamePrefix = t, v(p), { success: !0 })), o.handle("settings:openDownloadFolder", async () => {
    a.existsSync(f) || a.mkdirSync(f, { recursive: !0 });
    const e = await I.openPath(f);
    return { success: e === "", error: e || null };
  }), o.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!p.firstLaunchNoticeShown
  ), o.handle("settings:markFirstLaunchNoticeShown", () => (p.firstLaunchNoticeShown = !0, v(p), { success: !0 })), o.handle("settings:getAppInfo", () => {
    let e = null;
    try {
      e = R("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch {
      e = null;
    }
    return {
      appVersion: i.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit: e
    };
  }), o.handle(
    "promptLibrary:export",
    async (e, t) => {
      if (!s)
        return { success: !1 };
      const n = await y.showSaveDialog(s, {
        defaultPath: "prompt-library.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      return n.canceled || !n.filePath ? { success: !1, canceled: !0 } : (a.writeFileSync(n.filePath, t, "utf-8"), { success: !0, filePath: n.filePath });
    }
  ), o.handle("promptLibrary:import", async () => {
    if (!s)
      return { success: !1 };
    const e = await y.showOpenDialog(s, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (e.canceled || !e.filePaths[0])
      return { success: !1, canceled: !0 };
    try {
      const t = a.readFileSync(e.filePaths[0], "utf-8");
      return { success: !0, data: JSON.parse(t) };
    } catch {
      return {
        success: !1,
        error: "Could not read or parse the selected file."
      };
    }
  }), F();
});
i.on("activate", () => {
  O.getAllWindows().length === 0 && F();
});
i.on("window-all-closed", () => {
  process.platform !== "darwin" && i.quit();
});
export {
  C as MAIN_DIST,
  E as RENDERER_DIST,
  b as VITE_DEV_SERVER_URL
};
