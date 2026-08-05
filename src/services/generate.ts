// ============================================================================
// File : src/services/generate.ts
//
// V1.0: runs the generation pipeline once, for exactly one Workspace -
// there is no Queue anymore. Automation steps themselves (upload, prompt
// insertion, send, wait, download, verify) are unchanged from the prior
// QueueRunner implementation; only the "run N jobs in sequence" loop and
// its cross-job status bookkeeping have been removed.
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
} from "../components/Browser/ChatGPT";

const VIEWER_TIMEOUT_MS = 15000;
const DOWNLOAD_EVENT_TIMEOUT_MS = 15000;
const CONVERSATION_URL_TIMEOUT_MS = 8000;

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

/**
 * Polls this Workspace's own webview URL until ChatGPT has routed to a
 * real, server-confirmed conversation (contains "/c/"), so this
 * Workspace's own conversationUrl can be captured right after its first
 * successful send. ChatGPT briefly routes to a client-side-only
 * placeholder URL right after Send ("/c/WEB:<client-generated-id>")
 * before the server assigns the real permanent id - that placeholder must
 * be skipped, or the saved conversationUrl ends up unusable (confirmed
 * live: navigating back to a "/c/WEB:..." URL just redirects home).
 */
async function waitForConversationUrl(
    browser: BrowserHandle,
    timeoutMs = CONVERSATION_URL_TIMEOUT_MS
): Promise<string | null> {

    const pollMs = 200;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {

        const url = browser.getCurrentUrl();

        if (/\/c\/WEB:/.test(url)) {

            console.log(
                "[Generate] waitForConversationUrl: skipping client-side placeholder URL",
                url
            );

        }
        else if (/\/c\//.test(url)) {

            console.log(
                "[Generate] waitForConversationUrl: real conversation URL captured",
                url
            );

            return url;

        }

        await new Promise(resolve => setTimeout(resolve, pollMs));

    }

    return null;

}

/**
 * Strips a Workspace's own de-dup suffix (" (2)", " (3)", ...) so the
 * saved image's filename is based on the pure Prompt title, not on which
 * tab happened to generate it - "Portrait" and "Portrait (2)" both save
 * under the same "Portrait" name (numbered sequentially on disk so
 * neither ever overwrites the other - see buildAutoFilename in main.ts).
 */
function baseFileName(workspaceName: string): string {

    return workspaceName.replace(/\s+\(\d+\)$/, "");

}

export interface GenerateOptions {

    browser: BrowserHandle;

    workspace: Workspace;

    onUpdate: (updater: (workspace: Workspace) => Workspace) => void;

    onStart?: () => void;

    onFinish?: () => void;

    onError?: (error: unknown) => void;

}

export async function runGenerate({

    browser,

    workspace,

    onUpdate,

    onStart,

    onFinish,

    onError,

}: GenerateOptions) {

    console.log("[Generate] started for workspace", workspace.id);

    logWorkspaceEvent(workspace.id, "Generate Start", {
        webContentsId: browser.getWebContentsId(),
        conversationUrl: workspace.conversationUrl,
    });

    // TEMPORARY (V1.1 Workspace-isolation audit): every status:"error"
    // transition below goes through this one place so it always logs
    // Workspace ID + reason + webContentsId + conversationUrl at the
    // exact moment the error is raised - see src/utils/workspaceLogger.ts.
    const raiseError = (reason: string, extra?: Record<string, unknown>) => {

        logWorkspaceEvent(workspace.id, "Error Raised", {
            reason,
            webContentsId: browser.getWebContentsId(),
            conversationUrl: workspace.conversationUrl,
            // Captured here (not at the log call site) so the stack's
            // top frame is always this raiseError() call itself -
            // its second frame is the exact generate.ts line that
            // detected the failure (file/function/line, per the audit's
            // "identify exactly which line" requirement).
            stack: new Error().stack,
            ...extra,
        });

        onUpdate(w => ({ ...w, status: "error" }));

    };

    onStart?.();

    try {

        onUpdate(w => ({ ...w, status: "running" }));

        // =====================================================================
        // 1. Composer ready - this Workspace's own webview should already be
        //    sitting on its own conversation (or a fresh chat), per the
        //    per-Workspace WebView architecture; just confirm it's loaded.
        // =====================================================================

        const composerReady = await browser.execute(

            buildWaitComposerReadyScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!composerReady?.success) {

            console.error(
                "[Generate] FAILED - ChatGPT composer ready",
                { reason: composerReady?.reason ?? "no result" }
            );

            raiseError("composer-not-ready", { detail: composerReady?.reason ?? "no result" });

            return;

        }

        console.log("[Generate] OK - ChatGPT composer ready");

        // =====================================================================
        // 2. Upload the Workspace's image into ChatGPT, then wait for it to
        //    complete (skipped entirely when no image is attached).
        // =====================================================================

        if (workspace.uploadedImagePath) {

            logWorkspaceEvent(workspace.id, "Upload Start", {
                webContentsId: browser.getWebContentsId(),
            });

            const uploadResult = await browser.execute(

                buildUploadImageScript(workspace.uploadedImagePath)

            ) as {
                success: boolean;
                stepName?: string;
                selector?: string;
                domSnapshot?: unknown;
                reason?: string;
            } | undefined;

            if (!uploadResult?.success) {

                console.error(
                    `[Generate] FAILED - ${uploadResult?.stepName ?? "upload"}`,
                    {
                        selector: uploadResult?.selector,
                        domSnapshot: uploadResult?.domSnapshot,
                        reason: uploadResult?.reason ?? "no result",
                    }
                );

                raiseError(uploadResult?.stepName ?? "upload-failed", {
                    selector: uploadResult?.selector,
                    detail: uploadResult?.reason ?? "no result",
                });

                return;

            }

            console.log("[Generate] OK - image injected, waiting for upload to complete");

            const uploadWaitResult = await browser.execute(

                buildWaitUploadScript()

            ) as {
                success: boolean;
                stepName?: string;
                selector?: string;
                domSnapshot?: unknown;
                reason?: string;
            } | undefined;

            if (!uploadWaitResult?.success) {

                console.error(
                    `[Generate] FAILED - ${uploadWaitResult?.stepName ?? "upload-preview-detected"}`,
                    {
                        selector: uploadWaitResult?.selector,
                        domSnapshot: uploadWaitResult?.domSnapshot,
                        reason: uploadWaitResult?.reason ?? "no result",
                    }
                );

                raiseError(uploadWaitResult?.stepName ?? "upload-not-detected", {
                    selector: uploadWaitResult?.selector,
                    detail: uploadWaitResult?.reason ?? "no result",
                });

                return;

            }

            logWorkspaceEvent(workspace.id, "Upload Complete", {
                webContentsId: browser.getWebContentsId(),
            });

            console.log("[Generate] OK - upload completed");

            // =================================================================
            // Intermittent race: ChatGPT can - not always - leave an image
            // preview/lightbox open over the just-uploaded thumbnail instead
            // of the normal composer. Automation must never continue while
            // that's active (it silently breaks prompt insertion/Send), so
            // this verifies the normal chat interface is back, closing the
            // preview first if one is open.
            // =================================================================

            const chatInterfaceResult = await browser.execute(

                buildEnsureNormalChatInterfaceScript()

            ) as { success: boolean; wasOpen?: boolean; reason?: string } | undefined;

            if (!chatInterfaceResult?.success) {

                console.error(
                    `[Generate] FAILED - normal chat interface not active after upload: ${chatInterfaceResult?.reason ?? "no result"}`
                );

                raiseError("chat-interface-not-active-after-upload", {
                    detail: chatInterfaceResult?.reason ?? "no result",
                });

                return;

            }

            if (chatInterfaceResult.wasOpen) {

                console.warn("[Generate] Preview was open after upload and has been closed");

            }

        }

        // =====================================================================
        // 3. Insert Prompt + Send
        // =====================================================================

        console.log("[Generate] inserting prompt + clicking send");

        const promptResult = await browser.execute(

            buildPromptScript(workspace.prompt)

        ) as { success: boolean; step?: string; reason?: string; acceptedBy?: string } | undefined;

        if (!promptResult?.success) {

            console.error(
                `[Generate] FAILED at step "${promptResult?.step}": ${promptResult?.reason ?? "no result"}`
            );

            raiseError(promptResult?.step ?? "prompt-send-failed", {
                detail: promptResult?.reason ?? "no result",
            });

            return;

        }

        console.log(
            `[Generate] OK - prompt inserted, send accepted (${promptResult.acceptedBy})`
        );

        // =====================================================================
        // Capture this Workspace's own conversation URL, once.
        // =====================================================================

        if (!workspace.conversationUrl) {

            const conversationUrl = await waitForConversationUrl(browser);

            if (conversationUrl) {

                console.log(
                    `[Generate] Captured conversation URL for workspace ${workspace.id}: ${conversationUrl}`
                );

                onUpdate(w => ({ ...w, conversationUrl }));

            }
            else {

                console.warn(
                    `[Generate] Could not capture a conversation URL for workspace ${workspace.id} within timeout`
                );

            }

        }

        // =====================================================================
        // 4. Wait for image generation
        // =====================================================================

        const waitResult = await browser.execute(

            buildWaitImageScript()

        ) as { success: boolean } | undefined;

        if (!waitResult?.success) {

            console.error("[Generate] FAILED - image generation was not detected");

            raiseError("image-generation-not-detected");

            return;

        }

        console.log("[Generate] image generation detected");

        // =====================================================================
        // 5. Open the generated image, download it
        // =====================================================================

        const openViewerResult = await browser.execute(

            buildOpenImageViewerScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!openViewerResult?.success) {

            console.error(
                `[Generate] Failed to click generated image: ${openViewerResult?.reason ?? "no result"}`
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

            console.error("[Generate] Image viewer did not open:", err);

        }

        if (!viewerResult?.success) {

            raiseError("image-viewer-did-not-open");

            return;

        }

        console.log("[Generate] image viewer opened");

        logWorkspaceEvent(workspace.id, "Download Started", {
            webContentsId: browser.getWebContentsId(),
            baseName: baseFileName(workspace.name),
            workTypePrefix: workspace.workTypePrefix ?? "",
        });

        window.ipcRenderer.image.armDownload(
            workspace.id,
            baseFileName(workspace.name),
            workspace.workTypePrefix ?? ""
        );

        const downloadEventPromise = window.ipcRenderer.image.waitForDownload(workspace.id);

        const downloadClickResult = await browser.execute(

            buildClickDownloadButtonScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!downloadClickResult?.success) {

            console.error(
                `[Generate] Download button not found: ${downloadClickResult?.reason ?? "no result"}`
            );

            raiseError("download-button-not-found", {
                detail: downloadClickResult?.reason ?? "no result",
            });

            return;

        }

        let imagePath: string;

        try {

            imagePath = await withTimeout(downloadEventPromise, DOWNLOAD_EVENT_TIMEOUT_MS);

            console.log("[Generate] download completed:", imagePath);

            logWorkspaceEvent(workspace.id, "Download Completed", {
                webContentsId: browser.getWebContentsId(),
                imagePath,
            });

        }
        catch (err) {

            console.error("[Generate] download did not complete:", err);

            raiseError("download-did-not-complete", { detail: String(err) });

            return;

        }

        logWorkspaceEvent(workspace.id, "Save Started", { imagePath });

        const verifyResult = await window.ipcRenderer.image.verifyFile(imagePath);

        if (!verifyResult?.exists || verifyResult.size === 0) {

            console.error(`[Generate] Downloaded file not found on disk: ${imagePath}`);

            raiseError("saved-file-not-found-on-disk", { imagePath });

            return;

        }

        logWorkspaceEvent(workspace.id, "Save Completed", {
            imagePath,
            size: verifyResult.size,
        });

        console.log(`[Generate] file verified on disk (${verifyResult.size} bytes): ${imagePath}`);

        // =====================================================================
        // 6. Close the viewer, mark done
        // =====================================================================

        const closeViewerResult = await browser.execute(

            buildCloseImageViewerScript()

        ) as { success: boolean; reason?: string } | undefined;

        if (!closeViewerResult?.success) {

            console.error(
                `[Generate] Failed to close image viewer: ${closeViewerResult?.reason ?? "no result"}`
            );

            raiseError("close-image-viewer-failed", {
                detail: closeViewerResult?.reason ?? "no result",
            });

            return;

        }

        onUpdate(w => ({

            ...w,

            status: "done",

            imagePath,

            completedAt: new Date().toISOString(),

        }));

        logWorkspaceEvent(workspace.id, "Generate Complete", {
            webContentsId: browser.getWebContentsId(),
            imagePath,
        });

        console.log("[Generate] ==== done ====");

        // =====================================================================
        // 7. Ready state: briefly show the completed confirmation, then
        //    return to "waiting" so the next image can be uploaded right
        //    away - a Workspace must never stay stuck showing "Completed".
        //    The Prompt/selectedPromptId stay untouched, since the normal
        //    flow is picking a Prompt once and generating several images
        //    with it; only the consumed upload is cleared.
        // =====================================================================

        await new Promise(resolve => setTimeout(resolve, 1500));

        onUpdate(w => (
            w.status === "done"
                ? { ...w, status: "waiting", uploadedImagePath: undefined }
                : w
        ));

    }

    catch (err) {

        console.error(err);

        logWorkspaceEvent(workspace.id, "Error Raised", {
            reason: "uncaught-exception",
            detail: String(err),
            webContentsId: browser.getWebContentsId(),
            conversationUrl: workspace.conversationUrl,
        });

        onUpdate(w => (w.status === "running" ? { ...w, status: "error" } : w));

        onError?.(err);

    }

    finally {

        onFinish?.();

    }

}

// ============================================================================
// End of File
// ============================================================================
