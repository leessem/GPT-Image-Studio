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

    // Clicking send does not always register - if it fires in the same
    // tick as the just-dispatched input event, it races ahead of React
    // processing that event and the click is a silent no-op (confirmed
    // via network monitoring: the click reaches "conversation/prepare"
    // but never follows through to the real send). A fixed delay before
    // clicking does not reliably fix this (verified: still flaky). So
    // instead of guessing a delay, click, then poll for an OBSERVABLE
    // sign that ChatGPT actually accepted the message, and retry the
    // click (bounded) if none appears in time.

    const composerSelector = "#prompt-textarea";
    const sendButtonSelector = "#composer-submit-button";
    const userMessageSelector = '[data-message-author-role="user"]';
    const assistantMessageSelector = '[data-message-author-role="assistant"]';

    const maxAttempts = 5;
    const buttonWaitMs = 5000;
    const acceptWaitMs = 3000;
    const pollMs = 50;

    const baselineUserMessageCount =
      document.querySelectorAll(userMessageSelector).length;

    const baselineAssistantMessageCount =
      document.querySelectorAll(assistantMessageSelector).length;

    const isGeneratingState = () => {

      const sendButton = document.querySelector(sendButtonSelector);

      return !!(
        sendButton &&
        (
          sendButton.getAttribute("data-testid") === "stop-button" ||
          (sendButton.getAttribute("aria-label") || "").includes("중지") ||
          (sendButton.getAttribute("aria-label") || "").toLowerCase().includes("stop")
        )
      );

    };

    // The previous job's generation can still be finishing (button still
    // showing "stop/generating") when this job's send happens. Checking
    // "is it generating right now" would then be true even though it has
    // nothing to do with THIS message, giving a false positive. Track the
    // observed state across polls and only accept on an actual
    // not-generating -> generating transition.
    let lastObservedGeneratingState = isGeneratingState();

    // Checked in the required priority order; returns the first signal
    // that confirms ChatGPT accepted the message, or null if none yet.
    const checkAccepted = () => {

      const editor = document.querySelector(composerSelector);

      if (editor && editor.innerText.trim() === "") {
        return "textarea-empty";
      }

      if (
        document.querySelectorAll(userMessageSelector).length >
        baselineUserMessageCount
      ) {
        return "user-message-count-increased";
      }

      if (
        document.querySelectorAll(assistantMessageSelector).length >
        baselineAssistantMessageCount
      ) {
        return "assistant-generation-started";
      }

      const currentGeneratingState = isGeneratingState();

      const becameGenerating =
        !lastObservedGeneratingState && currentGeneratingState;

      lastObservedGeneratingState = currentGeneratingState;

      if (becameGenerating) {
        return "send-button-generating-state";
      }

      return null;

    };

    let attempt = 0;

    const attemptSend = () => {

      attempt++;

      console.log("[ChatGPT] send attempt " + attempt + "/" + maxAttempts);

      const buttonWaitStartedAt = Date.now();

      const waitForButton = () => {

        const sendButton = document.querySelector(sendButtonSelector);

        if (!sendButton) {

          if (Date.now() - buttonWaitStartedAt > buttonWaitMs) {
            console.error("[ChatGPT] #composer-submit-button not found (attempt " + attempt + ")");
            resolve({
              success: false,
              step: "send-button-not-found",
              reason: "send button not found"
            });
            return;
          }

          setTimeout(waitForButton, pollMs);
          return;

        }

        sendButton.click();

        console.log("[ChatGPT] send button clicked (attempt " + attempt + ")");

        const acceptWaitStartedAt = Date.now();

        const waitForAcceptance = () => {

          const acceptedBy = checkAccepted();

          if (acceptedBy) {
            console.log("[ChatGPT] message accepted (" + acceptedBy + ")");
            resolve({
              success: true,
              step: "send-clicked",
              acceptedBy
            });
            return;
          }

          if (Date.now() - acceptWaitStartedAt > acceptWaitMs) {

            console.error(
              "[ChatGPT] send attempt " + attempt + " not accepted within " + acceptWaitMs + "ms"
            );

            if (attempt >= maxAttempts) {
              console.error("[ChatGPT] message not accepted after " + attempt + " attempts");
              resolve({
                success: false,
                step: "send-not-accepted",
                reason: "message was not accepted by ChatGPT after " + attempt + " attempts"
              });
              return;
            }

            attemptSend();
            return;

          }

          setTimeout(waitForAcceptance, pollMs);

        };

        waitForAcceptance();

      };

      waitForButton();

    };

    attemptSend();

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

  return new Promise((resolve) => {

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
      resolve({ success: false, reason: "download button not found" });
      return;
    }

    console.log("[ChatGPT] download button found (matched by: " + matchedBy + ")");

    downloadButton.click();

    console.log("[ChatGPT] download button clicked");

    // 한 번의 응답에서 이미지가 여러 장 생성된 경우("시리즈") 이 컨트롤은
    // 즉시 다운로드하지 않고 메뉴를 연다(aria-haspopup="menu"). 메뉴가
    // 실제로 나타나는지는 폴링으로 관찰하고(고정 지연 아님), 나타나면
    // "이 이미지 한 장만" 다운로드하는 항목을 찾아 클릭한다.

    const SINGLE_DOWNLOAD_TEXT_CANDIDATES = ["다운로드", "download"];
    const SERIES_TEXT_CANDIDATES = ["시리즈", "series"];

    const menuWaitMs = 1500;
    const pollMs = 50;
    const startedAt = Date.now();

    const checkForMenu = () => {

      const menu = document.querySelector('[role="menu"][data-state="open"]');

      if (menu) {

        const items = Array.from(
          menu.querySelectorAll(
            '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'
          )
        ).map(el => ({
          el,
          text: (el.textContent || "").trim(),
        }));

        console.log(
          "[ChatGPT] download menu items:",
          JSON.stringify(items.map(i => i.text.slice(0, 60)))
        );

        const singleItem = items.find(i =>
          SINGLE_DOWNLOAD_TEXT_CANDIDATES.some(
            k => i.text.toLowerCase().includes(k.toLowerCase())
          ) &&
          !SERIES_TEXT_CANDIDATES.some(
            k => i.text.toLowerCase().includes(k.toLowerCase())
          )
        );

        if (!singleItem) {
          console.error(
            "[ChatGPT] download menu opened but no single-image download item found"
          );
          resolve({ success: false, reason: "download menu item not found" });
          return;
        }

        singleItem.el.click();

        console.log(
          "[ChatGPT] download menu item clicked: " + singleItem.text.slice(0, 60)
        );

        resolve({ success: true });
        return;

      }

      if (Date.now() - startedAt > menuWaitMs) {
        // No menu appeared - the click already triggered a direct
        // download (the single-image case).
        resolve({ success: true });
        return;
      }

      setTimeout(checkForMenu, pollMs);

    };

    checkForMenu();

  });

})();
`;
}

export function buildCloseImageViewerScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const timeoutMs = 5000;
    const pollMs = 100;
    const startedAt = Date.now();

    const finish = (result) => {

      if (result.success) {
        console.log("[ChatGPT] image viewer closed, composer active again");
      } else {
        console.error("[ChatGPT] " + result.reason);
      }

      resolve(result);

    };

    // Dispatching an Escape keydown was tried first, but it also
    // reaches ChatGPT's own global shortcut handling and triggers a
    // "stop conversation" call that breaks the next send - confirmed
    // via network monitoring (a stray POST /backend-api/
    // stop_conversation fired right after Escape, and the following
    // message's send never got past the "prepare" step). Click the
    // dialog's own close control instead - same language-independent
    // matching approach as the download button (data-testid ->
    // aria-label -> button role -> svg icon -> text).
    const dialog = document.querySelector('div[role="dialog"]');

    if (dialog) {

      const CLOSE_ARIA_LABEL_CANDIDATES = ["전체 화면 닫기", "닫기", "close"];
      const CLOSE_ICON_HREF_CANDIDATES = ["85f94b"];

      const elements = Array.from(
        dialog.querySelectorAll('button, [role="button"]')
      );

      const candidates = elements.map(el => ({
        el,
        ariaLabel: el.getAttribute("aria-label"),
        role: el.getAttribute("role") || el.tagName.toLowerCase(),
        iconHref: el.querySelector("svg use")?.getAttribute("href") || null,
      }));

      let closeButton = candidates.find(c =>
        c.ariaLabel &&
        CLOSE_ARIA_LABEL_CANDIDATES.some(
          k => c.ariaLabel === k || c.ariaLabel.toLowerCase().includes(k.toLowerCase())
        )
      )?.el;

      if (!closeButton) {
        closeButton = candidates.find(c =>
          c.role === "button" &&
          c.iconHref &&
          CLOSE_ICON_HREF_CANDIDATES.some(k => c.iconHref.includes(k))
        )?.el;
      }

      if (closeButton) {
        closeButton.click();
      } else {
        console.error("[ChatGPT] viewer close button not found, falling back to Escape");
        dialog.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        }));
      }

    }

    const check = () => {

      const stillOpen = document.querySelector(
        'div[role="dialog"][data-state="open"]'
      );

      if (stillOpen) {

        if (Date.now() - startedAt > timeoutMs) {
          finish({ success: false, reason: "image viewer did not close" });
          return;
        }

        setTimeout(check, pollMs);
        return;

      }

      const editor = document.querySelector("#prompt-textarea");

      if (!editor) {
        finish({ success: false, reason: "prompt textarea not found after closing viewer" });
        return;
      }

      editor.focus();

      if (document.activeElement !== editor) {
        finish({ success: false, reason: "prompt textarea did not become active" });
        return;
      }

      finish({ success: true });

    };

    check();

  });

})();
`;
}