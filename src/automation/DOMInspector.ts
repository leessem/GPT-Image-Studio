import { BrowserHandle } from "../components/Browser/Browser";

export interface DOMSnapshot {
  url: string;
  title: string;
  textareas: number;
  contentEditables: number;
  buttons: Array<{
    text: string;
    ariaLabel: string | null;
    testId: string | null;
    disabled: boolean;
  }>;
}

export async function inspectDOM(browser: BrowserHandle): Promise<DOMSnapshot> {
  return browser.execute(`
    (() => {
      return {
        url: location.href,
        title: document.title,
        textareas: document.querySelectorAll("textarea").length,
        contentEditables: document.querySelectorAll('[contenteditable="true"]').length,
        buttons: [...document.querySelectorAll("button")].map(btn => ({
          text: btn.innerText,
          ariaLabel: btn.getAttribute("aria-label"),
          testId: btn.getAttribute("data-testid"),
          disabled: btn.disabled
        }))
      };
    })();
  `);
}