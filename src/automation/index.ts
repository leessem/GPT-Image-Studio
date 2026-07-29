import BrowserController from "./BrowserController";
import PromptController from "./PromptController";
import GenerateController from "./GenerateController";
import DOMInspector from "./DOMInspector";

export default class Automation {

    browser: BrowserController;

    prompt: PromptController;

    generate: GenerateController;

    dom: DOMInspector;

    constructor(webview: Electron.WebviewTag){

        this.browser = new BrowserController(webview);

        this.prompt = new PromptController(this.browser);

        this.generate = new GenerateController(this.browser);

        this.dom = new DOMInspector(this.browser);

    }

}