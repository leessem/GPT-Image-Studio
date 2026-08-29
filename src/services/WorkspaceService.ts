// ============================================================================
// File : src/services/WorkspaceService.ts
//
// V1.0: pure functions over a flat Workspace[] list - there is no Project/
// Tab/Job nesting anymore, a Workspace is the only unit.
// ============================================================================

import { Workspace, CropRect, AdditionalImage, createWorkspace } from "../types/Workspace";

/**
 * Multi Image Upload (v1.4.1): max number of ADDITIONAL images on top
 * of the primary image, so a Workspace can hold at most 5 images total
 * (1 primary + 4 additional) - see PROJECT spec section 11.
 */
export const MAX_ADDITIONAL_IMAGES = 4;

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
 * Closes every open Workspace tab at once and returns a single fresh
 * one - same "there must always be at least one open" invariant as
 * deleteWorkspace, just applied to the whole list in one action.
 * Mirrors addWorkspace's own { workspaces, created } shape so the
 * caller (Workspace.tsx) can point currentWorkspaceId at the new tab
 * and tear down every old webview, the same way onDeleteWorkspace
 * already does per-tab.
 */
export function clearAllWorkspaces(): { workspaces: Workspace[]; created: Workspace } {

    const created = createWorkspace();

    return {

        workspaces: [created],

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
            // Multi Image Upload (v1.4.1): the additional-image set was
            // built alongside this primary image - replacing or
            // removing the primary (uploadedImagePath === undefined)
            // must never leave a stale set attached to a new/no
            // primary, same reasoning as the Crop reset above.
            additionalImages: undefined,
        })
    );

}

/**
 * Multi Image Upload (v1.4.1): appends one additional image (already
 * read as a data: URL) after the current primary image and any
 * existing additional images, preserving selection order. No-ops if
 * this Workspace has no primary image yet, or is already at
 * MAX_ADDITIONAL_IMAGES - the caller (WorkspacePanel) is expected to
 * disable the "이미지 추가" control in both cases, but this stays safe
 * even if called anyway.
 */
export function addWorkspaceAdditionalImage(

    workspaces: Workspace[],

    id: string,

    dataUrl: string

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => {

            if (!w.uploadedImagePath)
                return w;

            const current = w.additionalImages ?? [];

            if (current.length >= MAX_ADDITIONAL_IMAGES)
                return w;

            const created: AdditionalImage = {
                id: crypto.randomUUID(),
                originalImagePath: dataUrl,
            };

            return { ...w, additionalImages: [...current, created] };

        }
    );

}

/**
 * Multi Image Upload (v1.4.1): removes one additional image by its
 * index in the array - the remaining entries keep their existing
 * relative order (no re-sort), matching the "이미지 순서는 유지되어야
 * 한다" requirement.
 */
export function removeWorkspaceAdditionalImage(

    workspaces: Workspace[],

    id: string,

    index: number

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({
            ...w,
            additionalImages: (w.additionalImages ?? []).filter((_, i) => i !== index),
        })
    );

}

/**
 * Multi Image Upload + per-image Crop (v1.4.1): confirms (or, passing
 * `undefined` for both, clears) a Crop selection on ONE additional
 * image, addressed by its own stable `id` (not array index, which
 * shifts on removal) - independent of the primary image's own
 * cropRect/croppedImagePath and of every other additional image's.
 * Mirrors setWorkspaceCrop's precedence exactly, just scoped to one
 * array entry instead of the whole Workspace.
 */
export function setWorkspaceAdditionalImageCrop(

    workspaces: Workspace[],

    id: string,

    additionalImageId: string,

    croppedImagePath: string | undefined,

    cropRect: CropRect | undefined

): Workspace[] {

    return updateWorkspace(
        workspaces,
        id,
        w => ({
            ...w,
            additionalImages: (w.additionalImages ?? []).map(img =>
                img.id === additionalImageId
                    ? { ...img, croppedImagePath, cropRect }
                    : img
            ),
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
