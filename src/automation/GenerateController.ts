import BrowserController from "./BrowserController";

export default class GenerateController {

    constructor(
        private browser: BrowserController
    ) {}

    async click() {

        const script = `
(() => {

    const candidates = [

        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'button[aria-label*="send"]',
        'button[type="submit"]'

    ];

    for (const selector of candidates) {

        const button = document.querySelector(selector);

        if (button && !button.disabled) {

            button.click();

            return {
                success: true,
                selector
            };

        }

    }

    return {
        success: false
    };

})();
`;

        return await this.browser.execute(script);

    }

}