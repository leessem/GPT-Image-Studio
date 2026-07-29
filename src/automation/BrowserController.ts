import { BrowserHandle } from "../components/Browser/Browser";

export default class BrowserController {

    constructor(
        private browser: BrowserHandle
    ) {}

    async execute<T = any>(script: string): Promise<T> {

        return await this.browser.execute(script);

    }

    reload(): void {

        this.browser.reload();

    }

    back(): void {

        this.browser.goBack();

    }

    forward(): void {

        this.browser.goForward();

    }

    async url(): Promise<string> {

        return await this.execute(`
            location.href;
        `);

    }

    async title(): Promise<string> {

        return await this.execute(`
            document.title;
        `);

    }

}