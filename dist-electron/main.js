import { app as i, session as m, ipcMain as l, shell as F, BrowserWindow as x, dialog as S } from "electron";
import { fileURLToPath as j } from "node:url";
import r from "node:path";
import o from "node:fs";
import { execSync as I } from "node:child_process";
const O = r.dirname(j(import.meta.url));
process.env.APP_ROOT = r.join(O, "..");
const R = i.requestSingleInstanceLock();
R || i.quit();
i.disableHardwareAcceleration();
i.commandLine.appendSwitch("disable-gpu");
i.commandLine.appendSwitch("disable-gpu-compositing");
const T = process.env.DEVTOOLS_ENABLED === "true", _ = process.env.VITE_DEV_SERVER_URL, C = r.join(process.env.APP_ROOT, "dist-electron"), E = r.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = _ ? r.join(process.env.APP_ROOT, "public") : E;
let s = null;
const L = r.join(i.getPath("userData"), "settings.json");
function A() {
  try {
    const a = o.readFileSync(L, "utf-8"), e = JSON.parse(a);
    if (e && typeof e == "object")
      return e;
  } catch {
  }
  return {};
}
function P(a) {
  o.writeFileSync(
    L,
    JSON.stringify(a, null, 2),
    "utf-8"
  );
}
const u = A();
let d = u.downloadFolder ?? r.join(i.getPath("downloads"), "GPT Image Studio"), D = u.filenamePrefix ?? "★", y = null;
function v(a) {
  return a.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function N(a, e, t) {
  const n = v(e) || "Untitled", f = v(D), p = v(t), c = `${f}${p}${n}`, h = `${c}.png`;
  if (!o.existsSync(r.join(a, h)))
    return h;
  let w = 2, g = `${c}${w}.png`;
  for (; o.existsSync(r.join(a, g)); )
    w++, g = `${c}${w}.png`;
  return g;
}
i.on("second-instance", () => {
  s && (s.isMinimized() && s.restore(), s.focus());
});
i.on("web-contents-created", (a, e) => {
  e.on("will-attach-webview", (t, n) => {
    n.devTools = T;
  });
});
function b() {
  s = new x({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: r.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: r.join(O, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0,
      devTools: T
    }
  }), _ ? s.loadURL(_) : s.loadFile(r.join(E, "index.html")), s.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
i.whenReady().then(() => {
  m.defaultSession.setUserAgent(
    m.defaultSession.getUserAgent()
  ), o.existsSync(d) || o.mkdirSync(d, { recursive: !0 });
  const a = (e, t) => {
    const n = y;
    y = null;
    const f = N(
      d,
      (n == null ? void 0 : n.baseName) ?? "Untitled",
      (n == null ? void 0 : n.workTypePrefix) ?? ""
    ), p = r.join(d, f);
    t.setSavePath(p), t.once("done", (c, h) => {
      s == null || s.webContents.send("image:downloaded", {
        id: (n == null ? void 0 : n.id) ?? null,
        filePath: h === "completed" ? p : null
      });
    });
  };
  m.defaultSession.on("will-download", a), m.fromPartition("persist:gpt-image-studio").on("will-download", a), l.on(
    "image:armDownload",
    (e, t, n, f) => {
      y = { id: t, baseName: n, workTypePrefix: f }, e.returnValue = !0;
    }
  ), l.handle(
    "image:verifyFile",
    async (e, t) => {
      const p = Date.now();
      for (; Date.now() - p <= 3e3; ) {
        try {
          const c = o.statSync(t);
          if (c.size > 0)
            return { exists: !0, size: c.size };
        } catch {
        }
        await new Promise((c) => setTimeout(c, 100));
      }
      return { exists: !1, size: 0 };
    }
  ), l.handle("settings:getDownloadFolder", () => d), l.handle("settings:browseDownloadFolder", async () => {
    if (!s)
      return { success: !1 };
    const e = await S.showOpenDialog(s, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (e.canceled || !e.filePaths[0])
      return { success: !1, canceled: !0 };
    const t = e.filePaths[0];
    return o.existsSync(t) || o.mkdirSync(t, { recursive: !0 }), d = t, u.downloadFolder = t, P(u), { success: !0, folder: t };
  }), l.handle("settings:getFilenamePrefix", () => D), l.handle("settings:setFilenamePrefix", (e, t) => (D = t, u.filenamePrefix = t, P(u), { success: !0 })), l.handle("settings:openDownloadFolder", async () => {
    o.existsSync(d) || o.mkdirSync(d, { recursive: !0 });
    const e = await F.openPath(d);
    return { success: e === "", error: e || null };
  }), l.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!u.firstLaunchNoticeShown
  ), l.handle("settings:markFirstLaunchNoticeShown", () => (u.firstLaunchNoticeShown = !0, P(u), { success: !0 })), l.handle("settings:getAppInfo", () => {
    let e = null;
    try {
      e = I("git rev-parse --short HEAD", {
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
  }), l.handle(
    "promptLibrary:export",
    async (e, t) => {
      if (!s)
        return { success: !1 };
      const n = await S.showSaveDialog(s, {
        defaultPath: "prompt-library.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      return n.canceled || !n.filePath ? { success: !1, canceled: !0 } : (o.writeFileSync(n.filePath, t, "utf-8"), { success: !0, filePath: n.filePath });
    }
  ), l.handle("promptLibrary:import", async () => {
    if (!s)
      return { success: !1 };
    const e = await S.showOpenDialog(s, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (e.canceled || !e.filePaths[0])
      return { success: !1, canceled: !0 };
    try {
      const t = o.readFileSync(e.filePaths[0], "utf-8");
      return { success: !0, data: JSON.parse(t) };
    } catch {
      return {
        success: !1,
        error: "Could not read or parse the selected file."
      };
    }
  }), b();
});
i.on("activate", () => {
  x.getAllWindows().length === 0 && b();
});
i.on("window-all-closed", () => {
  process.platform !== "darwin" && i.quit();
});
export {
  C as MAIN_DIST,
  E as RENDERER_DIST,
  _ as VITE_DEV_SERVER_URL
};
