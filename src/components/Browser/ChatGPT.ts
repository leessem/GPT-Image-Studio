// ChatGPT UI update (2026-10): confirmed live via a user-submitted
// Diagnostics zip that the composer element lost its `id="prompt-textarea"`
// entirely - the real element is now a ProseMirror-driven contenteditable
// div (`class="ProseMirror"`, `role="textbox"`, no id, no data-testid) with
// the same live DOM otherwise unchanged. `#prompt-textarea` is kept first
// in this selector in case ChatGPT ever reinstates it (forward/backward
// compatible, free - querySelector just returns the first match, and only
// one composer exists on the page); `div[contenteditable="true"][role="textbox"]`
// is the confirmed-live replacement, scoped past a bare `[contenteditable="true"]`
// (which matched exactly 1 element in the captured DOM, but is wide enough
// to risk matching something else ChatGPT adds later) by also requiring the
// textbox role the real composer actually carries.
const COMPOSER_SELECTOR =
  '#prompt-textarea, div[contenteditable="true"][role="textbox"]';

// ChatGPT UI update (2026-10), same Diagnostics capture as above: the send
// button also lost its `id="composer-submit-button"` - it is now a plain
// `<button type="submit" aria-label="보내기">` inside
// `<form data-chatgpt-composer>` (the only type=submit button in that
// form). Old id kept first for the same forward/backward reason.
const SEND_BUTTON_SELECTOR =
  '#composer-submit-button, form[data-chatgpt-composer] button[type="submit"]';

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
  const stripKnownMarkdownAutoformatLines = (value) => {
    const lines = value.split("\\n");

    // A line beginning with an ordered-list marker ("1. ", "2. ", ...) AT
    // THE START of the pasted text becomes a real <ol><li> element - the
    // marker itself renders as CSS ::marker content, which
    // editor.innerText never includes (confirmed live via a real
    // DebugLogs export: a Prompt Library template starting with
    // "1. 인물 사진:" read back from the composer as just "인물 사진:",
    // failing verification even though the paste itself was correct).
    // Only line 0 is affected - CommonMark's list-start rule requires
    // being at the start of a block, so a later line that happens to
    // start with a number is untouched. Strips only the marker prefix,
    // keeping the rest of that line's content, unlike the whole-line
    // filters below.
    if (lines.length > 0) {
      lines[0] = lines[0].replace(/^\\d+\\.\\s+/, "");
    }

    return lines
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
  };

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

    const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

    if (!editor) {
      console.error("[ChatGPT] composer element not found");
      done({
        success: false,
        step: "textarea-not-found",
        reason: "prompt-textarea not found"
      });
      return;
    }

    console.log("[ChatGPT] composer element found");

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

          // ChatGPT UI update (2026-10): confirmed via a user-submitted
          // Diagnostics zip that with the new composer, a Send clicked
          // ~60ms after this verification passed delivered the image
          // WITHOUT the prompt text, even though the composer DOM showed
          // it. Not yet confirmed live which internal state lags the DOM,
          // so give the composer a settle window and re-verify the text
          // is still there before allowing Send - a composer that reset
          // itself in the meantime fails here instead of silently
          // sending an image-only message.
          const settleMs = 1000;

          setTimeout(() => {

            const current = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

            if (
              !current ||
              normalizeForCompare(current.innerText) !== expectedForCompare
            ) {
              console.error("[ChatGPT] prompt text did not survive the settle window", {
                actual: current ? current.innerText : null
              });
              done({
                success: false,
                step: "prompt-lost-after-paste",
                reason: "composer no longer contained the prompt " + settleMs + "ms after paste",
                timeline: { clearedAt, pastedAt, verificationStartedAt: verifyStartedAt, verifiedAt }
              });
              return;
            }

            done({
              success: true,
              step: "inserted",
              timeline: { clearedAt, pastedAt, verificationStartedAt: verifyStartedAt, verifiedAt }
            });

          }, settleMs);

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

    const composerSelector = ${JSON.stringify(COMPOSER_SELECTOR)};
    const sendButtonSelector = ${JSON.stringify(SEND_BUTTON_SELECTOR)};
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

        // ChatGPT UI update (2026-10): confirmed via a user-submitted
        // Diagnostics zip that the previous attempt's click can be
        // accepted AFTER its acceptWaitMs window closed - the composer
        // then empties and ChatGPT swaps the send button for its voice
        // button, so this retry reported "send button not found" for a
        // message that had actually been sent. Re-check acceptance before
        // every retry click instead of clicking (or failing) blindly.
        if (attempt > 1) {

          const lateAcceptedBy = checkAccepted();

          if (lateAcceptedBy) {
            acceptedAt = Date.now();
            console.log("[ChatGPT] previous send attempt accepted late (" + lateAcceptedBy + ")");
            resolve({
              success: true,
              step: "send-clicked",
              acceptedBy: lateAcceptedBy,
              timeline: { ...insertTimeline, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
            });
            return;
          }

        }

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
              "[ChatGPT] send button " +
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

// ============================================================================
// v1.3.1 TXT Attachment Mode
//
// Confirmed live (real DebugLogs/<session>/composer.html capture, taken
// mid-paste of a ~10.5K-character Prompt Library entry): ChatGPT's OWN
// paste handler - not this app - converts sufficiently long pasted text
// into a file/document attachment tile instead of inline ProseMirror
// content, the same "붙여넣은 텍스트 -> 문서" behavior a real Ctrl+V
// produces in a normal browser tab. This app never builds a .txt file
// itself; it dispatches the exact same synthetic ClipboardEvent paste
// buildPromptScript's own insertPromptText already uses (proven live to
// reach ChatGPT's real paste-handling pipeline, including its Markdown-
// autoformat transforms - see the "---"/bare-list-marker/ordered-list-
// marker fixes elsewhere in this file), and lets ChatGPT itself decide
// how to render it.
//
// The captured DOM: every attached file (an uploaded image AND a long-
// pasted-text document alike) renders as its own
// `[role="group"][aria-label]` "file tile" inside the composer's header
// row; the text tile's aria-label is ChatGPT's own truncated preview of
// what it attached (e.g. "Create a professiona.."). At the moment of
// capture #prompt-textarea's own innerText was completely empty (its
// content moved into the tile, not inline) - buildPromptScript's own
// text-comparison verification would (and, in that same capture, did)
// fail/timeout against this, which is why TXT mode needs its own
// verification, not a bypass of verification altogether.
// ============================================================================

/**
 * v1.3.2 TXT Attachment Mode - confirmed live (user-reported, then
 * user-verified) that ChatGPT does not reliably treat a pasted-as-
 * document Prompt's content as an image-generation instruction on its
 * own - it can just reply discussing it instead. Prepending this fixed
 * line to the front of the attached text itself is what made
 * generation fire reliably, replacing v1.3.1's separate follow-up
 * trigger message (which itself could race with ChatGPT's own timing
 * and occasionally produce a duplicate 2nd image - see WORKLOG Session
 * 33/34). Locked - never part of a Prompt Library entry's own editable
 * `prompt` field (see PromptModal.tsx's read-only banner); generate.ts
 * prepends it to every TXT-mode Prompt's substituted text right before
 * it's pasted, so it can never be edited out or omitted per-Prompt.
 */
export const TXT_ATTACHMENT_FORCE_INSTRUCTION =
  "(Important) When GPT recognizes this text, treat it as a prompt and generate an image for it";

/**
 * v1.3.1 TXT Attachment Mode - a deliberately separate script from
 * buildPromptScript (never a shared/parameterized version of it), so a
 * Prompt Library entry with "TXT 첨부 방식" OFF keeps going through
 * buildPromptScript exactly as before, byte-for-byte unchanged.
 *
 * Sends the SAME paste event buildPromptScript's own insertPromptText
 * dispatches, then verifies EITHER of two ChatGPT-decided outcomes
 * (never forces one): (A) a new file/document attachment tile appeared
 * - the expected outcome for a genuinely long prompt, confirmed live -
 * or (B) the text landed as ordinary inline text instead (ChatGPT chose
 * not to convert it, e.g. because it was short enough), verified the
 * same Markdown-autoformat-tolerant way buildPromptScript's own
 * insertPromptText already does. Either way the actual bytes dispatched
 * in the paste event are exactly `prompt`, untouched - a file/document
 * attachment is stored as opaque text and is never re-parsed as rich
 * text the way inline ProseMirror content is, so TXT mode structurally
 * cannot suffer the Markdown-autoformat corruption inline paste can.
 *
 * A file tile's own aria-label is only a truncated preview (confirmed
 * live, e.g. "Create a professiona.."), never the full attached text -
 * this app has no way to read a collapsed tile's full content back out
 * of the DOM, so verification here confirms the RIGHT tile appeared
 * (its preview prefix matches the start of `prompt`), not full byte-
 * for-byte tile content equality.
 */
export function buildTxtPromptScript(prompt: string) {
  return `
(() => {

  console.log("[ChatGPT] buildTxtPromptScript executing");

  return new Promise((resolve) => {

    const text = ${JSON.stringify(prompt)};

    // Fallback-path tolerance only (Path B below) - identical rules to
    // buildPromptScript's own insertPromptText, see that function's own
    // comments for why each pattern is stripped before comparison.
    const normalizeForCompare = (value) => value.replace(/\\s+/g, " ").trim();

    const stripKnownMarkdownAutoformatLines = (value) => {
      const lines = value.split("\\n");

      if (lines.length > 0) {
        lines[0] = lines[0].replace(/^\\d+\\.\\s+/, "");
      }

      return lines
        .filter((line) => {
          const trimmed = line.trim();
          const isHorizontalRule = /^(-{3,}|\\*{3,}|_{3,})$/.test(trimmed);
          const isEmptyListMarker = /^[-+*]$/.test(trimmed);
          return !(isHorizontalRule || isEmptyListMarker);
        })
        .join("\\n");
    };

    const expectedForCompare = normalizeForCompare(stripKnownMarkdownAutoformatLines(text));

    const composerSelector = ${JSON.stringify(COMPOSER_SELECTOR)};
    const sendButtonSelector = ${JSON.stringify(SEND_BUTTON_SELECTOR)};
    const userMessageSelector = '[data-message-author-role="user"]';
    const assistantMessageSelector = '[data-message-author-role="assistant"]';

    // Confirmed live via a real composer.html capture - see this
    // function's own doc comment above.
    const fileTileSelector = '[role="group"][aria-label]';

    const editor = document.querySelector(composerSelector);

    if (!editor) {
      console.error("[ChatGPT] composer element not found");
      resolve({ success: false, step: "textarea-not-found", reason: "prompt-textarea not found" });
      return;
    }

    console.log("[ChatGPT] composer element found");

    editor.focus();

    // Same shared-partition stale-draft guard as the normal path
    // (buildPromptScript's own insertPromptText) - see that function's
    // comment for why this is needed at all.
    document.execCommand("selectAll", false, undefined);
    document.execCommand("insertText", false, "");

    const clearTimeoutMs = 2000;
    const clearPollMs = 50;
    const clearStartedAt = Date.now();

    let clearedAt = null;
    let pastedAt = null;
    let attachedAt = null;
    let sendButtonFoundAt = null;
    let sendEnabledAt = null;
    let sendClickedAt = null;
    let acceptedAt = null;

    const baselineUserMessageCount = document.querySelectorAll(userMessageSelector).length;
    const baselineAssistantMessageCount = document.querySelectorAll(assistantMessageSelector).length;

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

    let lastObservedGeneratingState = isGeneratingState();

    // Deliberately DOES NOT include buildPromptScript's own
    // "textarea-empty" signal - confirmed live that in TXT mode
    // #prompt-textarea is ALREADY empty before Send is even clicked
    // (the pasted text lives in the file tile, not inline), so that
    // check would report a false "accepted" on the very first poll
    // regardless of whether the click actually registered.
    const checkAccepted = () => {

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

      const becameGenerating = !lastObservedGeneratingState && currentGeneratingState;

      lastObservedGeneratingState = currentGeneratingState;

      if (becameGenerating) {
        return "send-button-generating-state";
      }

      return null;

    };

    const maxAttempts = 5;
    const buttonWaitMs = 5000;
    const acceptWaitMs = 3000;
    const pollMs = 50;

    let attempt = 0;

    const attemptSend = () => {

      attempt++;

      console.log("[ChatGPT] TXT send attempt " + attempt + "/" + maxAttempts);

      const buttonWaitStartedAt = Date.now();

      const waitForButton = () => {

        // ChatGPT UI update (2026-10): confirmed via a user-submitted
        // Diagnostics zip that the previous attempt's click can be
        // accepted AFTER its acceptWaitMs window closed - the composer
        // then empties and ChatGPT swaps the send button for its voice
        // button, so this retry reported "send button not found" for a
        // message that had actually been sent. Re-check acceptance before
        // every retry click instead of clicking (or failing) blindly.
        if (attempt > 1) {

          const lateAcceptedBy = checkAccepted();

          if (lateAcceptedBy) {
            acceptedAt = Date.now();
            console.log("[ChatGPT] previous send attempt accepted late (" + lateAcceptedBy + ")");
            resolve({
              success: true,
              step: "send-clicked",
              acceptedBy: lateAcceptedBy,
              timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
            });
            return;
          }

        }

        const sendButton = document.querySelector(sendButtonSelector);

        if (sendButton && sendButtonFoundAt === null) {
          sendButtonFoundAt = Date.now();
        }

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
              "[ChatGPT] send button " +
              (sendButton ? "disabled" : "not found") +
              " (TXT attempt " + attempt + ")"
            );

            // Confirmed live: unlike an image upload, ChatGPT's own
            // server-side processing of a pasted document attachment
            // can occasionally take longer than a single buttonWaitMs
            // window to finish settling, leaving Send disabled past
            // it - retrying (same bounded maxAttempts as the
            // not-accepted case below) gives it another window instead
            // of failing the whole run on one slow attempt.
            if (attempt >= maxAttempts) {

              resolve({
                success: false,
                step: sendButton ? "send-button-disabled" : "send-button-not-found",
                reason: reason + " after " + attempt + " attempts",
                timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
              });
              return;

            }

            attemptSend();
            return;

          }

          setTimeout(waitForButton, pollMs);
          return;

        }

        sendEnabledAt = Date.now();

        sendButton.click();

        sendClickedAt = Date.now();

        console.log("[ChatGPT] TXT send button clicked (attempt " + attempt + ")");

        const acceptWaitStartedAt = Date.now();

        const waitForAcceptance = () => {

          const acceptedBy = checkAccepted();

          if (acceptedBy) {
            acceptedAt = Date.now();
            console.log("[ChatGPT] TXT message accepted (" + acceptedBy + ")");
            resolve({
              success: true,
              step: "send-clicked",
              acceptedBy,
              timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
            });
            return;
          }

          if (Date.now() - acceptWaitStartedAt > acceptWaitMs) {

            console.error(
              "[ChatGPT] TXT send attempt " + attempt + " not accepted within " + acceptWaitMs + "ms"
            );

            if (attempt >= maxAttempts) {
              console.error("[ChatGPT] TXT message not accepted after " + attempt + " attempts");
              resolve({
                success: false,
                step: "send-not-accepted",
                reason: "message was not accepted by ChatGPT after " + attempt + " attempts",
                timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
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

    const waitForClear = () => {

      if (editor.innerText.trim() === "") {
        clearedAt = Date.now();
        pasteAsTxt();
        return;
      }

      if (Date.now() - clearStartedAt > clearTimeoutMs) {
        console.error("[ChatGPT] composer did not clear before TXT paste");
        resolve({
          success: false,
          step: "composer-clear-failed",
          reason: "composer still contained leftover text before TXT paste",
          timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
        });
        return;
      }

      setTimeout(waitForClear, clearPollMs);

    };

    const pasteAsTxt = () => {

      const baselineTileCount = document.querySelectorAll(fileTileSelector).length;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text/plain", text);

      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });

      editor.dispatchEvent(pasteEvent);

      pastedAt = Date.now();

      const attachTimeoutMs = 20000;
      const attachPollMs = 200;
      const attachStartedAt = Date.now();

      const waitForAttached = () => {

        // Path A (expected outcome for a genuinely long TXT-mode
        // prompt, confirmed live): ChatGPT converted the paste into
        // its own new file/document tile.
        const tiles = Array.from(document.querySelectorAll(fileTileSelector));

        if (tiles.length > baselineTileCount) {

          const newTile = tiles[tiles.length - 1];
          const tileLabel = (newTile.getAttribute("aria-label") || "").trim();
          const previewPrefix = tileLabel.replace(/\\.{2,}$/, "");

          const contentMatches =
            previewPrefix.length === 0 ||
            text.trim().startsWith(previewPrefix);

          if (contentMatches) {

            attachedAt = Date.now();
            console.log("[ChatGPT] TXT attachment tile detected", { tileLabel });
            attemptSend();
            return;

          }

          console.warn(
            "[ChatGPT] a new file tile appeared but its label did not match this prompt - still waiting",
            { tileLabel }
          );

        }

        // Path B (fallback): the prompt was short enough that ChatGPT
        // did not convert it - it landed as ordinary inline text
        // instead, same as the normal (non-TXT) path.
        if (
          editor.innerText.trim() !== "" &&
          normalizeForCompare(editor.innerText) === expectedForCompare
        ) {

          attachedAt = Date.now();
          console.log("[ChatGPT] TXT prompt landed as normal inline text (below ChatGPT's own attachment threshold)");
          attemptSend();
          return;

        }

        if (Date.now() - attachStartedAt > attachTimeoutMs) {
          console.error("[ChatGPT] neither a TXT attachment tile nor matching inline text appeared after paste");
          resolve({
            success: false,
            step: "txt-attachment-not-detected",
            reason: "neither a TXT attachment tile nor matching inline text appeared after paste",
            timeline: { clearedAt, pastedAt, attachedAt, sendButtonFoundAt, sendEnabledAt, sendClickedAt, acceptedAt }
          });
          return;
        }

        setTimeout(waitForAttached, attachPollMs);

      };

      waitForAttached();

    };

    waitForClear();

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
//
// ChatGPT UI update (2026-10): confirmed via Export Diagnostics'
// live_page_survey.json on a real finished generation that the
// "imagegen-image" container and the backend-api URL are both gone
// (count 0). A generated image is now
//   div[data-testid="generated-image-gallery"]
//     > ... > button[data-testid="generated-image-preview"]
//       > img[alt="생성된 이미지 1"][src="blob:..."]
// while the user's own uploaded photo sits in the user message
// (alt="사용자 첨부 파일"), outside that gallery - so the testid scoping
// keeps the same "never mistake the uploaded photo" guarantee.
const NEW_GENERATED_IMAGE_SELECTOR =
  '[data-testid="generated-image-preview"] img';

const GENERATED_IMAGE_IN_CONTAINER_SELECTOR =
  '[class*="imagegen-image"] img[src*="/backend-api/estuary/content"], ' +
  NEW_GENERATED_IMAGE_SELECTOR;

// Shared by buildWaitImageScript's timeout report and
// buildPageImageSurveyScript (Export Diagnostics) - describes an <img>
// plus its ancestor chain, read-only.
function buildImageSurveySnippet() {
  return `
  const describeAncestors = (el) => {
    const chain = [];
    let node = el.parentElement;
    for (let i = 0; node && i < 8; i++, node = node.parentElement) {
      const cls = typeof node.className === "string" ? node.className.slice(0, 120) : "";
      chain.push(
        node.tagName.toLowerCase() +
        (node.id ? "#" + node.id : "") +
        (node.getAttribute("data-testid") ? "[data-testid=" + node.getAttribute("data-testid") + "]" : "") +
        (node.getAttribute("role") ? "[role=" + node.getAttribute("role") + "]" : "") +
        (cls ? " ." + cls : "")
      );
    }
    return chain;
  };

  const describeImage = (img) => ({
    src: (img.getAttribute("src") || "").slice(0, 100),
    alt: img.getAttribute("alt"),
    className: typeof img.className === "string" ? img.className.slice(0, 160) : "",
    natural: img.naturalWidth + "x" + img.naturalHeight,
    rendered: img.clientWidth + "x" + img.clientHeight,
    ancestors: describeAncestors(img)
  });
`;
}

/**
 * Debug Mode only - run by Export Diagnostics against the current tab's
 * webview at the moment of export, so a stuck run (e.g. a generated
 * image the detection selector no longer matches) leaves evidence
 * without waiting for any timeout. Read-only.
 */
export function buildPageImageSurveyScript() {
  return `
(() => {
${buildImageSurveySnippet()}
  const images = Array.from(document.querySelectorAll("img"));
  return JSON.stringify({
    url: location.href,
    capturedAt: new Date().toISOString(),
    imageCount: images.length,
    imagegenContainerCount: document.querySelectorAll('[class*="imagegen-image"]').length,
    estuaryImageCount: document.querySelectorAll('img[src*="/backend-api/estuary/content"]').length,
    dialogOpen: !!document.querySelector('div[role="dialog"]'),
    dialogControls: Array.from(document.querySelectorAll('div[role="dialog"] button, div[role="dialog"] a[href], div[role="dialog"] [role="button"]'))
      .slice(0, 40)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        testId: el.getAttribute("data-testid"),
        ariaLabel: el.getAttribute("aria-label"),
        title: el.getAttribute("title"),
        href: el.tagName === "A" ? (el.getAttribute("href") || "").slice(0, 80) : null,
        download: el.getAttribute("download"),
        iconHref: el.querySelector("svg use") ? el.querySelector("svg use").getAttribute("href") : null,
        text: (el.textContent || "").trim().slice(0, 40)
      })),
    lastImages: images.slice(-10).map(describeImage)
  }, null, 2);
})();
`;
}

export function buildWaitImageScript() {
  return `
(() => {
${buildImageSurveySnippet()}

  return new Promise((resolve) => {

    const selector = ${JSON.stringify(GENERATED_IMAGE_IN_CONTAINER_SELECTOR)};

    const startCount = document.querySelectorAll(selector).length;

    // ChatGPT UI update (2026-10): confirmed live (user screenshot + a
    // Diagnostics zip) that a generated image can be fully rendered while
    // this selector never matches, and this wait previously had NO
    // timeout - Generate just hung forever with no evidence left behind.
    // Now it gives up after timeoutMs and reports every <img> that
    // appeared since it started (src prefix, alt, size, ancestor chain),
    // so the next Diagnostics zip shows the new generated-image DOM
    // instead of anyone guessing the replacement selector.
    const timeoutMs = 180000;

    const startedAt = Date.now();

    const startImages = new Set(Array.from(document.querySelectorAll("img")));

    const surveyNewImages = () =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => !startImages.has(img))
        .slice(-6)
        .map(describeImage);

    // The new preview <img> can exist while ChatGPT is still rendering
    // the image (progressive preview), so a new match alone isn't "done":
    // the newest one must be fully loaded with a stable src, ChatGPT must
    // not be showing its stop/generating control, and all of that must
    // hold for settleMs.
    const settleMs = 2000;

    let settledSince = null;

    let lastSrc = null;

    const isGenerating = () =>
      !!document.querySelector(
        '[data-testid="stop-button"], button[aria-label*="중지"], button[aria-label*="Stop"]'
      );

    const check = () => {

      const images = Array.from(document.querySelectorAll(selector));

      const newest = images[images.length - 1];

      const newestSrc = newest ? newest.getAttribute("src") : null;

      const readyNow =
        images.length > startCount &&
        !!newest &&
        newest.complete &&
        newest.naturalWidth > 0 &&
        newestSrc === lastSrc &&
        !isGenerating();

      lastSrc = newestSrc;

      if (!readyNow) {
        settledSince = null;
      }
      else if (settledSince === null) {
        settledSince = Date.now();
      }

      if (settledSince !== null && Date.now() - settledSince >= settleMs) {
        resolve({ success: true });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        resolve({
          success: false,
          reason: "generated image not detected within " + (timeoutMs / 1000) + "s",
          imagegenContainerCount: document.querySelectorAll('[class*="imagegen-image"]').length,
          newImages: surveyNewImages()
        });
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

  // ChatGPT UI update (2026-10) - see NEW_GENERATED_IMAGE_SELECTOR: no
  // "imagegen-image" container any more; the newest generated image is
  // the last generated-image-preview button, which is itself the
  // clickable control.
  if (!lastContainer) {

    const previews = document.querySelectorAll('[data-testid="generated-image-preview"]');

    const lastPreview = previews[previews.length - 1];

    const previewImage = lastPreview ? lastPreview.querySelector("img") : null;

    if (!lastPreview || !previewImage) {
      return { success: false, reason: "no generated-image container or preview found" };
    }

    // Confirmed live (two Diagnostics runs): the same .click() opened the
    // viewer within 1s once, and another time nothing opened for 15s. So
    // don't trust a single click - after each attempt, wait briefly for
    // the viewer (div[role="dialog"]) and escalate to the next way of
    // clicking only if it hasn't opened. Still only ever targets the
    // newest generated-image preview, never the uploaded photo.
    const pointerClick = (el) => {
      const rect = el.getBoundingClientRect();
      const init = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      };
      el.dispatchEvent(new PointerEvent("pointerdown", init));
      el.dispatchEvent(new MouseEvent("mousedown", init));
      el.dispatchEvent(new PointerEvent("pointerup", init));
      el.dispatchEvent(new MouseEvent("mouseup", init));
      el.dispatchEvent(new MouseEvent("click", init));
    };

    const attempts = [
      ["preview-button-click", () => lastPreview.click()],
      ["preview-image-click", () => previewImage.click()],
      ["preview-pointer-sequence", () => {
        lastPreview.scrollIntoView({ block: "center" });
        pointerClick(previewImage);
      }]
    ];

    const attemptWaitMs = 2500;

    return new Promise((resolve) => {

      let index = 0;

      const runAttempt = () => {

        if (document.querySelector('div[role="dialog"]')) {
          resolve({ success: true, matchedBy: index === 0 ? "already-open" : attempts[index - 1][0] });
          return;
        }

        if (index >= attempts.length) {
          // Leave the final verdict to buildWaitImageViewerScript, which
          // the caller runs next - this just reports what was tried.
          resolve({ success: true, matchedBy: "all-attempts-dispatched" });
          return;
        }

        const [name, act] = attempts[index];

        index++;

        console.log("[ChatGPT] opening image viewer via " + name);

        act();

        const startedAt = Date.now();

        const poll = () => {
          if (document.querySelector('div[role="dialog"]')) {
            resolve({ success: true, matchedBy: name });
            return;
          }
          if (Date.now() - startedAt > attemptWaitMs) {
            runAttempt();
            return;
          }
          setTimeout(poll, 100);
        };

        poll();

      };

      runAttempt();

    });

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

    // ChatGPT UI update (2026-10): previously unbounded - if the viewer
    // never opens, fail with a reason instead of hanging Generate forever.
    const timeoutMs = 15000;

    const startedAt = Date.now();

    const check = () => {

      const dialog = document.querySelector('div[role="dialog"]');

      if (dialog) {
        resolve({ success: true });
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        resolve({ success: false, reason: "image viewer dialog did not open within " + (timeoutMs / 1000) + "s" });
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
    // ChatGPT UI update (2026-10): the new image viewer's control is an
    // icon-only download button (confirmed via screenshot_at_export.png),
    // whose Korean label is "다운로드", not "저장".
    const ARIA_LABEL_CANDIDATES = ["저장", "다운로드", "download"];
    const ICON_HREF_CANDIDATES = ["1a3695"];
    const TEXT_CANDIDATES = ["저장", "다운로드", "download"];

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

    // 6. ChatGPT UI update (2026-10): the new viewer is a full-page
    // "ImageViewer" panel whose top bar (zoom / download / share / close)
    // need not sit inside div[role="dialog"] - so if nothing matched in
    // that scope, search the whole page, but ONLY by an exact
    // data-testid/aria-label match (never the looser icon/text
    // fallbacks), so an unrelated page control can't be clicked.
    if (!downloadButton && dialog !== document) {
      const pageMatch = Array.from(
        document.querySelectorAll('button, a[href], [role="button"]')
      ).find(el => {
        const testId = (el.getAttribute("data-testid") || "").toLowerCase();
        const ariaLabel = (el.getAttribute("aria-label") || "").trim().toLowerCase();
        return (
          DATA_TESTID_CANDIDATES.some(k => testId.includes(k)) ||
          ["다운로드", "download", "이미지 다운로드", "download image"].includes(ariaLabel)
        );
      });
      downloadButton = pageMatch;
      matchedBy = downloadButton ? "page-exact-label" : null;
    }

    if (!downloadButton) {
      console.error("[ChatGPT] download button not found");
      // ChatGPT UI update (2026-10): return what WAS there, so the
      // Diagnostics zip shows the new viewer's controls instead of only
      // the browser console having them.
      resolve({
        success: false,
        reason: "download button not found",
        dialogFound: dialog !== document,
        candidates: candidates.slice(0, 40).map(c => ({
          testId: c.testId,
          ariaLabel: c.ariaLabel,
          role: c.role,
          iconHref: c.iconHref,
          text: c.text.slice(0, 40)
        }))
      });
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

      const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

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
    const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});
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

      const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

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

export function buildWaitUploadScript(expectedCount = 1) {
  return `
(() => {
${buildDomSnapshotSnippet()}
  return new Promise((resolve) => {

    const timeoutMs = 60000;
    const pollMs = 200;
    const startedAt = Date.now();
    const expectedCount = ${JSON.stringify(expectedCount)};

    const scope = () => {
      const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});
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
    //
    // Multi Image Upload (v1.4.1): expectedCount lets generate.ts wait for
    // the Nth thumbnail specifically (called once per image, right after
    // that image's own buildUploadImageScript call) instead of just "any
    // thumbnail" - a single-image Generate always passes expectedCount=1,
    // which is exactly the old querySelector-truthy check below, so that
    // path is unchanged.
    //
    // ChatGPT UI update (2026-10): confirmed via a user-submitted
    // Diagnostics zip that the composer thumbnail is now an
    // <img src="data:image/..."> inside a [data-composer-attachments]
    // container - no backend-api URL at all, so the old selector alone
    // never matched and Step 5 always timed out. Both forms are accepted.
    //
    // A second Diagnostics zip then showed the new thumbnail appears
    // while the file is STILL uploading (screenshot: grey tile with a
    // spinner) and the send button stays enabled the whole time - so
    // neither "thumbnail exists" nor "send enabled" means done, and
    // sending at that moment delivered the image WITHOUT the prompt text.
    // In the new UI, each attachment tile is therefore only considered
    // done once it holds an <img> and no loading indicator (any svg
    // outside its remove button, animate-spin, role=progressbar,
    // aria-busy=true - the confirmed finished tile contains only the
    // <img>, an aria-hidden ring span, and the remove button), and that
    // has held steadily for settleMs. Every distinct tile markup seen
    // while waiting is recorded in attachmentStates (data: URLs
    // stripped) so the next Diagnostics shows the real in-progress DOM.
    const uploadedThumbSelector =
      'img[src*="/backend-api/estuary/content"], [data-composer-attachments] img';

    const attachmentTileSelector = '[data-composer-attachments] [role="button"]';

    const settleMs = 1000;

    let settledSince = null;

    const attachmentStates = [];

    const tileHtml = (tile) =>
      tile.outerHTML
        .replace(/src="data:[^"]*"/g, 'src="data:..."')
        .replace(/ class="[^"]*"/g, "")
        .slice(0, 1500);

    const tileIsBusy = (tile) => {

      if (!tile.querySelector("img")) {
        return true;
      }

      const indicator = Array.from(
        tile.querySelectorAll('svg, [class*="animate-spin"], [role="progressbar"], [aria-busy="true"]')
      ).find((el) => !el.closest("button"));

      return !!indicator;

    };

    console.log("[ChatGPT] [Step 5/10] Waiting for upload preview thumbnail", {
      selector: uploadedThumbSelector + " (within composer form/parent)",
      expectedCount
    });

    const check = () => {

      const thumbs = scope().querySelectorAll(uploadedThumbSelector);

      const tiles = Array.from(scope().querySelectorAll(attachmentTileSelector));

      tiles.forEach((tile) => {
        const html = tileHtml(tile);
        if (attachmentStates.length < 8 && !attachmentStates.includes(html)) {
          attachmentStates.push(html);
        }
      });

      // Old UI (no attachment tiles): backend-api thumbnail alone means
      // done, exactly as before.
      const settledNow =
        thumbs.length >= expectedCount &&
        (tiles.length === 0 || (tiles.length >= expectedCount && !tiles.some(tileIsBusy)));

      if (!settledNow) {
        settledSince = null;
      }
      else if (settledSince === null) {
        settledSince = Date.now();
      }

      if (settledSince !== null && Date.now() - settledSince >= settleMs) {

        console.log("[ChatGPT] [Step 5/10] OK - upload preview detected", {
          count: thumbs.length,
          src: thumbs[thumbs.length - 1].src.slice(0, 120)
        });

        console.log("[ChatGPT] [Step 6/10] OK - upload completed");

        resolve({ success: true, step: 6, stepName: "upload-completed", attachmentStates });

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
          attachmentStates,
          reason: "upload thumbnail not detected (or still loading) within timeout"
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

      const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

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

    const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

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

      if (document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)})) {
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

    const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

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
          target.matches && target.matches(${JSON.stringify(SEND_BUTTON_SELECTOR)}) &&
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
 *
 * ChatGPT UI update (2026-10): a real "composer-not-ready" failure
 * (#prompt-textarea missing after buildWaitComposerReadyScript's own
 * 15s timeout) previously produced an EMPTY composer.html/composer.txt
 * here too - this function's only fallback for "editor not found" was
 * `{composerHtml: null, composerText: null}`, so a selector actually
 * going stale left zero DOM evidence to diagnose it from (confirmed
 * live via a user-submitted Diagnostics zip: error.log showed
 * stage=composer-not-ready, but composer.html/composer.txt were both
 * 0 bytes). When the known selector is missing, this now surveys the
 * page for plausible composer candidates instead of giving up - every
 * contenteditable element, every textarea, and the page's own visible
 * placeholder/input text (ChatGPT always renders SOME kind of message
 * input, even when its internal id/class names changed) - so the next
 * captured snapshot actually contains the new DOM to read the
 * replacement selector off of.
 */
export function buildCaptureComposerSnapshotScript() {
  return `
(() => {

  try {

    const editor = document.querySelector(${JSON.stringify(COMPOSER_SELECTOR)});

    if (editor) {

      const form = editor.closest("form") || editor.parentElement;

      return {
        composerHtml: form ? form.outerHTML : editor.outerHTML,
        composerText: editor.innerText,
      };

    }

    // Fallback survey - #prompt-textarea not found. Never assumes
    // which of these candidates is the real composer; just reports
    // everything plausible so a human (or a later code fix) can tell.
    const describe = (el, label) => {

      let outer = "";

      try {
        outer = el.outerHTML || "";
      }
      catch {
        outer = "(outerHTML read failed)";
      }

      return (
        "----- " + label + " -----\\n" +
        "tag=" + el.tagName +
        " id=" + JSON.stringify(el.id || null) +
        " class=" + JSON.stringify(el.className || null) +
        " data-testid=" + JSON.stringify(el.getAttribute("data-testid")) +
        " contenteditable=" + JSON.stringify(el.getAttribute("contenteditable")) +
        "\\n" + outer.slice(0, 2000) +
        (outer.length > 2000 ? "\\n...(" + (outer.length - 2000) + " more chars truncated)" : "") +
        "\\n"
      );

    };

    const sections = [];

    sections.push(
      "url=" + location.href +
      " title=" + JSON.stringify(document.title) +
      " bodyLength=" + document.body.innerHTML.length
    );

    const contentEditables = Array.from(
      document.querySelectorAll('[contenteditable="true"]')
    );

    sections.push(
      "contenteditable[contenteditable=true] count=" + contentEditables.length
    );

    contentEditables.slice(0, 5).forEach((el, i) => {
      sections.push(describe(el, "contenteditable #" + i));
    });

    const textareas = Array.from(document.querySelectorAll("textarea"));

    sections.push("textarea count=" + textareas.length);

    textareas.slice(0, 5).forEach((el, i) => {
      sections.push(describe(el, "textarea #" + i));
    });

    // The composer's own placeholder/input row is always visible to the
    // user even when the underlying selector changed (confirmed live -
    // see the submitted screenshot showing "ChatGPT에게 물어보세요"/
    // "Message ChatGPT") - find it by that visible text as a last
    // resort, independent of any id/class ChatGPT may have renamed.
    const placeholderMatches = Array.from(document.querySelectorAll("*")).filter(el => {
      const text = (el.textContent || "").trim();
      return (
        el.children.length === 0 &&
        text.length > 0 &&
        text.length < 60 &&
        (
          text.includes("물어보세요") ||
          text.toLowerCase().includes("message chatgpt") ||
          text.toLowerCase().includes("ask anything")
        )
      );
    });

    sections.push("placeholder-text matches count=" + placeholderMatches.length);

    placeholderMatches.slice(0, 3).forEach((el, i) => {
      const container = el.closest("form") || el.parentElement?.parentElement || el.parentElement || el;
      sections.push(describe(container, "placeholder-match container #" + i));
    });

    return {
      composerHtml: sections.join("\\n"),
      composerText: "#prompt-textarea NOT FOUND - see composer.html for a DOM survey",
    };

  }
  catch (err) {

    return { composerHtml: null, composerText: null, error: String(err) };

  }

})();
`;
}