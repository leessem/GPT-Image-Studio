// ============================================================================
// File : src/utils/promptVariables.ts
//
// Prompt Variable feature: two reserved variables, {NAME} (v1.2.0) and
// {NUM} (v1.2.1), each substituted with the Workspace's own
// customerName/customerNumber immediately before the prompt is sent to
// ChatGPT. Purely a text transform on the outgoing string - the
// Workspace's own stored `prompt` (and the Prompt Library template it
// came from) is never mutated, so both variables are still there the
// next time this Workspace (or a new one) generates. The two variables
// are independent - either, both, or neither may be present/enabled
// per prompt, and neither's substitution depends on the other.
// ============================================================================

const NAME_VARIABLE = "{NAME}";
const NUM_VARIABLE = "{NUM}";

export function applyPromptVariables(
    prompt: string,
    customerName: string | undefined,
    customerNumber: string | undefined
): string {

    let result = prompt;

    if (customerName)
        result = result.split(NAME_VARIABLE).join(customerName);

    if (customerNumber)
        result = result.split(NUM_VARIABLE).join(customerNumber);

    return result;

}

// ============================================================================
// End of File
// ============================================================================
