import BrowserController from "./BrowserController";

export default class PromptController {

    constructor(
        private browser: BrowserController
    ) {}

    async insert(prompt: string) {

        const script = `
        (() => {

            const targets = [

                document.querySelector("textarea"),

                document.querySelector('[contenteditable="true"]'),

                document.querySelector('div[role="textbox"]')

            ].filter(Boolean);

            if(targets.length===0)
                return false;

            const el = targets[0];

            el.focus();

            if(el.tagName==="TEXTAREA"){

                el.value=${JSON.stringify(prompt)};

                el.dispatchEvent(
                    new InputEvent("input",{bubbles:true})
                );

            }
            else{

                el.textContent=${JSON.stringify(prompt)};

                el.dispatchEvent(
                    new InputEvent("input",{bubbles:true})
                );

            }

            return true;

        })();
        `;

        return this.browser.execute(script);

    }

}