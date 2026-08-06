// ============================================================================
// File : src/utils/promptVariables.ts
//
// Prompt Variable feature (v1.2.0): exactly one reserved variable,
// {NAME}, substituted with the Workspace's customerName immediately
// before the prompt is sent to ChatGPT. Purely a text transform on the
// outgoing string - the Workspace's own stored `prompt` (and the Prompt
// Library template it came from) is never mutated, so {NAME} is still
// there the next time this Workspace (or a new one) generates.
// ============================================================================

const NAME_VARIABLE = "{NAME}";

export function applyPromptVariables(
    prompt: string,
    customerName: string | undefined
): string {

    if (!customerName)
        return prompt;

    return prompt.split(NAME_VARIABLE).join(customerName);

}

// ============================================================================
// End of File
// ============================================================================
