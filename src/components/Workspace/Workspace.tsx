import { useRef } from "react";

import Browser, { BrowserHandle } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import ImageDrop from "../ImageDrop/ImageDrop";
import JobTabs from "./JobTabs";

import { buildPromptScript } from "../../browser/ChatGPT";

import "./Workspace.css";

export default function Workspace() {

    const browserRef = useRef<BrowserHandle>(null);

const handlePromptClick = async () => {

    const result = await browserRef.current?.execute(`
        ({
            url: location.href,
            title: document.title,
            buttons: document.querySelectorAll("button").length
        })
    `);

    alert(JSON.stringify(result, null, 2));

};

    return (

        <div className="workspace">

            <Toolbar/>

            <JobTabs/>

            <div className="workspace-body">

                <Prompt
                    onSelect={handlePromptClick}
                />

                <Browser
                    ref={browserRef}
                />

                <ImageDrop/>

            </div>

        </div>

    );

}