import {
  BrowserWindow,
  WebContentsView,
} from "electron";

class BrowserManager {

  private view: WebContentsView | null = null;

  create(parent: BrowserWindow) {

    if (this.view)
      return;

    this.view = new WebContentsView({

      webPreferences: {

        contextIsolation: true,

        sandbox: true,

      },

    });

    parent.contentView.addChildView(this.view);

    this.resize(parent);

    this.view.webContents.loadURL("https://chatgpt.com");

  }

  resize(parent: BrowserWindow) {

    if (!this.view)
      return;

    const bounds = parent.getContentBounds();

    this.view.setBounds({

      x: 320,
      y: 102,
      width: bounds.width - 620,
      height: bounds.height - 102,

    });

  }

  destroy() {

    if (!this.view)
      return;

    this.view.webContents.close();

    this.view = null;

  }

}

export default new BrowserManager();