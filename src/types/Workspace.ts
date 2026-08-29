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
    | "error"
    /**
     * v1.3.0 Custom Image Revision: a second-pass edit is in flight on
     * this Workspace's existing result image - distinct from "running"
     * (the 1st-pass Prompt Library generation) so the two never get
     * confused in the status badge or in guard checks below.
     */
    | "revising";

/**
 * Original Image Crop (v1.4.0): a selection rectangle expressed in the
 * uploaded original image's own natural pixel coordinates (never CSS/
 * display pixels) - see CropModal.tsx for how it's produced.
 */
export interface CropRect {

    x: number;

    y: number;

    width: number;

    height: number;

}

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

    /**
     * Prompt Variable feature (v1.3.1): free-text value substituted for
     * every {COLOR} occurrence in `prompt` right before sending to
     * ChatGPT. Only relevant when the selected Prompt's requiresColor
     * is true; independent of customerName/customerNumber - any
     * combination can be set per Workspace.
     */
    customerColor?: string;

    /**
     * TXT Attachment Mode (v1.3.1): a denormalized snapshot of the
     * selected Prompt's own txtAttachmentMode at selection time (same
     * reasoning as workTypePrefix alongside workTypeId - a later edit
     * to the Prompt Library entry never changes what an already-
     * selected Workspace does on Generate). When true, generate.ts
     * sends this Workspace's prompt via buildTxtPromptScript instead of
     * buildPromptScript - see generate.ts's own comment at that branch.
     */
    txtAttachmentMode?: boolean;

    /**
     * Original Image Crop (v1.4.0): the last confirmed Crop selection on
     * this Workspace's current `uploadedImagePath`, kept so re-opening
     * the Crop UI starts from it instead of the full image again.
     * Cleared whenever `uploadedImagePath` itself is replaced or removed
     * (see WorkspaceService.setWorkspaceUploadedImage) - a stale
     * selection must never carry over onto a different original image.
     */
    cropRect?: CropRect;

    /**
     * Original Image Crop (v1.4.0): the confirmed Crop result, as its
     * own separate data URL bitmap at the crop's real pixel resolution -
     * never a mutation of `uploadedImagePath`, which always stays the
     * untouched original. `generate.ts` uploads
     * `croppedImagePath ?? uploadedImagePath` to ChatGPT; every other
     * use of `uploadedImagePath` (Image preview, 원본 교체, 삭제) is
     * unaffected. Cleared together with cropRect whenever the original
     * is replaced/removed, and consumed (cleared) the same moment
     * `uploadedImagePath` is consumed after a successful Generate.
     */
    croppedImagePath?: string;

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
