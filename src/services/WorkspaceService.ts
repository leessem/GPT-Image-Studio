// ============================================================================
// File : src/services/WorkspaceService.ts
//
// V1.0: pure functions over a flat Workspace[] list - there is no Project/
// Tab/Job nesting anymore, a Workspace is the only unit.
// ============================================================================

import { Workspace, CropRect, createWorkspace } from "../types/Workspace";

export function getCurrentWorkspace(

    workspaces: Workspace[],

    currentWorkspaceId: string

): Workspace {

    return (
        workspaces.find(w => w.id === currentWorkspaceId) ?? workspaces[0]
    );

}

export function addWorkspace(

    workspaces: Workspace[]

): { workspaces: Workspace[]; created: Workspace } {

    const created = createWorkspace();

    return {

        workspaces: [...workspaces, created],

        created,

    };

}

/**
 * Never removes the last remaining Workspace - there must always be at
 * least one open.
 */
export function deleteWorkspace(

    workspaces: Workspace[],

    id: string

): Workspace[] {

    if (workspaces.length <= 1)
        return workspaces;

    return workspaces.filter(w => w.id !== id);

}

export function updateWorkspace(

    workspaces: Workspace[],

    id: string,

    updater: (workspace: Workspace) => Workspace

): Workspace[] {

    return workspaces.map(w => (w.id === id ? updater(w) : w));

}

/**
 * Assigns a Workspace the prompt text copied from a Prompt Library
 * template, and immediately renames the Workspace (its tab title) to that
 * template's title - there is no separate Workspace title. If sibling
 * Workspace tabs already use this same promptId, appends " (2)", " (3)",
 * ... so titles stay unique across all open tabs.
 */
export function setWorkspacePrompt(

    workspaces: Workspace[],

    id: string,

    promptId: string,

    promptText: string,

    promptTitle: string,

    txtAttachmentMode: boolean

): Workspace[] {

    const siblingCount = workspaces.filter(
        w => w.id !== id && w.selectedPromptId === promptId
    ).length;

    const name = siblingCount === 0
        ? promptTitle
        : `${promptTitle} (${siblingCount + 1})`;

    return workspaces.map(w =>
        w.id === id
            ? {

                  ...w,

                  name,

                  prompt: promptText,

                  selectedPromptId: promptId,

                  txtAttachmentMode,

              }
            : w
    );

}

/**
 * Assigns (or clears, when workTypeId is undefined) a Workspace's
 * selected Work Type - independent per Workspace, at most one at a
 * time. `workTypePrefix` is captured alongside the id so this
 * Workspace keeps using it even if that Work Type is later edited or
 * deleted in Settings.
 */
export function setWorkspaceWorkType(

    workspaces: Workspace[],

    id: string,

    workTypeId: string | undefined,

    workTypePrefix: string | undefined

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...w, workTypeId, workTypePrefix })
    );

}

/**
 * Resets a Workspace back to a brand-new state - the toolbar's instant
 * "Clear" action, letting the user start the next generation without
 * opening a new Workspace tab. Reuses createWorkspace()'s own blank
 * shape (so there's exactly one definition of "what a fresh Workspace
 * looks like"), preserving only this Workspace's id and createdAt so
 * its tab identity/position never changes. Every other Workspace, the
 * Prompt Library, Work Type definitions, and Settings are untouched -
 * this only ever updates the one Workspace with a matching id.
 */
export function clearWorkspace(

    workspaces: Workspace[],

    id: string

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...createWorkspace(), id: w.id, createdAt: w.createdAt })
    );

}

/**
 * Sets the Workspace's own {NAME} substitution value (Prompt Variable
 * feature) - independent per Workspace, unrelated to Work Type.
 */
export function setWorkspaceCustomerName(

    workspaces: Workspace[],

    id: string,

    customerName: string

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...w, customerName })
    );

}

/**
 * Sets the Workspace's own {NUM} substitution value (Prompt Variable
 * feature) - independent per Workspace, unrelated to Work Type and to
 * customerName/{NAME}.
 */
export function setWorkspaceCustomerNumber(

    workspaces: Workspace[],

    id: string,

    customerNumber: string

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...w, customerNumber })
    );

}

/**
 * Sets the Workspace's own {COLOR} substitution value (Prompt Variable
 * feature, v1.3.1) - independent per Workspace, unrelated to Work Type
 * and to customerName/customerNumber.
 */
export function setWorkspaceCustomerColor(

    workspaces: Workspace[],

    id: string,

    customerColor: string

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...w, customerColor })
    );

}

/**
 * Sets (or clears) a Workspace's uploaded original image. Always resets
 * `cropRect`/`croppedImagePath` together with it - a Crop selection made
 * against one original image must never be silently applied to a
 * different (replaced) original, or survive the original being removed
 * (Original Image Crop, v1.4.0, requirement 9).
 */
export function setWorkspaceUploadedImage(

    workspaces: Workspace[],

    id: string,

    uploadedImagePath: string | undefined

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({
            ...w,
            uploadedImagePath,
            cropRect: undefined,
            croppedImagePath: undefined,
        })
    );

}

/**
 * Original Image Crop (v1.4.0): confirms a Crop selection on the
 * Workspace's current `uploadedImagePath`. `croppedImagePath` is a
 * wholly separate data URL bitmap - the original itself is never
 * touched. Passing `undefined` for both clears the Crop back to "use
 * the full original", independent of `setWorkspaceUploadedImage` above.
 */
export function setWorkspaceCrop(

    workspaces: Workspace[],

    id: string,

    croppedImagePath: string | undefined,

    cropRect: CropRect | undefined

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({ ...w, croppedImagePath, cropRect })
    );

}

// ============================================================================
// End of File
// ============================================================================
