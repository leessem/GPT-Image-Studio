// ============================================================================
// File : src/components/Browser/Browser.tsx
//
// P0 correction: back to a single <webview> on a single shared persistent
// partition - one login, one session, shared cookies/localStorage across
// every Job. A Job's independence comes from its own ChatGPT conversation
// URL (see QueueRunner's "Activate Job" step), not from a separate browser
// profile.
// ============================================================================

import {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import "./Browser.css";

export const CHATGPT_HOME_URL = "https://chatgpt.com/";

const PARTITION = "persist:gpt-image-studio";

export interface BrowserHandle {
  execute(script: string): Promise<unknown>;
  reload(): void;
  goBack(): void;
  goForward(): void;

  /**
   * Navigates the shared webview to a Job's own conversation URL, or to
   * CHATGPT_HOME_URL to start a fresh one.
   */
  loadURL(url: string): Promise<void>;

  /** The webview's current URL - used to capture a Job's conversation URL
   *  right after ChatGPT creates it. */
  getCurrentUrl(): string;
}

const Browser = forwardRef<BrowserHandle>((_, ref) => {
  const webviewRef = useRef<Electron.WebviewTag>(null);

  useImperativeHandle(ref, () => ({
    async execute(script: string) {
      if (!webviewRef.current) {
        console.error(
          "[Queue] browser.execute() aborted: webview is not mounted yet"
        );
        return undefined;
      }

      console.log("[Queue] browser.execute() injecting script into webview");

      const result = await webviewRef.current.executeJavaScript(script);

      console.log("[Queue] browser.execute() returned", result);

      return result;
    },

    reload() {
      webviewRef.current?.reload();
    },

    goBack() {
      if (webviewRef.current?.canGoBack()) {
        webviewRef.current.goBack();
      }
    },

    goForward() {
      if (webviewRef.current?.canGoForward()) {
        webviewRef.current.goForward();
      }
    },

    async loadURL(url: string) {
      if (!webviewRef.current) {
        console.error(
          "[Queue] browser.loadURL() aborted: webview is not mounted yet"
        );
        return;
      }

      console.log("[Queue] browser.loadURL()", url);

      await webviewRef.current.loadURL(url);
    },

    getCurrentUrl() {
      return webviewRef.current?.getURL() ?? "";
    },
  }));

  return (
    <div className="browser">
      <div className="browser-header">
        ChatGPT Browser
      </div>

      <div className="browser-body">
        <webview
          ref={webviewRef}
          src={CHATGPT_HOME_URL}
          partition={PARTITION}
          className="chatgpt-webview"
        />
      </div>
    </div>
  );
});

export default Browser;
