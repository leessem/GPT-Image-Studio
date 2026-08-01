import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import "./Browser.css";

export interface BrowserHandle {
  execute(script: string): Promise<unknown>;
  reload(): void;
  goBack(): void;
  goForward(): void;
}

const Browser = forwardRef<BrowserHandle>((_, ref) => {
  const webviewRef = useRef<Electron.WebviewTag>(null);

  useImperativeHandle(ref, () => ({
    async execute(script: string) {
      if (!webviewRef.current) return;
      return await webviewRef.current.executeJavaScript(script);
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
  }));

  useEffect(() => {
    const webview = webviewRef.current;

    if (!webview) return;

    const handleDomReady = () => {
      webview.openDevTools();
    };

    webview.addEventListener("dom-ready", handleDomReady);

    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
    };
  }, []);

  return (
    <div className="browser">
      <div className="browser-header">
        ChatGPT Browser
      </div>

      <div className="browser-body">
        <webview
          ref={webviewRef}
          src="https://chatgpt.com"
          partition="persist:gpt-image-studio"
          className="chatgpt-webview"
        />
      </div>
    </div>
  );
});

export default Browser;