export function buildPromptScript(prompt: string) {
    return `
(() => {

    const text = ${JSON.stringify(prompt)};

    const textarea = document.querySelector("textarea");

    if (!textarea) {
        return {
            success: false,
            reason: "textarea not found"
        };
    }

    textarea.focus();

    const setter =
        Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            "value"
        )?.set;

    if (setter) {
        setter.call(textarea, text);
    } else {
        textarea.value = text;
    }

    textarea.dispatchEvent(
        new Event("input", {
            bubbles: true
        })
    );

    textarea.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );

    textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true
        })
    );

    const sendButton =
        [...document.querySelectorAll("button")].find(btn => {

            if (
                btn.disabled ||
                btn.getAttribute("aria-disabled") === "true"
            ) {
                return false;
            }

            const aria =
                (btn.getAttribute("aria-label") || "").toLowerCase();

            const testid =
                (btn.getAttribute("data-testid") || "").toLowerCase();

            return (
                aria.includes("send") ||
                aria.includes("전송") ||
                testid.includes("send")
            );

        });

    if (sendButton) {
        sendButton.click();

        return {
            success: true,
            method: "button"
        };
    }

    textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true
        })
    );

    textarea.dispatchEvent(
        new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true
        })
    );

    return {
        success: true,
        method: "enter"
    };

})();
`;
}