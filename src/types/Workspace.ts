// ============================================================================
// File : src/types/Workspace.ts
//
// V1.0: the Workspace IS the Tab - there is no separate Job/Project
// concept anymore. Each Workspace owns exactly one uploaded image, one
// selected Prompt, one ChatGPT conversation, and its own status/result.
// Workspace state is runtime-only and never persisted - closing the app
// discards every open Workspace (only the Prompt Library and Settings
// survive a restart).
// ============================================================================

export type WorkspaceStatus =
    | "waiting"
    | "running"
    | "done"
    | "error";

export interface Workspace {

    id: string;

    /**
     * The tab's own title - this IS the Workspace's only title, shown
     * directly in the top tab bar. Starts as "New Workspace", becomes the
     * selected Prompt's title the moment one is chosen (see
     * WorkspaceService.setWorkspacePrompt), de-duplicated against sibling
     * Workspace tabs with " (2)", " (3)", ... There is no manual rename
     * and no second title anywhere else.
     */
    name: string;

    prompt: string;

    status: WorkspaceStatus;

    imagePath?: string;

    createdAt: string;

    completedAt?: string;

    /** Data: URL - renderer-only, no disk file until Generate runs. */
    uploadedImagePath?: string;

    /** Which Prompt Library template this Workspace's `prompt` came from. */
    selectedPromptId?: string;

    /** This Workspace's own ChatGPT conversation URL, captured once after
     *  its first successful send and reused on every later Generate. */
    conversationUrl?: string;

    /**
     * Which Settings > Work Type Management entry this Workspace has
     * selected, if any - at most one, independent per Workspace.
     * `workTypePrefix` is a denormalized snapshot of that Work Type's
     * filenamePrefix at selection time (same reasoning as `prompt`
     * alongside `selectedPromptId`), so a later edit/delete in Settings
     * never changes what an already-selected Workspace saves with.
     */
    workTypeId?: string;

    workTypePrefix?: string;

    /**
     * Prompt Variable feature (v1.2.0): free-text value substituted for
     * every {NAME} occurrence in `prompt` right before sending to
     * ChatGPT. Only relevant when the selected Prompt's requiresName is
     * true; unrelated to workTypeId/workTypePrefix, which only affect
     * filename generation.
     */
    customerName?: string;

    /**
     * Prompt Variable feature (v1.2.1): free-text value substituted for
     * every {NUM} occurrence in `prompt` right before sending to
     * ChatGPT. Only relevant when the selected Prompt's requiresNumber
     * is true; independent of customerName/requiresName - either, both,
     * or neither can be set per Workspace.
     */
    customerNumber?: string;

}

export function createWorkspace(): Workspace {

    return {

        id: crypto.randomUUID(),

        name: "New Workspace",

        prompt: "",

        status: "waiting",

        createdAt: new Date().toISOString(),

    };

}

// ============================================================================
// End of File
// ============================================================================
