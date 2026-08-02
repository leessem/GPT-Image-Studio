export function buildPromptScript(prompt: string) {
  return `
(() => {

  console.log("[ChatGPT] buildPromptScript executing");

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

  const dialog = document.querySelector('div[role="dialog"]') || document;

  const candidates = Array.from(
    dialog.querySelectorAll("button, a[href]")
  );

  const downloadButton = candidates.find(el => {

    const label = (
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.textContent ||
      ""
    ).toLowerCase();

    return label.includes("download");

  });

  if (!downloadButton) {
    return { success: false, reason: "download button not found" };
  }

  downloadButton.click();

  return { success: true };

})();
`;
}