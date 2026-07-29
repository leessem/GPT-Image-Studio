export function buildPromptScript(prompt: string) {
  return `
(() => {

  const text = ${JSON.stringify(prompt)};

  const editor = document.querySelector("#prompt-textarea");

  if (!editor) {
    return {
      success: false,
      reason: "prompt-textarea not found"
    };
  }

  editor.focus();

  const selection = window.getSelection();

  if (!selection) {
    return {
      success: false,
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

  const sendButton = document.querySelector("#composer-submit-button");

  if (!sendButton) {
    return {
      success: false,
      reason: "send button not found"
    };
  }

  sendButton.click();

  return {
    success: true
  };

})();
`;
}

export function buildWaitImageScript() {
  return `
(() => {

  return new Promise((resolve) => {

    const selector = 'img[src*="/backend-api/estuary/content"]';

    const startCount = document.querySelectorAll(selector).length;

    const check = () => {

      const images = Array.from(document.querySelectorAll(selector));

      if (images.length > startCount) {

        const image = images[images.length - 1];

        resolve({
          success: true,
          src: image.src
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

export function buildReadImageScript(imageUrl: string) {
  return `
(async () => {

  try {

    const response = await fetch(${JSON.stringify(imageUrl)}, {
      credentials: "include"
    });

    if (!response.ok) {
      return {
        success: false,
        reason: "fetch failed : " + response.status
      };
    }

    const blob = await response.blob();

    const base64 = await new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);

      reader.onerror = reject;

      reader.readAsDataURL(blob);

    });

    return {
      success: true,
      data: base64
    };

  } catch (e) {

    return {
      success: false,
      reason: String(e)
    };

  }

})();
`;
}