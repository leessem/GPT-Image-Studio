import { useRef } from "react";

import Browser, { BrowserHandle } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import ImageDrop from "../ImageDrop/ImageDrop";
import JobTabs from "./JobTabs";

import {
  buildPromptScript,
  buildWaitImageScript,
} from "../Browser/ChatGPT";

import "./Workspace.css";

export default function Workspace() {

  const browserRef = useRef<BrowserHandle>(null);

  const handlePromptClick = async (prompt: string) => {

    if (!browserRef.current)
      return;

    try {

      await browserRef.current.execute(
        buildPromptScript(prompt)
      );

      console.log("프롬프트 전송 완료");

      const result = await browserRef.current.execute(
        buildWaitImageScript()
      );

      console.log("이미지 생성 완료");

      console.log(result);

    } catch (err) {

      console.error(err);

    }

  };

  return (

    <div className="workspace">

      <Toolbar />

      <JobTabs />

      <div className="workspace-body">

        <Prompt
          onSelect={handlePromptClick}
        />

        <Browser
          ref={browserRef}
        />

        <ImageDrop />

      </div>

    </div>

  );

}