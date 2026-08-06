// ============================================================================
// File : src/types/Prompt.ts
// ============================================================================

export interface PromptItem {

    id: string;

    title: string;

    prompt: string;

    negativePrompt: string;

    createdAt: string;

    updatedAt: string;

    /**
     * Prompt Variable feature (v1.2.0): when true, the Workspace panel
     * shows a "사용자 이름" input above Generate, and every {NAME}
     * occurrence in `prompt` is substituted with that input's value right
     * before sending to ChatGPT. Independent of Work Type - Work Type only
     * ever affects filename generation.
     */
    requiresName: boolean;

}

/**
 * Fields the editor collects for Create/Save - everything about a
 * PromptItem except its identity (id) and timestamps, which PromptStore
 * is responsible for assigning.
 */
export interface PromptDraft {

    title: string;

    prompt: string;

    negativePrompt: string;

    requiresName: boolean;

}

/**
 * Settings > Prompt Library Backup export/import shape - deliberately
 * only Title/Prompt/Negative Prompt (no id/timestamps), since an
 * imported prompt is a fresh library entry, not a restored one.
 * `requiresName` is optional so backups written before v1.2.0 still
 * import correctly - a missing value is treated as false.
 */
export interface PromptExportItem {

    title: string;

    prompt: string;

    negativePrompt: string;

    requiresName?: boolean;

}

/**
 * Shape of prompt entries as they existed before the Prompt Library
 * redesign (src/data/prompts.json). Kept only so PromptStore can migrate
 * old data into the current PromptItem shape the first time the app runs
 * with no persisted library yet.
 */
export interface LegacyPromptItem {

    id: number;

    title: string;

    category: string;

    content: string;

}

// ============================================================================
// End of File
// ============================================================================
