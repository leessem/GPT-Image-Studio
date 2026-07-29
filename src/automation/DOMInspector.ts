import BrowserController from "./BrowserController";

export interface DomInfo {

    url: string;

    title: string;

    textareas: number;

    contentEditable: number;

    buttons: string[];

}

export default class DOMInspector {

    constructor(
        private browser: BrowserController
    ) {}

    async inspect(): Promise<DomInfo> {

        return this.browser.execute(`

(() => {

    const buttons = [];

    document.querySelectorAll("button").forEach(btn=>{

        buttons.push({

            text:btn.innerText,

            aria:btn.getAttribute("aria-label"),

            testid:btn.getAttribute("data-testid")

        });

    });

    return {

        url:location.href,

        title:document.title,

        textareas:document.querySelectorAll("textarea").length,

        contentEditable:document.querySelectorAll('[contenteditable="true"]').length,

        buttons

    };

})();

`);

    }

}