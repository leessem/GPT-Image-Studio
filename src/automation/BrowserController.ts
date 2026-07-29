export default class BrowserController {

    constructor(
        private webview: Electron.WebviewTag
    ) {}

    async execute(script: string) {

        return this.webview.executeJavaScript(script);

    }

    reload() {

        this.webview.reload();

    }

    back() {

        if (this.webview.canGoBack())
            this.webview.goBack();

    }

    forward() {

        if (this.webview.canGoForward())
            this.webview.goForward();

    }

    url() {

        return this.webview.getURL();

    }

}