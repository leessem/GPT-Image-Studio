import { app as r, session as S, ipcMain as l, shell as F, BrowserWindow as E, dialog as y } from "electron";
import { fileURLToPath as N } from "node:url";
import d from "node:path";
import c from "node:fs";
import { execSync as j } from "node:child_process";
const I = d.dirname(N(import.meta.url));
process.env.APP_ROOT = d.join(I, "..");
const R = r.requestSingleInstanceLock();
R || r.quit();
r.disableHardwareAcceleration();
r.commandLine.appendSwitch("disable-gpu");
r.commandLine.appendSwitch("disable-gpu-compositing");
const T = process.env.DEVTOOLS_ENABLED === "true", b = process.env.VITE_DEV_SERVER_URL, z = d.join(process.env.APP_ROOT, "dist-electron"), x = d.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = b ? d.join(process.env.APP_ROOT, "public") : x;
let o = null;
const A = d.join(r.getPath("userData"), "settings.json");
function V() {
  try {
    const a = c.readFileSync(A, "utf-8"), t = JSON.parse(a);
    if (t && typeof t == "object")
      return t;
  } catch {
  }
  return {};
}
function D(a) {
  c.writeFileSync(
    A,
    JSON.stringify(a, null, 2),
    "utf-8"
  );
}
const w = V();
let f = w.downloadFolder ?? d.join(r.getPath("downloads"), "GPT Image Studio"), O = w.filenamePrefix ?? "★";
const P = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), U = !r.isPackaged;
function g(a, t, e) {
  U && console.log(
    `[WS-AUDIT][main] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${a ?? "unknown"} | event=${t}`,
    e ?? {}
  );
}
function _(a) {
  return a.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function W(a, t, e) {
  const n = _(t) || "Untitled", i = _(O), s = _(e), u = `${i}${s}${n}`, p = `${u}.png`;
  if (!c.existsSync(d.join(a, p)))
    return p;
  let h = 2, m = `${u}${h}.png`;
  for (; c.existsSync(d.join(a, m)); )
    h++, m = `${u}${h}.png`;
  return m;
}
r.on("second-instance", () => {
  o && (o.isMinimized() && o.restore(), o.focus());
});
r.on("web-contents-created", (a, t) => {
  t.on("will-attach-webview", (e, n) => {
    n.devTools = T;
  });
});
function L() {
  o = new E({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: d.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: d.join(I, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0,
      devTools: T
    }
  }), b ? o.loadURL(b) : o.loadFile(d.join(x, "index.html")), o.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
r.whenReady().then(() => {
  S.defaultSession.setUserAgent(
    S.defaultSession.getUserAgent()
  ), c.existsSync(f) || c.mkdirSync(f, { recursive: !0 });
  const a = (t, e, n) => {
    const i = v.get(n.id), s = i ? P.get(i) : void 0;
    g(i, "Download Started", {
      webContentsId: n.id,
      pendingArmedFor: (s == null ? void 0 : s.id) ?? null,
      pendingBaseName: (s == null ? void 0 : s.baseName) ?? null
    }), i && P.delete(i);
    const u = W(
      f,
      (s == null ? void 0 : s.baseName) ?? "Untitled",
      (s == null ? void 0 : s.workTypePrefix) ?? ""
    ), p = d.join(f, u);
    e.setSavePath(p), g(i, "Save Started", {
      webContentsId: n.id,
      filePath: p
    }), e.once("done", (h, m) => {
      g(i, "Save Completed", {
        webContentsId: n.id,
        filePath: p,
        state: m
      }), o == null || o.webContents.send("image:downloaded", {
        id: (s == null ? void 0 : s.id) ?? null,
        filePath: m === "completed" ? p : null
      });
    });
  };
  S.defaultSession.on("will-download", a), S.fromPartition("persist:gpt-image-studio").on("will-download", a), l.on(
    "image:armDownload",
    (t, e, n, i) => {
      P.set(e, { id: e, baseName: n, workTypePrefix: i }), g(e, "Download Armed", { baseName: n, workTypePrefix: i }), t.returnValue = !0;
    }
  ), l.on(
    "browser:registerWebview",
    (t, e, n) => {
      v.set(n, e), g(e, "Webview Registered", { webContentsId: n });
    }
  ), l.on(
    "browser:unregisterWebview",
    (t, e) => {
      for (const [n, i] of v)
        i === e && (v.delete(n), g(e, "Webview Unregistered", { webContentsId: n }));
      P.delete(e);
    }
  ), l.handle(
    "image:verifyFile",
    async (t, e) => {
      const s = Date.now();
      for (; Date.now() - s <= 3e3; ) {
        try {
          const u = c.statSync(e);
          if (u.size > 0)
            return { exists: !0, size: u.size };
        } catch {
        }
        await new Promise((u) => setTimeout(u, 100));
      }
      return { exists: !1, size: 0 };
    }
  ), l.handle("settings:getDownloadFolder", () => f), l.handle("settings:browseDownloadFolder", async () => {
    if (!o)
      return { success: !1 };
    const t = await y.showOpenDialog(o, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (t.canceled || !t.filePaths[0])
      return { success: !1, canceled: !0 };
    const e = t.filePaths[0];
    return c.existsSync(e) || c.mkdirSync(e, { recursive: !0 }), f = e, w.downloadFolder = e, D(w), { success: !0, folder: e };
  }), l.handle("settings:getFilenamePrefix", () => O), l.handle("settings:setFilenamePrefix", (t, e) => (O = e, w.filenamePrefix = e, D(w), { success: !0 })), l.handle("settings:openDownloadFolder", async () => {
    c.existsSync(f) || c.mkdirSync(f, { recursive: !0 });
    const t = await F.openPath(f);
    return { success: t === "", error: t || null };
  }), l.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!w.firstLaunchNoticeShown
  ), l.handle("settings:markFirstLaunchNoticeShown", () => (w.firstLaunchNoticeShown = !0, D(w), { success: !0 })), l.handle("settings:getAppInfo", () => {
    let t = null;
    try {
      t = j("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch {
      t = null;
    }
    return {
      appVersion: r.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit: t
    };
  }), l.handle(
    "promptLibrary:export",
    async (t, e) => {
      if (!o)
        return { success: !1 };
      const n = await y.showSaveDialog(o, {
        defaultPath: "prompt-library.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      return n.canceled || !n.filePath ? { success: !1, canceled: !0 } : (c.writeFileSync(n.filePath, e, "utf-8"), { success: !0, filePath: n.filePath });
    }
  ), l.handle("promptLibrary:import", async () => {
    if (!o)
      return { success: !1 };
    const t = await y.showOpenDialog(o, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (t.canceled || !t.filePaths[0])
      return { success: !1, canceled: !0 };
    try {
      const e = c.readFileSync(t.filePaths[0], "utf-8");
      return { success: !0, data: JSON.parse(e) };
    } catch {
      return {
        success: !1,
        error: "Could not read or parse the selected file."
      };
    }
  }), L();
});
r.on("activate", () => {
  E.getAllWindows().length === 0 && L();
});
r.on("window-all-closed", () => {
  process.platform !== "darwin" && r.quit();
});
export {
  z as MAIN_DIST,
  x as RENDERER_DIST,
  b as VITE_DEV_SERVER_URL
};
