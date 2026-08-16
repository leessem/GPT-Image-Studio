// ============================================================================
// File : src/utils/promptVariables.ts
//
// Prompt Variable feature: three reserved variables, {NAME} (v1.2.0),
// {NUM} (v1.2.1), and {COLOR} (v1.3.1), each substituted with the
// Workspace's own customerName/customerNumber/customerColor
// immediately before the prompt is sent to ChatGPT. Purely a text
// transform on the outgoing string - the Workspace's own stored
// `prompt` (and the Prompt Library template it came from) is never
// mutated, so every variable is still there the next time this
// Workspace (or a new one) generates. The three variables are
// independent - any combination may be present/enabled per prompt,
// and none's substitution depends on another. Substitution is the
// ONLY transform applied here - no other part of `prompt` (spacing,
// line breaks, punctuation, Markdown) is ever touched.
// ============================================================================

const NAME_VARIABLE = "{NAME}";
const NUM_VARIABLE = "{NUM}";
const COLOR_VARIABLE = "{COLOR}";

export function applyPromptVariables(
    prompt: string,
    customerName: string | undefined,
    customerNumber: string | undefined,
    customerColor: string | undefined
): string {

    let result = prompt;

    if (customerName)
        result = result.split(NAME_VARIABLE).join(customerName);

    if (customerNumber)
        result = result.split(NUM_VARIABLE).join(customerNumber);

    if (customerColor)
        result = result.split(COLOR_VARIABLE).join(customerColor);

    return result;

}

// ============================================================================
// End of File
// ============================================================================
