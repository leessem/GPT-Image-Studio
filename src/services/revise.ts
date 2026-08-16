// ============================================================================
// File : src/services/revise.ts
//
// v1.3.0 Custom Image Revision: a 2nd-pass edit of a Workspace's already-
// completed result image. Deliberately kept as its own file, separate
// from generate.ts's runGenerate - the 1st-pass pipeline (Upload ->
// Prompt insertion -> Verification -> Send -> Generation detection ->
// Image viewer -> Download -> Workspace Ready) is verified-working as
// of v1.2.5 and must not be touched. This module only ever reuses the
// same, already-generic ChatGPT.ts script builders runGenerate itself
// calls (upload/prompt/viewer/download scripts are not Prompt-Library-
// specific), so the stale-draft guard, prompt verification, and
// Markdown-autoformat handling inside them apply here unchanged.
//
// Unlike a fresh Generate, this never re-sends the selected Prompt
// Library's own `prompt` text - the input is the Workspace's existing
// result image (re-uploaded from disk) plus the short instruction the
// user just typed. Runs on the SAME Workspace webview/conversation so
// ChatGPT keeps the context of the image it just produced.
// ============================================================================

import { Workspace } from "../types/Workspace";
import { BrowserHandle } from "../components/Browser/Browser";
import { logWorkspaceEvent } from "../utils/workspaceLogger";
import {
    buildPromptScript,
    buildWaitImageScript,
    buildOpenImageViewerScript,
    buildWaitImageViewerScript,
    buildClickDownloadButtonScript,
    buildCloseImageViewerScript,
    buildUploadImageScript,
    buildWaitUploadScript,
    buildEnsureNormalChatInterfaceScript,
    buildWaitComposerReadyScript,
    buildClearComposerScript,
} from "../components/Browser/ChatGPT";

const VIEWER_TIMEOUT_MS = 15000;
const DOWNLOAD_EVENT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {

    return Promise.race([

        promise,

        new Promise<T>((_, reject) => {

            setTimeout(
                () => reject(new Error("timed out")),
                ms
            );

        }),

    ]);

}

export interface ReviseOptions {

    browser: BrowserHandle;

    workspace: Workspace;

    /** The user's free-text revision instruction - never the Prompt
     *  Library's own long prompt. */
    instruction: string;

    onUpdate: (updater: (workspace: Workspace) => Workspace) => void;

    onStart?: () => void;

    onFinish?: () => void;

    onError?: (error: unknown) => void;

}

export async function runReviseImage({

    browser,

    workspace,

    instruction,

    onUpdate,

    onStart,

    onFinish,

    onError,

}: ReviseOptions) {

    // Guard: the "커스텀 수정" UI only ever renders when a result image
    // already exists, but this is checked again here so revise.ts can
    // never be called into a state that would have nothing to revise.
    if (!workspace.imagePath) {

        console.error("[Revise] Aborted: workspace has no existing result image");

        return;

    }

    // Captured once up front - this Workspace's own imagePath must never
    // be read again mid-run (onUpdate below only changes it on success),
    // so a concurrent unrelated update can never shift which file this
    // revision is actually based on.
    const sourceImagePath = workspace.imagePath;

    console.log("[Revise] started for workspace", workspace.id);

    logWorkspaceEvent(workspace.id, "Revise Start", {
        webContentsId: browser.getWebContentsId(),
        sourceImagePath,
    });

    const raiseError = (reason: string, extra?: Record<string, unknown>) => {

        logWorkspaceEvent(workspace.id, "Revise Error Raised", {
            reason,
            webContentsId: browser.getWebContentsId(),
            sourceImagePath,
            ...extra,
        });

        // Only the status flips to "error" - imagePath/completedAt are
        // left completely untouched, so the Workspace's existing,
        // successful result is never lost or replaced by a failed
        // revision attempt (see PROJECT requirement: original result
        // must survive a failed 2nd-pass edit).
        onUpdate(w => ({ ...w, status: "error" }));

    };

    onStart?.();

    try {

        onUpdate(w => ({ ...w, status: "revising" }));

        // =====================================================================
        // 1. Composer ready (same check runGenerate itself does first).
        // =====================================================================

        const composerReady = await browser.execute(

            buildWaitComposerReadyScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!composerReady?.success) {

            console.error(
                "[Revise] FAILED - ChatGPT composer ready",
                { reason: composerReady?.reason ?? "no result" }
            );

            raiseError("composer-not-ready", { detail: composerReady?.reason ?? "no result" });

            return;

        }

        console.log("[Revise] OK - ChatGPT composer ready");

        // =====================================================================
        // 2. Read the Workspace's existing result image off disk and
        //    re-attach it as this revision's own image input - never the
        //    original upload, never a re-run of the Prompt Library text.
        // =====================================================================

        let sourceDataUrl: string;

        try {

            sourceDataUrl = await window.ipcRenderer.image.readAsDataUrl(sourceImagePath);

        }
        catch (err) {

            console.error("[Revise] FAILED - could not read existing result image from disk", err);

            raiseError("source-image-read-failed", { detail: String(err) });

            return;

        }

        console.log("[Revise] uploading existing result image for revision");

        const uploadResult = await browser.execute(

            buildUploadImageScript(sourceDataUrl)

        ) as {
            success: boolean;
            stepName?: string;
            selector?: string;
            domSnapshot?: unknown;
            reason?: string;
        } | undefined;

        if (!uploadResult?.success) {

            console.error(
                `[Revise] FAILED - ${uploadResult?.stepName ?? "upload"}`,
                {
                    selector: uploadResult?.selector,
                    reason: uploadResult?.reason ?? "no result",
                }
            );

            raiseError(uploadResult?.stepName ?? "upload-failed", {
                selector: uploadResult?.selector,
                detail: uploadResult?.reason ?? "no result",
            });

            return;

        }

        const uploadWaitResult = await browser.execute(

            buildWaitUploadScript()

        ) as {
            success: boolean;
            stepName?: string;
            selector?: string;
            reason?: string;
        } | undefined;

        if (!uploadWaitResult?.success) {

            console.error(
                `[Revise] FAILED - ${uploadWaitResult?.stepName ?? "upload-preview-detected"}`,
                { reason: uploadWaitResult?.reason ?? "no result" }
            );

            raiseError(uploadWaitResult?.stepName ?? "upload-not-detected", {
                detail: uploadWaitResult?.reason ?? "no result",
            });

            return;

        }

        console.log("[Revise] OK - existing result image re-uploaded");

        const chatInterfaceResult = await browser.execute(

            buildEnsureNormalChatInterfaceScript()

        ) as { success: boolean; wasOpen?: boolean; reason?: string } | undefined;

        if (!chatInterfaceResult?.success) {

            console.error(
                `[Revise] FAILED - normal chat interface not active after upload: ${chatInterfaceResult?.reason ?? "no result"}`
            );

            raiseError("chat-interface-not-active-after-upload", {
                detail: chatInterfaceResult?.reason ?? "no result",
            });

            return;

        }

        // =====================================================================
        // 3. Send only the user's short revision instruction - never the
        //    Prompt Library's own prompt text, no {NAME}/{NUM} involved.
        // =====================================================================

        console.log("[Revise] inserting revision instruction + clicking send");

        const promptResult = await browser.execute(

            buildPromptScript(instruction)

        ) as {
            success: boolean;
            step?: string;
            reason?: string;
            acceptedBy?: string;
        } | undefined;

        if (!promptResult?.success) {

            console.error(
                `[Revise] FAILED at step "${promptResult?.step}": ${promptResult?.reason ?? "no result"}`
            );

            // Same never-leave-a-draft-behind guarantee as generate.ts's
            // own failure path - best-effort, never overrides the real
            // error raised below.
            const clearResult = await browser.execute(
                buildClearComposerScript()
            ) as { success: boolean; reason?: string } | undefined;

            if (!clearResult?.success) {

                console.error(
                    "[Revise] composer clear-after-failure did not complete:",
                    clearResult?.reason ?? "no result"
                );

            }

            raiseError(promptResult?.step ?? "prompt-send-failed", {
                detail: promptResult?.reason ?? "no result",
            });

            return;

        }

        console.log(
            `[Revise] OK - instruction inserted, send accepted (${promptResult.acceptedBy})`
        );

        // =====================================================================
        // 4. Wait for the revised image to generate.
        // =====================================================================

        const waitResult = await browser.execute(

            buildWaitImageScript()

        ) as { success: boolean } | undefined;

        if (!waitResult?.success) {

            console.error("[Revise] FAILED - revised image generation was not detected");

            raiseError("image-generation-not-detected");

            return;

        }

        console.log("[Revise] revised image generation detected");

        // =====================================================================
        // 5. Open the revised image, download it.
        // =====================================================================

        const openViewerResult = await browser.execute(

            buildOpenImageViewerScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!openViewerResult?.success) {

            console.error(
                `[Revise] Failed to click revised image: ${openViewerResult?.reason ?? "no result"}`
            );

            raiseError("open-image-viewer-failed", {
                detail: openViewerResult?.reason ?? "no result",
            });

            return;

        }

        let viewerResult: { success: boolean } | undefined;

        try {

            viewerResult = await withTimeout(
                browser.execute(buildWaitImageViewerScript()) as Promise<{ success: boolean }>,
                VIEWER_TIMEOUT_MS
            );

        }
        catch (err) {

            console.error("[Revise] Image viewer did not open:", err);

        }

        if (!viewerResult?.success) {

            raiseError("image-viewer-did-not-open");

            return;

        }

        console.log("[Revise] image viewer opened");

        logWorkspaceEvent(workspace.id, "Revise Download Started", {
            webContentsId: browser.getWebContentsId(),
            sourceImagePath,
        });

        // Arms this download with the source file being revised, so the
        // main process saves it as "<sourceBaseName>+.png" (see
        // buildRevisionFilename in electron/main.ts) instead of running
        // the 1st-pass Prefix/Work-Type/Title filename scheme - the
        // existing filename generation rules are entirely untouched.
        window.ipcRenderer.image.armRevisionDownload(workspace.id, sourceImagePath);

        const downloadEventPromise = window.ipcRenderer.image.waitForDownload(workspace.id);

        const downloadClickResult = await browser.execute(

            buildClickDownloadButtonScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!downloadClickResult?.success) {

            console.error(
                `[Revise] Download button not found: ${downloadClickResult?.reason ?? "no result"}`
            );

            raiseError("download-button-not-found", {
                detail: downloadClickResult?.reason ?? "no result",
            });

            return;

        }

        let newImagePath: string;

        try {

            newImagePath = await withTimeout(downloadEventPromise, DOWNLOAD_EVENT_TIMEOUT_MS);

            console.log("[Revise] download completed:", newImagePath);

            logWorkspaceEvent(workspace.id, "Revise Download Completed", {
                webContentsId: browser.getWebContentsId(),
                imagePath: newImagePath,
            });

        }
        catch (err) {

            console.error("[Revise] download did not complete:", err);

            raiseError("download-did-not-complete", { detail: String(err) });

            return;

        }

        const verifyResult = await window.ipcRenderer.image.verifyFile(newImagePath);

        if (!verifyResult?.exists || verifyResult.size === 0) {

            console.error(`[Revise] Downloaded file not found on disk: ${newImagePath}`);

            raiseError("saved-file-not-found-on-disk", { newImagePath });

            return;

        }

        console.log(`[Revise] file verified on disk (${verifyResult.size} bytes): ${newImagePath}`);

        // =====================================================================
        // 6. Close the viewer, mark done.
        // =====================================================================

        const closeViewerResult = await browser.execute(

            buildCloseImageViewerScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!closeViewerResult?.success) {

            console.error(
                `[Revise] Failed to close image viewer: ${closeViewerResult?.reason ?? "no result"}`
            );

            raiseError("close-image-viewer-failed", {
                detail: closeViewerResult?.reason ?? "no result",
            });

            return;

        }

        onUpdate(w => ({

            ...w,

            status: "done",

            // The revised file becomes this Workspace's current result -
            // a later "커스텀 수정" click revises FROM this new file, so
            // the "+" keeps stacking ("+" -> "++" -> "+++", ...). The
            // original file on disk is never touched or deleted.
            imagePath: newImagePath,

            completedAt: new Date().toISOString(),

        }));

        logWorkspaceEvent(workspace.id, "Revise Complete", {
            webContentsId: browser.getWebContentsId(),
            imagePath: newImagePath,
        });

        console.log("[Revise] ==== done ====");

        // Same brief "show completed, then return to Ready" behavior as
        // generate.ts, so a Workspace never stays stuck showing "Saved"
        // and can immediately start another Generate or revision.
        await new Promise(resolve => setTimeout(resolve, 1500));

        onUpdate(w => (
            w.status === "done"
                ? { ...w, status: "waiting" }
                : w
        ));

    }
    catch (err) {

        console.error(err);

        logWorkspaceEvent(workspace.id, "Revise Error Raised", {
            reason: "uncaught-exception",
            detail: String(err),
            webContentsId: browser.getWebContentsId(),
            sourceImagePath,
        });

        onUpdate(w => {

            if (w.status !== "revising")
                return w;

            return { ...w, status: "error" };

        });

        onError?.(err);

    }
    finally {

        onFinish?.();

    }

}

// ============================================================================
// End of File
// ============================================================================
