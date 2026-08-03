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

}

/**
 * Settings > Prompt Library Backup export/import shape - deliberately
 * only Title/Prompt/Negative Prompt (no id/timestamps), since an
 * imported prompt is a fresh library entry, not a restored one.
 */
export interface PromptExportItem {

    title: string;

    prompt: string;

    negativePrompt: string;

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
