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

    /**
     * Prompt Variable feature (v1.2.1): same mechanism as requiresName,
     * for the second reserved variable {NUM} - shows a "숫자" input on
     * the Workspace panel, substituted in independently of requiresName/
     * {NAME}. Either, both, or neither can be enabled per prompt.
     */
    requiresNumber: boolean;

    /**
     * Prompt Variable feature (v1.3.1): same mechanism as requiresName/
     * requiresNumber, for the third reserved variable {COLOR} - shows a
     * "색상" input on the Workspace panel, substituted in independently
     * of requiresName/requiresNumber. Any combination of the three can
     * be enabled per prompt.
     */
    requiresColor: boolean;

    /**
     * TXT Attachment Mode (v1.3.1): when true, Generate sends this
     * Prompt via ChatGPT's own native "paste long text as a document
     * attachment" behavior (buildTxtPromptScript) instead of the normal
     * inline-paste path (buildPromptScript). Never changes the Prompt
     * content itself or {NAME}/{NUM}/{COLOR} substitution - only how
     * the already-substituted text is delivered to ChatGPT. Independent
     * of requiresName/requiresNumber/requiresColor.
     */
    txtAttachmentMode: boolean;

    /**
     * Favorites (v1.5.1): starred from the Prompt Settings list. Starred
     * prompts are listed first in the Workspace panel's Prompt dropdown;
     * nothing else about the prompt changes. Not part of PromptDraft -
     * toggled directly via PromptStore.setFavorite, never by the editor.
     */
    favorite: boolean;

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

    requiresNumber: boolean;

    requiresColor: boolean;

    txtAttachmentMode: boolean;

}

/**
 * Settings > Prompt Library Backup export/import shape - deliberately
 * only Title/Prompt/Negative Prompt (no id/timestamps), since an
 * imported prompt is a fresh library entry, not a restored one.
 * `requiresName`/`requiresNumber`/`requiresColor`/`txtAttachmentMode`
 * are optional so backups written before v1.2.0/v1.2.1/v1.3.1
 * respectively still import correctly - a missing value is treated as
 * false.
 */
export interface PromptExportItem {

    title: string;

    prompt: string;

    negativePrompt: string;

    requiresName?: boolean;

    requiresNumber?: boolean;

    requiresColor?: boolean;

    txtAttachmentMode?: boolean;

    /** v1.5.1 - optional so older backups import with no favorites. */
    favorite?: boolean;

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
