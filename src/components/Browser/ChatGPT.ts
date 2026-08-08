function buildInsertPromptTextSnippet(prompt: string) {
  return `
  const text = ${JSON.stringify(prompt)};

  // ProseMirror renders each paragraph as its own block element, and a
  // contentEditable's innerText pads every block boundary with its own
  // newline - confirmed live: a source prompt with blank-line-separated
  // paragraphs (e.g. a "prompt / Negative prompt:" template) came back
  // from editor.innerText with MORE newlines at every paragraph break
  // than the original text had (3 in a row became 8). That's ProseMirror's
  // own DOM serialization, not a sign the paste lost or corrupted
  // anything, so comparing raw strings for exact equality would time out
  // and fail on every multi-paragraph prompt. Collapse all whitespace
  // runs before comparing - still catches a genuinely wrong/missing/
  // leftover-mixed-in prompt (the actual words and their order must still
  // match), just ignores how many newlines/spaces ended up between them.
  const normalizeForCompare = (value) => value.replace(/\\s+/g, " ").trim();

  // ChatGPT's own composer applies Markdown autoformatting to certain
  // pasted lines, converting them into structural elements instead of
  // literal text - confirmed live (see WORKLOG Session 29): a line
  // consisting solely of "---" became a horizontal-rule element, and a
  // line consisting solely of "+" became an empty list-item marker,
  // both vanishing from editor.innerText entirely (not reformatted,
  // gone). That's ChatGPT's own editor behavior on ANY pasted text
  // matching these patterns, not something this app's paste triggers or
  // could avoid - the same transform would happen from a real Ctrl+V of
  // the same text. Verification only ever strips these EXACT, narrowly-
  // matched line patterns from a comparison COPY - never from \`text\`
  // itself (what's actually pasted) and never anywhere near the stored
  // Prompt Library entry, which this function never touches. Every
  // other difference (wrong words, missing content, a leftover draft)
  // still fails verification exactly as before.
  const stripKnownMarkdownAutoformatLines = (value) =>
    value
      .split("\\n")
      .filter((line) => {
        const trimmed = line.trim();
        // CommonMark thematic break (horizontal rule): 3+ of the same
        // character among -, *, _ and nothing else on the line.
        // "---" is the one confirmed live; *** and ___ follow the same
        // documented rule ChatGPT's paste-markdown parser evidently
        // implements.
        const isHorizontalRule = /^(-{3,}|\\*{3,}|_{3,})$/.test(trimmed);
        // A bare list-bullet character with no content after it -
        // "+" is the one confirmed live; "-" and "*" are the other two
        // valid CommonMark unordered-list markers.
        const isEmptyListMarker = /^[-+*]$/.test(trimmed);
        return !(isHorizontalRule || isEmptyListMarker);
      })
      .join("\\n");

  // Clears the composer, pastes in this Workspace's own prompt, and
  // verifies the composer contains that text - tolerating ChatGPT's own
  // known Markdown autoformat transforms above, but nothing else -
  // before calling done({success:true}). Never assumes the paste worked.
  const insertPromptText = (done) => {

    // Version 1.2.3 Debug Build: pure instrumentation, never read by
    // any success/failure decision below - just timestamps forwarded
    // on done() so pipeline.log can show real Prompt Insert Complete /
    // Prompt Verification timings when Debug Mode is on.
    let clearedAt = null;
    let pastedAt = null;
    let verifiedAt = null;

    const editor = document.querySelector("#prompt-textarea");

    if (!editor) {
      console.error("[ChatGPT] #prompt-textarea not found");
      done({
        success: false,
        step: "textarea-not-found",
        reason: "prompt-textarea not found"
      });
      return;
    }

    console.log("[ChatGPT] #prompt-textarea found");

    editor.focus();

    // The composer can already contain leftover text that has nothing to
    // do with this Workspace's own prompt - all Workspace webviews share
    // one Electron partition for one shared login (see Browser.tsx), and
    // ChatGPT persists an unsent composer draft in that same shared
    // storage, restoring it on load independently of anything this app
    // does. Confirmed live: without clearing first, that leftover draft
    // survived the paste below completely untouched and was the text
    // actually sent to ChatGPT instead of this Workspace's real prompt.
    // Select-all + insertText("") goes through the same native
    // contentEditable editing pipeline as the paste below (unlike a raw
    // DOM mutation - see the comment on the paste itself), so
    // ProseMirror's internal model is actually cleared, not just what's
    // visible in the DOM.
    document.execCommand("selectAll", false, undefined);
    document.execCommand("insertText", false, "");

    const clearTimeoutMs = 2000;
    const clearPollMs = 50;
    const clearStartedAt = Date.now();

    const waitForClear = () => {

      if (editor.innerText.trim() === "") {
        clearedAt = Date.now();
        pasteText();
        return;
      }

      if (Date.now() - clearStartedAt > clearTimeoutMs) {
        console.error("[ChatGPT] composer did not clear within timeout", {
          remainingText: editor.innerText
        });
        done({
          success: false,
          step: "composer-clear-failed",
          reason: "composer still contained leftover text after clearing",
          timeline: { clearedAt, pastedAt, verifiedAt }
        });
        return;
      }

      setTimeout(waitForClear, clearPollMs);

    };

    const pasteText = () => {

      // Manually mutating the DOM (innerHTML + a synthetic beforeinput/
      // input InputEvent) was tried first, but confirmed live to be a
      // false success: it makes the composer visibly show the text and
      // even makes ChatGPT's own send button appear/enable, but
      // ChatGPT's rich-text editor (ProseMirror) never registers the
      // change in its own internal document model - a synthetic
      // InputEvent carries no real getTargetRanges() data for it to
      // read. The message that actually gets submitted on Send is read
      // from that internal model, not the DOM, so it went out empty
      // every time (confirmed by inspecting the real sent message, not
      // just the composer's DOM). A simulated paste event runs through
      // ProseMirror's real paste-handling pipeline instead, which does
      // update its internal model correctly - confirmed live: the
      // resulting sent message contains the real text.
      const dataTransfer = new DataTransfer();

      dataTransfer.setData("text/plain", text);

      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });

      editor.dispatchEvent(pasteEvent);

      pastedAt = Date.now();

      // The paste's effect on ProseMirror's model (and so on
      // editor.innerText) is not synchronous with dispatchEvent -
      // confirmed live: reading editor.innerText immediately after
      // dispatch still showed the pre-paste content. Poll for the
      // observable result instead of trusting the dispatch returned.
      const verifyTimeoutMs = 3000;
      const verifyPollMs = 50;
      const verifyStartedAt = Date.now();

      // Computed once, outside the poll loop - it's a pure function of
      // \`text\`, never of editor.innerText, so it never changes between
      // polls.
      const expectedForCompare = normalizeForCompare(
        stripKnownMarkdownAutoformatLines(text)
      );

      const waitForVerified = () => {

        if (
          editor.innerText.trim() !== "" &&
          normalizeForCompare(editor.innerText) === expectedForCompare
        ) {
          verifiedAt = Date.now();
          console.log(
            "[ChatGPT] prompt text inserted and verified, editor.innerText now:",
            editor.innerText
          );
          done({
            success: true,
            step: "inserted",
            timeline: { clearedAt, pastedAt, verificationStartedAt: verifyStartedAt, verifiedAt }
          });
          return;
        }

        if (Date.now() - verifyStartedAt > verifyTimeoutMs) {
          console.error("[ChatGPT] composer did not match the intended prompt after paste", {
            expected: text,
            expectedForCompare,
            actual: editor.innerText
          });
          done({
            success: false,
            step: "prompt-verification-failed",
            reason: "composer content did not match the intended prompt after paste",
            timeline: { clearedAt, pastedAt, verificationStartedAt: verifyStartedAt, verifiedAt }
          });
          return;
        }

        setTimeout(waitForVerified, verifyPollMs);

      };

      waitForVerified();

    };

    waitForClear();

  };
`;
}

export function buildInsertPromptScript(prompt: string) {
  return `
(() => {

  console.log("[ChatGPT] buildInsertPromptScript executing");
${buildInsertPromptTextSnippet(prompt)}
  return new Promise((resolve) => {
    insertPromptText(resolve);
  });

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

    // Version 1.2.3 Debug Build: pure instrumentation - overwritten on
    // each retry attempt, so a final success/failure carries the LAST
    // attempt's timestamps. Never read by any success/failure decision.
    let sendButtonFoundAt = null;
    let sendEnabledAt = null;
    let sendClickedAt = null;
    let acceptedAt = null;
    let insertTimeline = {};

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

        if (sendButton && sendButtonFoundAt === null) {
          sendButtonFoundAt = Date.now();
        }

        // A present-but-disabled button (native disabled attribute, or
        // ChatGPT's own aria-disabled while it's still settling the
        // just-attached image) silently no-ops a real click - wait for
        // BOTH existing and enabled, same bounded poll as the
        // not-found case below, before ever clicking it.
        const isDisabled =
          sendButton &&
          (
            sendButton.disabled ||
            sendButton.getAttribute("aria-disabled") === "true"
          );

        if (!sendButton || isDisabled) {

          if (Date.now() - buttonWaitStartedAt > buttonWaitMs) {

            const reason = sendButton
              ? "send button found but stayed disabled"
              : "send button not found";

            console.error(
              "[ChatGPT] #composer-submit-button " +
              (sendButton ? "disabled" : "not found") +
              " (attempt " + attempt + ")"
            );

            resolve({
              success: false,
              step: sendButton ? "send-button-disabled" : "send-button-not-found",
              reason,
              timeline: { ...insertTimeline, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
            });
            return;
          }

          setTimeout(waitForButton, pollMs);
          return;

        }

        sendEnabledAt = Date.now();

        sendButton.click();

        sendClickedAt = Date.now();

        console.log("[ChatGPT] send button clicked (attempt " + attempt + ")");

        const acceptWaitStartedAt = Date.now();

        const waitForAcceptance = () => {

          const acceptedBy = checkAccepted();

          if (acceptedBy) {
            acceptedAt = Date.now();
            console.log("[ChatGPT] message accepted (" + acceptedBy + ")");
            resolve({
              success: true,
              step: "send-clicked",
              acceptedBy,
              timeline: { ...insertTimeline, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
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
                reason: "message was not accepted by ChatGPT after " + attempt + " attempts",
                timeline: { ...insertTimeline, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
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

    insertPromptText((insertResult) => {

      if (!insertResult.success) {
        resolve(insertResult);
        return;
      }

      insertTimeline = insertResult.timeline || {};

      attemptSend();

    });

  });

})();
`;
}

const GENERATED_IMAGE_SELECTOR = 'img[src*="/backend-api/estuary/content"]';

// Scoped the same way buildOpenImageViewerScript() below already scopes
// its own search (see that function's comment): GENERATED_IMAGE_SELECTOR
// alone also matches a Workspace's own uploaded image (and unrelated UI
// chrome), so counting it unscoped let a re-rendered/duplicated
// uploaded-image thumbnail be mistaken for a newly generated one -
// proven live via a captured ws-audit.log: a Workspace's "image
// generation" step resolved in ~1.7s (far too fast for a real
// generation), then immediately failed to find a generated-image
// container, because what it "detected" was its own uploaded photo, not
// a generated one. ChatGPT only ever renders actual generated images
// inside an "imagegen-image" container (confirmed live, same as
// buildOpenImageViewerScript's own comment below), so scoping to it here
// too makes that false match structurally impossible.
const GENERATED_IMAGE_IN_CONTAINER_SELECTOR =
  '[class*="imagegen-image"] img[src*="/backend-api/estuary/content"]';

export function buildWaitImageScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const selector = ${JSON.stringify(GENERATED_IMAGE_IN_CONTAINER_SELECTOR)};

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
// If prompt insertion or Send failed for any reason (composer never
// cleared, paste never verified, send button never enabled, message
// never accepted), whatever text ended up in the composer must never be
// left sitting there. All Workspace webviews share one Electron
// partition (see Browser.tsx), and ChatGPT itself persists an unsent
// composer draft in that same shared storage, restoring it on load
// independently of anything this app does - a failed Workspace's
// leftover draft would otherwise leak into the next Workspace/webview
// that loads a chat view (confirmed live - see WORKLOG Session 28).
// Called from generate.ts only on the failure path, best-effort - never
// allowed to override or block the real error already being raised.
// ============================================================================

export function buildClearComposerScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const editor = document.querySelector("#prompt-textarea");

    if (!editor) {
      resolve({ success: false, reason: "prompt-textarea not found" });
      return;
    }

    editor.focus();

    document.execCommand("selectAll", false, undefined);
    document.execCommand("insertText", false, "");

    const timeoutMs = 2000;
    const pollMs = 50;
    const startedAt = Date.now();

    const check = () => {

      if (editor.innerText.trim() === "") {
        console.log("[ChatGPT] composer cleared after failed send");
        resolve({ success: true });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        console.error("[ChatGPT] composer did not clear after failed send", {
          remainingText: editor.innerText
        });
        resolve({ success: false, reason: "composer did not clear after failed send" });
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

// ============================================================================
// Version 1.2.3 Debug Build - forensic DOM observation, Debug Mode only.
//
// This runs inside the ChatGPT <webview>'s own guest page, which has no
// access to this app's window.ipcRenderer (preload is only injected
// into the main app window - a page the webview navigates to, like
// chatgpt.com, must never get that access, or any site it later loaded
// could reach this app's file-system APIs). console.log is the only
// bridge back: Browser.tsx listens for the <webview> element's own
// "console-message" DOM event and forwards any line carrying the
// "[DOM-LOG]" prefix into dom.log. Purely observational everywhere
// below - never calls preventDefault, never mutates the page, only
// reads and logs.
// ============================================================================

export function buildAttachDomObserverScript() {
  return `
(() => {

  try {

    // Idempotent across multiple Generate calls in the same persistent
    // webview page (a Workspace's webview is never reloaded between
    // Generate runs) - disconnect any previous observer before
    // attaching a new one so repeated runs never accumulate observers.
    if (window.__gptImageStudioDomObserver) {
      window.__gptImageStudioDomObserver.disconnect();
      window.__gptImageStudioDomObserver = null;
    }

    const editor = document.querySelector("#prompt-textarea");

    if (!editor) {
      return { success: false, reason: "prompt-textarea not found" };
    }

    if (!window.__gptImageStudioPasteBound) {
      editor.addEventListener("paste", () => {
        console.log("[DOM-LOG] Paste " + JSON.stringify({ at: Date.now() }));
      });
      window.__gptImageStudioPasteBound = true;
    }

    let settleTimer = null;
    let mutationCount = 0;
    let assistantSeen =
      document.querySelectorAll('[data-message-author-role="assistant"]').length > 0;
    let lastSendDisabled = null;

    const observer = new MutationObserver((mutations) => {

      if (mutationCount === 0) {
        console.log("[DOM-LOG] DOM Mutations " + JSON.stringify({ batchStartedAt: Date.now() }));
      }

      mutationCount += mutations.length;

      for (const m of mutations) {

        const target = m.target;

        if (
          target &&
          target.id === "composer-submit-button" &&
          m.type === "attributes"
        ) {

          const disabled = !!(
            target.disabled ||
            target.getAttribute("aria-disabled") === "true"
          );

          if (lastSendDisabled === true && disabled === false) {
            console.log("[DOM-LOG] Send Enabled " + JSON.stringify({ at: Date.now() }));
          }

          lastSendDisabled = disabled;

        }

      }

      if (!assistantSeen) {

        const count = document.querySelectorAll(
          '[data-message-author-role="assistant"]'
        ).length;

        if (count > 0) {
          assistantSeen = true;
          console.log("[DOM-LOG] Response Started " + JSON.stringify({ at: Date.now() }));
        }

      }

      if (settleTimer) clearTimeout(settleTimer);

      settleTimer = setTimeout(() => {
        console.log(
          "[DOM-LOG] Mutation Finished " +
          JSON.stringify({ totalMutations: mutationCount, at: Date.now() })
        );
        mutationCount = 0;
        settleTimer = null;
      }, 400);

    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "data-message-author-role"],
    });

    window.__gptImageStudioDomObserver = observer;

    return { success: true };

  }
  catch (err) {

    return { success: false, reason: String(err) };

  }

})();
`;
}

/**
 * Debug Mode only - used by the error-capture path (generate.ts) to
 * attach the composer's own HTML/text to a failure's forensic snapshot.
 * Read-only, same as everything else in this section.
 */
export function buildCaptureComposerSnapshotScript() {
  return `
(() => {

  try {

    const editor = document.querySelector("#prompt-textarea");

    if (!editor) {
      return { composerHtml: null, composerText: null };
    }

    const form = editor.closest("form") || editor.parentElement;

    return {
      composerHtml: form ? form.outerHTML : editor.outerHTML,
      composerText: editor.innerText,
    };

  }
  catch (err) {

    return { composerHtml: null, composerText: null, error: String(err) };

  }

})();
`;
}