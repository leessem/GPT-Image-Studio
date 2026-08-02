function buildInsertPromptTextSnippet(prompt: string) {
  return `
  const text = ${JSON.stringify(prompt)};

  const editor = document.querySelector("#prompt-textarea");

  if (!editor) {
    console.error("[ChatGPT] #prompt-textarea not found");
    return {
      success: false,
      step: "textarea-not-found",
      reason: "prompt-textarea not found"
    };
  }

  console.log("[ChatGPT] #prompt-textarea found");

  editor.focus();

  const selection = window.getSelection();

  if (!selection) {
    console.error("[ChatGPT] window.getSelection() returned null");
    return {
      success: false,
      step: "selection-not-found",
      reason: "selection not found"
    };
  }

  selection.removeAllRanges();

  const range = document.createRange();

  range.selectNodeContents(editor);

  range.collapse(true);

  selection.addRange(range);

  editor.innerHTML = "";

  const p = document.createElement("p");

  p.textContent = text;

  editor.appendChild(p);

  editor.dispatchEvent(new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: text
  }));

  editor.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: text
  }));

  console.log("[ChatGPT] prompt text inserted into editor");
`;
}

export function buildInsertPromptScript(prompt: string) {
  return `
(() => {

  console.log("[ChatGPT] buildInsertPromptScript executing");
${buildInsertPromptTextSnippet(prompt)}
  return {
    success: true,
    step: "inserted"
  };

})();
`;
}

export function buildPromptScript(prompt: string) {
  return `
(() => {

  console.log("[ChatGPT] buildPromptScript executing");
${buildInsertPromptTextSnippet(prompt)}
  return new Promise((resolve) => {

    const timeoutMs = 5000;
    const pollMs = 100;
    const startedAt = Date.now();

    const checkSendButton = () => {

      const sendButton = document.querySelector("#composer-submit-button");

      if (sendButton) {

        sendButton.click();

        console.log("[ChatGPT] send button clicked");

        resolve({
          success: true,
          step: "send-clicked"
        });

        return;

      }

      if (Date.now() - startedAt > timeoutMs) {
        console.error("[ChatGPT] #composer-submit-button not found");
        resolve({
          success: false,
          step: "send-button-not-found",
          reason: "send button not found"
        });
        return;
      }

      setTimeout(checkSendButton, pollMs);

    };

    checkSendButton();

  });

})();
`;
}

const GENERATED_IMAGE_SELECTOR = 'img[src*="/backend-api/estuary/content"]';

export function buildWaitImageScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const selector = ${JSON.stringify(GENERATED_IMAGE_SELECTOR)};

    const startCount = document.querySelectorAll(selector).length;

    const check = () => {

      const images = Array.from(document.querySelectorAll(selector));

      if (images.length > startCount) {
        resolve({ success: true });
        return;
      }

      setTimeout(check, 1000);

    };

    check();

  });

})();
`;
}

export function buildOpenImageViewerScript() {
  return `
(() => {

  const selector = ${JSON.stringify(GENERATED_IMAGE_SELECTOR)};

  const images = Array.from(document.querySelectorAll(selector));

  if (images.length === 0) {
    return { success: false, reason: "generated image not found" };
  }

  const image = images[images.length - 1];

  image.click();

  return { success: true };

})();
`;
}

export function buildWaitImageViewerScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const check = () => {

      const dialog = document.querySelector('div[role="dialog"]');

      if (dialog) {
        resolve({ success: true });
        return;
      }

      setTimeout(check, 300);

    };

    check();

  });

})();
`;
}

export function buildClickDownloadButtonScript() {
  return `
(() => {

  // Download/Save 컨트롤은 ChatGPT UI 언어에 따라 라벨이 달라진다
  // (한국어: "저장", 영어: "Download"). 언어에 의존하지 않도록
  // data-testid -> aria-label -> button role -> svg 아이콘 -> 텍스트
  // 순으로 후보를 찾는다.

  const DATA_TESTID_CANDIDATES = ["download", "save"];
  const ARIA_LABEL_CANDIDATES = ["저장", "download"];
  const ICON_HREF_CANDIDATES = ["1a3695"];
  const TEXT_CANDIDATES = ["저장", "download"];

  const dialog = document.querySelector('div[role="dialog"]') || document;

  const elements = Array.from(
    dialog.querySelectorAll('button, a[href], [role="button"]')
  );

  const candidates = elements.map(el => ({
    el,
    testId: el.getAttribute("data-testid"),
    ariaLabel: el.getAttribute("aria-label"),
    role: el.getAttribute("role") || el.tagName.toLowerCase(),
    iconHref: el.querySelector("svg use")?.getAttribute("href") || null,
    text: (el.textContent || "").trim(),
  }));

  console.log(
    "[ChatGPT] download button candidates:",
    JSON.stringify(candidates.map(c => ({
      testId: c.testId,
      ariaLabel: c.ariaLabel,
      role: c.role,
      iconHref: c.iconHref,
      text: c.text.slice(0, 30),
    })))
  );

  // 1. data-testid
  let downloadButton = candidates.find(c =>
    c.testId &&
    DATA_TESTID_CANDIDATES.some(k => c.testId.toLowerCase().includes(k))
  )?.el;

  let matchedBy = downloadButton ? "data-testid" : null;

  // 2. aria-label (한국어 + 영어)
  if (!downloadButton) {
    const match = candidates.find(c =>
      c.ariaLabel &&
      ARIA_LABEL_CANDIDATES.some(
        k => c.ariaLabel === k || c.ariaLabel.toLowerCase().includes(k.toLowerCase())
      )
    );
    downloadButton = match?.el;
    matchedBy = downloadButton ? "aria-label" : null;
  }

  // 3. button role (버튼/role="button" 요소로 한정 - 이후 fallback의 오탐 방지용)
  const roleFiltered = candidates.filter(
    c => c.role === "button"
  );

  // 4. svg 아이콘 (실제 DOM 조사로 확인된 아이콘 스프라이트 fragment)
  if (!downloadButton) {
    const match = roleFiltered.find(c =>
      c.iconHref &&
      ICON_HREF_CANDIDATES.some(k => c.iconHref.includes(k))
    );
    downloadButton = match?.el;
    matchedBy = downloadButton ? "svg-icon" : null;
  }

  // 5. 텍스트 (마지막 fallback, 한국어 + 영어)
  if (!downloadButton) {
    const match = roleFiltered.find(c =>
      TEXT_CANDIDATES.some(k => c.text.toLowerCase().includes(k.toLowerCase()))
    );
    downloadButton = match?.el;
    matchedBy = downloadButton ? "text" : null;
  }

  if (!downloadButton) {
    console.error("[ChatGPT] download button not found");
    return { success: false, reason: "download button not found" };
  }

  console.log("[ChatGPT] download button found (matched by: " + matchedBy + ")");

  downloadButton.click();

  console.log("[ChatGPT] download button clicked");

  return { success: true };

})();
`;
}