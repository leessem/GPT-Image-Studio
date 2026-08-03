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

  // Manually mutating the DOM (innerHTML + a synthetic beforeinput/input
  // InputEvent) was tried first, but confirmed live to be a false
  // success: it makes the composer visibly show the text and even makes
  // ChatGPT's own send button appear/enable, but ChatGPT's rich-text
  // editor (ProseMirror) never registers the change in its own internal
  // document model - a synthetic InputEvent carries no real
  // getTargetRanges() data for it to read. The message that actually
  // gets submitted on Send is read from that internal model, not the
  // DOM, so it went out empty every time (confirmed by inspecting the
  // real sent message, not just the composer's DOM). A simulated paste
  // event runs through ProseMirror's real paste-handling pipeline
  // instead, which does update its internal model correctly - confirmed
  // live: the resulting sent message contains the real text.
  const dataTransfer = new DataTransfer();

  dataTransfer.setData("text/plain", text);

  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer
  });

  editor.dispatchEvent(pasteEvent);

  console.log(
    "[ChatGPT] prompt text inserted into editor via paste event, editor.innerText now:",
    editor.innerText
  );
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

  // Scoped to ChatGPT's own "imagegen-image" container class (confirmed
  // live via direct DOM inspection - not guessed), never document
  // order or a message-author-role attribute (ChatGPT's current DOM
  // does not set one at all). The backend-api URL pattern alone is not
  // enough to identify a generated image: it also matches a
  // Workspace's own uploaded image AND unrelated UI chrome (confirmed
  // live - even the sidebar's account icon shares this same URL
  // pattern). Matching anywhere in the document risked clicking the
  // wrong one whenever it happened to sort last (confirmed live: this
  // opened a preview of the uploaded photo, which has no Save/Download
  // control, reporting a false "download button not found" error even
  // though ChatGPT had generated the image correctly, and separately
  // confirmed live that the uploaded image is never inside an
  // "imagegen-image" container). Automation must never rely on
  // clicking the uploaded image - this makes that structurally
  // impossible, not just unlikely.
  const containers = document.querySelectorAll('[class*="imagegen-image"]');

  const lastContainer = containers[containers.length - 1];

  if (!lastContainer) {
    return { success: false, reason: "no generated-image container found" };
  }

  const image = lastContainer.querySelector(selector);

  if (!image) {
    return { success: false, reason: "generated image not found within the image-gen container" };
  }

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

// ============================================================================
// P0-2: Image Upload Integration
//
// There is no CDP access from inside executeJavaScript, so a file input's
// .files can't be set directly (browsers block that for security). Instead
// this rebuilds the exact uploaded image (the same data: URL shown in the
// Job's own "Uploaded Image" preview - never a re-encoded copy) into a real
// File, wraps it in a DataTransfer, and dispatches a drag-and-drop sequence
// at the composer - the same mechanism a user dragging a file in would
// trigger. Selectors here are a best-effort, generic heuristic (never
// live-verified against chatgpt.com's actual DOM the way the download
// button selectors were) - see WORKLOG.
// ============================================================================

/**
 * Shared diagnostic snapshot embedded in the upload scripts below - gives
 * enough DOM state to actually diagnose a failure (not just "it failed").
 */
function buildDomSnapshotSnippet() {
  return `
  const domSnapshot = () => {
    const editor = document.querySelector("#prompt-textarea");
    const composerForm = editor ? (editor.closest("form") || editor.parentElement) : null;
    return {
      hasComposer: !!editor,
      composerTag: composerForm ? composerForm.tagName : null,
      composerHTML: composerForm ? composerForm.outerHTML.slice(0, 1500) : null,
      imgCountInComposer: composerForm ? composerForm.querySelectorAll("img").length : 0,
      fileInputCount: document.querySelectorAll('input[type="file"]').length,
      fileInputs: Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
        id: el.id,
        name: el.name,
        accept: el.accept,
        hidden: el.hidden,
      })),
      currentUrl: location.href,
    };
  };
`;
}

export function buildUploadImageScript(dataUrl: string, fileName = "upload.png") {
  return `
(() => {

  return (async () => {
${buildDomSnapshotSnippet()}
    try {

      const dataUrl = ${JSON.stringify(dataUrl)};
      const fileName = ${JSON.stringify(fileName)};

      console.log("[ChatGPT] [Step 3/10] Locating upload control (file input)");

      const editor = document.querySelector("#prompt-textarea");

      const composerForm = editor ? (editor.closest("form") || editor.parentElement) : null;

      // ChatGPT's composer already renders real <input type="file"> controls
      // (confirmed live via domSnapshot: #upload-photos, accept="image/*")
      // for its own "add photos & files" button - use the same control
      // instead of simulating a drag/drop onto the form. Live-verified: the
      // drag/drop simulation was non-deterministic (one live run silently
      // never attached the file, another triggered an unrelated navigation)
      // whereas setting a real file input's .files is the standard,
      // reliable way to script a file input.
      const fileInput =
        document.querySelector("#upload-photos") ||
        (composerForm ? composerForm.querySelector('input[type="file"]') : null) ||
        document.querySelector('input[type="file"]');

      if (!fileInput) {

        const snapshot = domSnapshot();

        console.error("[ChatGPT] [Step 3/10] FAILED - upload control not found", {
          selector: "#upload-photos, input[type=file]",
          domSnapshot: snapshot
        });

        return {
          success: false,
          step: 3,
          stepName: "upload-control-found",
          selector: "#upload-photos, input[type=file]",
          domSnapshot: snapshot,
          reason: "file input not found in DOM"
        };

      }

      console.log("[ChatGPT] [Step 3/10] OK - upload control found", {
        selector: fileInput.id ? ("#" + fileInput.id) : "input[type=file]",
        id: fileInput.id,
        accept: fileInput.accept
      });

      console.log("[ChatGPT] [Step 4/10] Building File + DataTransfer from uploaded image");

      let file;

      try {

        // fetch(dataUrl) was tried first, but ChatGPT's page CSP blocks it
        // (confirmed live: "TypeError: Failed to fetch") - decode the
        // base64 payload directly instead, which never touches the
        // network and so is unaffected by connect-src.
        const commaIndex = dataUrl.indexOf(",");
        const header = dataUrl.slice(0, commaIndex);
        const base64 = dataUrl.slice(commaIndex + 1);
        const mimeMatch = header.match(/data:(.*?);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        file = new File([bytes], fileName, { type: mimeType });

      }
      catch (decodeErr) {

        const snapshot = domSnapshot();

        console.error("[ChatGPT] [Step 4/10] FAILED - could not decode data URL into a File", {
          selector: "atob(dataUrl)",
          domSnapshot: snapshot,
          reason: String(decodeErr)
        });

        return {
          success: false,
          step: 4,
          stepName: "image-injected",
          selector: "atob(dataUrl)",
          domSnapshot: snapshot,
          reason: "atob(dataUrl) decode failed: " + String(decodeErr)
        };

      }

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      fileInput.files = dataTransfer.files;

      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));

      console.log("[ChatGPT] [Step 4/10] OK - file assigned to input and change dispatched", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      return { success: true, step: 4, stepName: "image-injected" };

    }
    catch (err) {

      const snapshot = domSnapshot();

      console.error("[ChatGPT] [Step 4/10] FAILED - unexpected error", {
        domSnapshot: snapshot,
        reason: String(err)
      });

      return {
        success: false,
        step: 4,
        stepName: "image-injected",
        domSnapshot: snapshot,
        reason: String(err)
      };

    }

  })();

})();
`;
}

export function buildWaitUploadScript() {
  return `
(() => {
${buildDomSnapshotSnippet()}
  return new Promise((resolve) => {

    const timeoutMs = 20000;
    const pollMs = 200;
    const startedAt = Date.now();

    const scope = () => {
      const editor = document.querySelector("#prompt-textarea");
      return editor ? (editor.closest("form") || editor.parentElement) : document;
    };

    // A "count went up" baseline doesn't work here: this script runs as its
    // own separate executeJavaScript call, after buildUploadImageScript's
    // call already completed - by the time this baseline would be taken,
    // the thumbnail has often already rendered, so a same-script "before"
    // count is meaningless. Match ChatGPT's own uploaded-file thumbnail
    // directly instead - confirmed live (real DOM capture) that once
    // ChatGPT ingests the file, it renders an <img> whose src is its own
    // backend-api file endpoint (the same host pattern already used above
    // by GENERATED_IMAGE_SELECTOR for generated images, scoped here to the
    // composer only so it can't match a result image in the message list).
    const uploadedThumbSelector = 'img[src*="/backend-api/estuary/content"]';

    console.log("[ChatGPT] [Step 5/10] Waiting for upload preview thumbnail", {
      selector: uploadedThumbSelector + " (within composer form/parent)"
    });

    const check = () => {

      const thumb = scope().querySelector(uploadedThumbSelector);

      if (thumb) {

        console.log("[ChatGPT] [Step 5/10] OK - upload preview detected", {
          src: thumb.src.slice(0, 120)
        });

        console.log("[ChatGPT] [Step 6/10] OK - upload completed");

        resolve({ success: true, step: 6, stepName: "upload-completed" });

        return;

      }

      if (Date.now() - startedAt > timeoutMs) {

        const snapshot = domSnapshot();

        console.error("[ChatGPT] [Step 5/10] FAILED - upload preview not detected within timeout", {
          selector: uploadedThumbSelector + " (within composer form/parent)",
          domSnapshot: snapshot
        });

        resolve({
          success: false,
          step: 5,
          stepName: "upload-preview-detected",
          selector: uploadedThumbSelector + " (within composer form/parent)",
          domSnapshot: snapshot,
          reason: "upload thumbnail not detected within timeout"
        });

        return;

      }

      setTimeout(check, pollMs);

    };

    check();

  });

})();
`;
}

// ============================================================================
// Image Preview race condition (intermittent): after an upload,
// ChatGPT can - not every time - end up showing an image preview/
// lightbox (the same 'div[role="dialog"]' the generated-image viewer
// later uses) instead of the normal composer. Continuing automation
// while that's open is unreliable (the enlarged image is covering the
// real interface), so this step runs right after the upload-completed
// check and BEFORE prompt insertion: verify the normal chat interface
// (composer) is active, and if a preview is open instead, close it
// first - automation must never continue with one open.
// ============================================================================

export function buildEnsureNormalChatInterfaceScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const timeoutMs = 5000;
    const pollMs = 100;
    const startedAt = Date.now();

    const dialog = document.querySelector('div[role="dialog"]');

    if (!dialog) {
      console.log("[ChatGPT] [Step 6.5/10] OK - no preview open, normal chat interface already active");
      resolve({ success: true, wasOpen: false });
      return;
    }

    console.warn("[ChatGPT] [Step 6.5/10] Preview/dialog unexpectedly open after upload - closing it before continuing");

    // Same language-independent close-button matching as
    // buildCloseImageViewerScript. Escape is a safe fallback here
    // (unlike after Send, nothing is generating yet at this point in
    // the pipeline, so there is no "stop conversation" shortcut to
    // accidentally trigger).
    const CLOSE_ARIA_LABEL_CANDIDATES = ["전체 화면 닫기", "닫기", "close"];
    const CLOSE_ICON_HREF_CANDIDATES = ["85f94b"];

    const elements = Array.from(dialog.querySelectorAll('button, [role="button"]'));

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
      dialog.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        bubbles: true,
        cancelable: true,
      }));
    }

    const check = () => {

      const stillOpen = document.querySelector('div[role="dialog"]');

      if (stillOpen) {

        if (Date.now() - startedAt > timeoutMs) {
          console.error("[ChatGPT] [Step 6.5/10] FAILED - preview did not close");
          resolve({ success: false, wasOpen: true, reason: "preview did not close" });
          return;
        }

        setTimeout(check, pollMs);
        return;

      }

      const editor = document.querySelector("#prompt-textarea");

      if (!editor) {
        console.error("[ChatGPT] [Step 6.5/10] FAILED - composer not found after closing preview");
        resolve({ success: false, wasOpen: true, reason: "composer not found after closing preview" });
        return;
      }

      console.log("[ChatGPT] [Step 6.5/10] OK - preview closed, normal chat interface active again");

      resolve({ success: true, wasOpen: true });

    };

    check();

  });

})();
`;
}

// ============================================================================
// A freshly-created Workspace webview navigates to its saved
// conversationUrl (see BrowserPool.ensure()), a real page load - so,
// unlike every other step here, which always ran on an already-settled
// page, the composer isn't guaranteed to exist yet the instant that
// navigation resolves. This just waits for it before anything else runs.
// ============================================================================

export function buildWaitComposerReadyScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const timeoutMs = 15000;
    const pollMs = 200;
    const startedAt = Date.now();

    const check = () => {

      if (document.querySelector("#prompt-textarea")) {
        resolve({ success: true });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        resolve({
          success: false,
          reason: "composer not ready within timeout"
        });
        return;
      }

      setTimeout(check, pollMs);

    };

    check();

  });

})();
`;
}