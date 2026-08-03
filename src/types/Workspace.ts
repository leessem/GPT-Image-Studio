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
     * directly in the top tab bar. Starts as "New Tab", becomes the
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

}

export function createWorkspace(): Workspace {

    return {

        id: crypto.randomUUID(),

        name: "New Tab",

        prompt: "",

        status: "waiting",

        createdAt: new Date().toISOString(),

    };

}

// ============================================================================
// End of File
// ============================================================================
