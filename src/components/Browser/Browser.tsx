// ============================================================================
// File : src/components/Browser/Browser.tsx
//
// Architecture (2026-08-03, V1.0): one persistent <webview> per Workspace
// (a Workspace IS a tab), all on the SAME partition (one shared login),
// instead of one shared <webview> navigated between conversations. A
// Workspace's independence comes from literally owning its own webview/
// guest process, which stays parked on its own conversation permanently -
// switching Workspaces is a pure show/hide, never a navigation. A webview
// is created lazily the first time a Workspace becomes active (selected,
// or generated) and is only ever torn down when that Workspace is closed.
// ============================================================================

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "./Browser.css";
import { logDomEvent } from "../../utils/debugLogger";

export const CHATGPT_HOME_URL = "https://chatgpt.com/";

const PARTITION = "persist:gpt-image-studio";

export interface BrowserHandle {
  execute(script: string): Promise<unknown>;
  reload(): void;
  goBack(): void;
  goForward(): void;

  /**
   * Navigates this Workspace's own webview to a specific URL, or to
   * CHATGPT_HOME_URL to start a fresh conversation. Only ever needed once,
   * right after this webview is created (BrowserPool.ensure() does this
   * itself) - the generation pipeline no longer calls this on every run.
   */
  loadURL(url: string): Promise<void>;

  /** This Workspace's webview's current URL - used to capture its own
   *  conversation URL right after ChatGPT creates it. */
  getCurrentUrl(): string;

  /** This Workspace's own webview guest's webContents id (undefined if
   *  the webview doesn't exist) - included in diagnostic logs so a
   *  Generate/Upload/Download event can be tied back to the exact guest
   *  process that triggered it (see src/utils/workspaceLogger.ts). */
  getWebContentsId(): number | undefined;
}

export interface BrowserPoolHandle {

  /**
   * Returns the BrowserHandle for a Workspace, creating its webview first
   * if this is the first time that Workspace has become active.
   * `initialUrl`, when given, is the URL a freshly-created webview should
   * navigate to once (a Workspace's saved conversationUrl, so restarting
   * the app and activating a Workspace again restores its conversation);
   * omitted/undefined means start a fresh chat. Has no effect if the
   * webview already exists.
   */
  ensure(workspaceId: string, initialUrl?: string): Promise<BrowserHandle>;

  /** Returns the BrowserHandle for a Workspace only if its webview
   *  already exists - never creates one. */
  get(workspaceId: string): BrowserHandle | undefined;

  /** Tears down a Workspace's webview. Only called when the Workspace
   *  itself is closed. */
  destroy(workspaceId: string): void;

}

interface BrowserPoolProps {
  activeWorkspaceId: string | null;
}

const BrowserPool = forwardRef<BrowserPoolHandle, BrowserPoolProps>(
  ({ activeWorkspaceId }, ref) => {

    const [workspaceIds, setWorkspaceIds] = useState<string[]>([]);

    const webviewRefs = useRef(new Map<string, Electron.WebviewTag>());
    const readyWorkspaceIds = useRef(new Set<string>());
    const pendingInitialUrls = useRef(new Map<string, string | undefined>());
    const pendingResolvers = useRef(new Map<string, () => void>());
    const wiredWorkspaceIds = useRef(new Set<string>());
    const refCallbacks = useRef(
      new Map<string, (el: Electron.WebviewTag | null) => void>()
    );

    const makeHandle = (workspaceId: string): BrowserHandle => {

      const getEl = () => webviewRefs.current.get(workspaceId);

      return {

        async execute(script: string) {

          const el = getEl();

          if (!el) {
            console.error(
              `[BrowserPool] execute() aborted: no webview for workspace ${workspaceId}`
            );
            return undefined;
          }

          return el.executeJavaScript(script);

        },

        reload() {
          getEl()?.reload();
        },

        goBack() {
          const el = getEl();
          if (el?.canGoBack()) el.goBack();
        },

        goForward() {
          const el = getEl();
          if (el?.canGoForward()) el.goForward();
        },

        async loadURL(url: string) {

          const el = getEl();

          if (!el) {
            console.error(
              `[BrowserPool] loadURL() aborted: no webview for workspace ${workspaceId}`
            );
            return;
          }

          await el.loadURL(url);

        },

        getCurrentUrl() {
          return getEl()?.getURL() ?? "";
        },

        getWebContentsId() {
          return getEl()?.getWebContentsId();
        },

      };

    };

    const getRefCallback = (workspaceId: string) => {

      let callback = refCallbacks.current.get(workspaceId);

      if (callback)
        return callback;

      callback = (el: Electron.WebviewTag | null) => {

        if (!el) {
          webviewRefs.current.delete(workspaceId);
          return;
        }

        webviewRefs.current.set(workspaceId, el);

        if (wiredWorkspaceIds.current.has(workspaceId))
          return;

        wiredWorkspaceIds.current.add(workspaceId);

        // Version 1.2.3 Debug Build: the ChatGPT <webview> guest page has
        // no access to this app's window.ipcRenderer (preload is only
        // injected into the main app window), so a MutationObserver
        // running inside it (see ChatGPT.ts's buildAttachDomObserverScript)
        // can only reach dom.log via console.log + this native webview
        // DOM event. logDomEvent itself already no-ops immediately when
        // Debug Mode is off, and buildAttachDomObserverScript is only
        // ever invoked (from generate.ts) when Debug Mode is on, so this
        // listener sees zero "[DOM-LOG]" lines at all when the feature is
        // off - filtering every other console line the guest page emits
        // is the only always-on cost, and it's a single string check.
        el.addEventListener("console-message", (event) => {

          if (!event.message.startsWith("[DOM-LOG]"))
            return;

          logDomEvent(workspaceId, event.message);

        });

        const onDomReady = () => {

          el.removeEventListener("dom-ready", onDomReady);

          const initialUrl = pendingInitialUrls.current.get(workspaceId);

          pendingInitialUrls.current.delete(workspaceId);

          const finish = () => {

            readyWorkspaceIds.current.add(workspaceId);

            // Lets main.ts resolve a later `will-download` back to this
            // exact Workspace via its own webview's webContents.id, so
            // downloads are never attributed to whichever Workspace last
            // called armDownload (see webviewOwners in electron/main.ts).
            window.ipcRenderer.browser.registerWebview(
              workspaceId,
              el.getWebContentsId()
            );

            const resolve = pendingResolvers.current.get(workspaceId);

            pendingResolvers.current.delete(workspaceId);

            resolve?.();

          };

          if (initialUrl && initialUrl !== CHATGPT_HOME_URL) {

            console.log(
              `[BrowserPool] webview for workspace ${workspaceId} ready, restoring conversation`,
              initialUrl
            );

            el.loadURL(initialUrl).then(finish).catch(finish);

          }
          else {

            console.log(
              `[BrowserPool] webview for workspace ${workspaceId} ready (fresh chat)`
            );

            finish();

          }

        };

        el.addEventListener("dom-ready", onDomReady);

      };

      refCallbacks.current.set(workspaceId, callback);

      return callback;

    };

    useImperativeHandle(ref, () => ({

      ensure(workspaceId: string, initialUrl?: string) {

        if (readyWorkspaceIds.current.has(workspaceId))
          return Promise.resolve(makeHandle(workspaceId));

        return new Promise<BrowserHandle>(resolve => {

          pendingResolvers.current.set(workspaceId, () => resolve(makeHandle(workspaceId)));

          pendingInitialUrls.current.set(workspaceId, initialUrl);

          setWorkspaceIds(prev =>
            (prev.includes(workspaceId) ? prev : [...prev, workspaceId])
          );

        });

      },

      get(workspaceId: string) {

        return readyWorkspaceIds.current.has(workspaceId)
          ? makeHandle(workspaceId)
          : undefined;

      },

      destroy(workspaceId: string) {

        webviewRefs.current.delete(workspaceId);
        readyWorkspaceIds.current.delete(workspaceId);
        pendingInitialUrls.current.delete(workspaceId);
        pendingResolvers.current.delete(workspaceId);
        wiredWorkspaceIds.current.delete(workspaceId);
        refCallbacks.current.delete(workspaceId);

        window.ipcRenderer.browser.unregisterWebview(workspaceId);

        setWorkspaceIds(prev => prev.filter(id => id !== workspaceId));

      },

    }));

    return (

      <div className="browser">

        <div className="browser-header">

          ChatGPT Browser

        </div>

        <div className="browser-body">

          {workspaceIds.map(workspaceId => (

            <webview

              key={workspaceId}

              ref={getRefCallback(workspaceId)}

              src={CHATGPT_HOME_URL}

              partition={PARTITION}

              className="chatgpt-webview"

              style={{
                display: workspaceId === activeWorkspaceId ? "inline-flex" : "none",
              }}

            />

          ))}

        </div>

      </div>

    );

  }
);

export default BrowserPool;

// ============================================================================
// End of File
// ============================================================================
