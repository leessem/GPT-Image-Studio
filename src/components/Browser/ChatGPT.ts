export function buildPromptScript(prompt: string) {
  return `
(() => {

    const textarea =
        document.querySelector("textarea");

    if(!textarea)
        return false;

    textarea.focus();

    textarea.value = ${JSON.stringify(prompt)};

    textarea.dispatchEvent(
        new InputEvent("input",{
            bubbles:true
        })
    );

    return true;

})();
`;
}