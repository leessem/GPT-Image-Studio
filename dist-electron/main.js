import { app as a, session as S, ipcMain as l, shell as U, BrowserWindow as T, dialog as _ } from "electron";
import { fileURLToPath as B } from "node:url";
import i from "node:path";
import r from "node:fs";
import { execSync as V } from "node:child_process";
const A = i.dirname(B(import.meta.url));
process.env.APP_ROOT = i.join(A, "..");
const $ = a.requestSingleInstanceLock();
$ || a.quit();
a.disableHardwareAcceleration();
a.commandLine.appendSwitch("disable-gpu");
a.commandLine.appendSwitch("disable-gpu-compositing");
const b = !1, L = process.env.DEVTOOLS_ENABLED === "true" || b, E = process.env.VITE_DEV_SERVER_URL, H = i.join(process.env.APP_ROOT, "dist-electron"), F = i.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = E ? i.join(process.env.APP_ROOT, "public") : F;
let o = null;
const R = i.join(a.getPath("userData"), "settings.json");
function C() {
  try {
    const d = r.readFileSync(R, "utf-8"), t = JSON.parse(d);
    if (t && typeof t == "object")
      return t;
  } catch {
  }
  return {};
}
function y(d) {
  r.writeFileSync(
    R,
    JSON.stringify(d, null, 2),
    "utf-8"
  );
}
const w = C();
let f = w.downloadFolder ?? i.join(a.getPath("downloads"), "GPT Image Studio"), O = w.filenamePrefix ?? "★";
const P = /* @__PURE__ */ new Map(), v = /* @__PURE__ */ new Map(), I = !a.isPackaged || process.env.WS_AUDIT_FORCE === "true" || b, x = process.env.PORTABLE_EXECUTABLE_DIR ? i.join(process.env.PORTABLE_EXECUTABLE_DIR, "logs") : i.join(i.dirname(a.getPath("exe")), "logs"), j = i.join(x, "ws-audit.log");
if (I)
  try {
    r.mkdirSync(x, { recursive: !0 });
  } catch {
  }
function h(d, t, e) {
  if (!I)
    return;
  const n = `[WS-AUDIT][main] ${(/* @__PURE__ */ new Date()).toISOString()} | workspace=${d ?? "unknown"} | event=${t} ${JSON.stringify(e ?? {})}`;
  console.log(n);
  try {
    r.appendFileSync(j, n + `
`, "utf-8");
  } catch {
  }
}
function D(d) {
  return d.replace(/[\\/:*?"<>|]/g, "_").trim();
}
function W(d, t, e) {
  const n = D(t) || "Untitled", c = D(O), s = D(e), u = `${c}${s}${n}`, p = `${u}.png`;
  if (!r.existsSync(i.join(d, p)))
    return p;
  let m = 2, g = `${u}${m}.png`;
  for (; r.existsSync(i.join(d, g)); )
    m++, g = `${u}${m}.png`;
  return g;
}
a.on("second-instance", () => {
  o && (o.isMinimized() && o.restore(), o.focus());
});
a.on("web-contents-created", (d, t) => {
  t.on("will-attach-webview", (e, n) => {
    n.devTools = L;
  });
});
function N() {
  o = new T({
    width: 1800,
    height: 1100,
    minWidth: 1400,
    minHeight: 900,
    title: "GPT Image Studio",
    icon: i.join(process.env.VITE_PUBLIC, "icon.ico"),
    autoHideMenuBar: !0,
    webPreferences: {
      preload: i.join(A, "preload.mjs"),
      contextIsolation: !0,
      nodeIntegration: !1,
      webviewTag: !0,
      sandbox: !0,
      devTools: L
    }
  }), E ? o.loadURL(E) : o.loadFile(i.join(F, "index.html")), o.webContents.setWindowOpenHandler(() => ({
    action: "deny"
  }));
}
a.whenReady().then(() => {
  S.defaultSession.setUserAgent(
    S.defaultSession.getUserAgent()
  ), r.existsSync(f) || r.mkdirSync(f, { recursive: !0 });
  const d = (t, e, n) => {
    const c = v.get(n.id), s = c ? P.get(c) : void 0;
    h(c, "Download Started", {
      webContentsId: n.id,
      pendingArmedFor: (s == null ? void 0 : s.id) ?? null,
      pendingBaseName: (s == null ? void 0 : s.baseName) ?? null
    }), c && P.delete(c);
    const u = W(
      f,
      (s == null ? void 0 : s.baseName) ?? "Untitled",
      (s == null ? void 0 : s.workTypePrefix) ?? ""
    ), p = i.join(f, u);
    e.setSavePath(p), h(c, "Save Started", {
      webContentsId: n.id,
      filePath: p
    }), e.once("done", (m, g) => {
      h(c, "Save Completed", {
        webContentsId: n.id,
        filePath: p,
        state: g
      }), o == null || o.webContents.send("image:downloaded", {
        id: (s == null ? void 0 : s.id) ?? null,
        filePath: g === "completed" ? p : null
      });
    });
  };
  S.defaultSession.on("will-download", d), S.fromPartition("persist:gpt-image-studio").on("will-download", d), l.on(
    "image:armDownload",
    (t, e, n, c) => {
      P.set(e, { id: e, baseName: n, workTypePrefix: c }), h(e, "Download Armed", { baseName: n, workTypePrefix: c }), t.returnValue = !0;
    }
  ), l.on(
    "browser:registerWebview",
    (t, e, n) => {
      v.set(n, e), h(e, "Webview Registered", { webContentsId: n });
    }
  ), l.on(
    "browser:unregisterWebview",
    (t, e) => {
      for (const [n, c] of v)
        c === e && (v.delete(n), h(e, "Webview Unregistered", { webContentsId: n }));
      P.delete(e);
    }
  ), l.on("ws-audit:log", (t, e) => {
    if (I) {
      console.log(e);
      try {
        r.appendFileSync(j, `${e} | ipcSenderId=${t.sender.id}
`, "utf-8");
      } catch {
      }
    }
  }), l.handle(
    "image:verifyFile",
    async (t, e) => {
      const s = Date.now();
      for (; Date.now() - s <= 3e3; ) {
        try {
          const u = r.statSync(e);
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
    const t = await _.showOpenDialog(o, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (t.canceled || !t.filePaths[0])
      return { success: !1, canceled: !0 };
    const e = t.filePaths[0];
    return r.existsSync(e) || r.mkdirSync(e, { recursive: !0 }), f = e, w.downloadFolder = e, y(w), { success: !0, folder: e };
  }), l.handle("settings:getFilenamePrefix", () => O), l.handle("settings:setFilenamePrefix", (t, e) => (O = e, w.filenamePrefix = e, y(w), { success: !0 })), l.handle("settings:openDownloadFolder", async () => {
    r.existsSync(f) || r.mkdirSync(f, { recursive: !0 });
    const t = await U.openPath(f);
    return { success: t === "", error: t || null };
  }), l.handle(
    "settings:getFirstLaunchNoticeShown",
    () => !!w.firstLaunchNoticeShown
  ), l.handle("settings:markFirstLaunchNoticeShown", () => (w.firstLaunchNoticeShown = !0, y(w), { success: !0 })), l.handle("settings:getAppInfo", () => {
    let t = null;
    try {
      t = V("git rev-parse --short HEAD", {
        cwd: process.env.APP_ROOT,
        stdio: ["ignore", "pipe", "ignore"]
      }).toString().trim();
    } catch {
      t = null;
    }
    return {
      appVersion: a.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      gitCommit: t
    };
  }), l.handle(
    "backup:export",
    async (t, e) => {
      if (!o)
        return { success: !1 };
      const n = await _.showSaveDialog(o, {
        defaultPath: "GPT_Image_Studio_Backup.json",
        filters: [{ name: "JSON", extensions: ["json"] }]
      });
      return n.canceled || !n.filePath ? { success: !1, canceled: !0 } : (r.writeFileSync(n.filePath, e, "utf-8"), { success: !0, filePath: n.filePath });
    }
  ), l.handle("backup:import", async () => {
    if (!o)
      return { success: !1 };
    const t = await _.showOpenDialog(o, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (t.canceled || !t.filePaths[0])
      return { success: !1, canceled: !0 };
    try {
      const e = r.readFileSync(t.filePaths[0], "utf-8");
      return { success: !0, data: JSON.parse(e) };
    } catch {
      return {
        success: !1,
        error: "Could not read or parse the selected file."
      };
    }
  }), N();
});
a.on("activate", () => {
  T.getAllWindows().length === 0 && N();
});
a.on("window-all-closed", () => {
  process.platform !== "darwin" && a.quit();
});
export {
  H as MAIN_DIST,
  F as RENDERER_DIST,
  E as VITE_DEV_SERVER_URL
};
