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
import { applyPromptVariables } from "../utils/promptVariables";
import {
    buildPromptScript,
    buildTxtPromptScript,
    TXT_ATTACHMENT_TRIGGER_MESSAGE,
    buildWaitForComposerIdleScript,
    buildWaitImageBoundedScript,
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
    buildAttachDomObserverScript,
    buildCaptureComposerSnapshotScript,
} from "../components/Browser/ChatGPT";
import {
    isDebugModeEnabled,
    logPipelineStage,
    savePromptData,
    saveWorkspaceSnapshot,
    saveComposerSnapshot,
    captureError,
    captureScreenshot,
} from "../utils/debugLogger";

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

    // Version 1.2.3 Debug Build: minted by Workspace.tsx's onGenerate
    // (via debugLogger.ts's startDebugSession) right at "Generate Click",
    // BEFORE runGenerate is even called - so that stage, logged from
    // onGenerate itself, lands in the same DebugLogs/<sessionId>/ folder
    // as everything runGenerate goes on to log. null when Debug Mode is
    // off; every debugLogger.ts call already no-ops on a null session.
    debugSessionId: string | null;

    onStart?: () => void;

    onFinish?: () => void;

    onError?: (error: unknown) => void;

}

export async function runGenerate({

    browser,

    workspace,

    onUpdate,

    debugSessionId,

    onStart,

    onFinish,

    onError,

}: GenerateOptions) {

    console.log("[Generate] started for workspace", workspace.id);

    logWorkspaceEvent(workspace.id, "Generate Start", {
        webContentsId: browser.getWebContentsId(),
        conversationUrl: workspace.conversationUrl,
    });

    saveWorkspaceSnapshot(debugSessionId, "before", JSON.stringify(workspace));

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

        // Full forensic snapshot on any pipeline failure, Debug Mode
        // only. Fire-and-forget (never awaited) so a slow/failed capture
        // can never delay or block the status update below -
        // captureErrorForensics swallows every failure of its own
        // internally (see debugLogger.ts). Logging continues after this -
        // nothing here stops the pipeline.
        if (isDebugModeEnabled()) {
            void captureErrorForensics(reason, extra);
        }

        onUpdate(w => {

            const updated: Workspace = { ...w, status: "error" };

            saveWorkspaceSnapshot(debugSessionId, "after", JSON.stringify(updated));

            return updated;

        });

    };

    const captureErrorForensics = async (
        reason: string,
        extra?: Record<string, unknown>
    ) => {

        try {

            const snapshot = await browser.execute(
                buildCaptureComposerSnapshotScript()
            ) as { composerHtml: string | null; composerText: string | null } | undefined;

            saveComposerSnapshot(debugSessionId, {
                html: snapshot?.composerHtml ?? null,
                text: snapshot?.composerText ?? null,
            });

            captureError({
                sessionId: debugSessionId,
                workspaceId: workspace.id,
                stage: reason,
                reason: typeof extra?.detail === "string" ? extra.detail : reason,
                exception: extra,
            });

            captureScreenshot(debugSessionId, workspace.id, "after_send");

        }
        catch {
            // best-effort - forensic capture must never affect the real
            // error already being raised above
        }

    };

    onStart?.();

    // v1.3.1 TXT Attachment Mode: set true if the TXT branch's own
    // bounded check below already found an image generated straight
    // from the attachment message alone (no trigger needed) - guards
    // Step 4 below from waiting on ANOTHER image that will never come
    // (its own baseline would start counting from the one already
    // found, i.e. wait for a 2nd, unwanted image).
    let txtImageAlreadyDetected = false;

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

        logPipelineStage(debugSessionId, workspace.id, "Workspace Ready");

        logPipelineStage(debugSessionId, workspace.id, "Prompt Selected", {
            selectedPromptId: workspace.selectedPromptId ?? null,
            promptName: workspace.name,
        });

        // Debug Mode only - purely observational (see ChatGPT.ts's own
        // comment on this script), attached once per Generate run right
        // after the composer is confirmed ready, before anything else
        // touches it.
        if (isDebugModeEnabled()) {
            await browser.execute(buildAttachDomObserverScript());
        }

        // =====================================================================
        // 2. Upload the Workspace's image into ChatGPT, then wait for it to
        //    complete (skipped entirely when no image is attached).
        // =====================================================================

        if (workspace.uploadedImagePath) {

            logWorkspaceEvent(workspace.id, "Upload Start", {
                webContentsId: browser.getWebContentsId(),
            });

            logPipelineStage(debugSessionId, workspace.id, "Image Upload Start");

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

            logPipelineStage(debugSessionId, workspace.id, "Image Upload Complete");

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

        const substitutedPrompt = applyPromptVariables(
            workspace.prompt,
            workspace.customerName,
            workspace.customerNumber,
            workspace.customerColor
        );

        logPipelineStage(debugSessionId, workspace.id, "Variables Applied", {
            customerName: workspace.customerName ?? null,
            customerNumber: workspace.customerNumber ?? null,
            customerColor: workspace.customerColor ?? null,
        });

        logPipelineStage(debugSessionId, workspace.id, "Prompt Insert Start");

        captureScreenshot(debugSessionId, workspace.id, "before_send");

        // v1.3.1 TXT Attachment Mode: a separate delivery script for
        // Prompt Library entries with "TXT 첨부 방식" checked - see
        // ChatGPT.ts's own doc comment on buildTxtPromptScript for why
        // this needs its own verification instead of reusing
        // buildPromptScript's. Everything else in this pipeline
        // (Upload, Send-acceptance polling, viewer, download, filename,
        // Workspace Ready) is identical either way - this is the only
        // branch point.
        const promptScript = workspace.txtAttachmentMode
            ? buildTxtPromptScript(substitutedPrompt)
            : buildPromptScript(substitutedPrompt);

        const promptResult = await browser.execute(

            promptScript

        ) as {
            success: boolean;
            step?: string;
            reason?: string;
            acceptedBy?: string;
            timeline?: {
                clearedAt?: number | null;
                pastedAt?: number | null;
                verificationStartedAt?: number | null;
                verifiedAt?: number | null;
                sendButtonFoundAt?: number | null;
                sendEnabledAt?: number | null;
                sendClickedAt?: number | null;
                acceptedAt?: number | null;
            };
        } | undefined;

        captureScreenshot(debugSessionId, workspace.id, "after_send");

        if (promptResult?.timeline) {

            const t = promptResult.timeline;

            if (t.pastedAt)
                logPipelineStage(debugSessionId, workspace.id, "Prompt Insert Complete", { at: t.pastedAt });

            if (t.verificationStartedAt)
                logPipelineStage(debugSessionId, workspace.id, "Prompt Verification Start", { at: t.verificationStartedAt });

            if (t.verifiedAt)
                logPipelineStage(debugSessionId, workspace.id, "Prompt Verification Pass", { at: t.verifiedAt });

            if (t.sendButtonFoundAt)
                logPipelineStage(debugSessionId, workspace.id, "Send Button Found", { at: t.sendButtonFoundAt });

            if (t.sendEnabledAt)
                logPipelineStage(debugSessionId, workspace.id, "Send Button Enabled", { at: t.sendEnabledAt });

            if (t.sendClickedAt)
                logPipelineStage(debugSessionId, workspace.id, "Send Click", { at: t.sendClickedAt });

        }

        if (isDebugModeEnabled()) {

            const composerSnapshot = await browser.execute(
                buildCaptureComposerSnapshotScript()
            ) as { composerHtml: string | null; composerText: string | null } | undefined;

            saveComposerSnapshot(debugSessionId, {
                html: composerSnapshot?.composerHtml ?? null,
                text: composerSnapshot?.composerText ?? null,
            });

            savePromptData({
                sessionId: debugSessionId,
                workspaceId: workspace.id,
                promptName: workspace.name,
                promptId: workspace.selectedPromptId ?? "",
                original: workspace.prompt,
                substituted: substitutedPrompt,
                composerReadback: composerSnapshot?.composerText ?? "",
            });

        }

        if (!promptResult?.success) {

            console.error(
                `[Generate] FAILED at step "${promptResult?.step}": ${promptResult?.reason ?? "no result"}`
            );

            // Send never happened - never leave whatever got inserted/
            // pasted sitting in the composer for the next Workspace's
            // webview to inherit (see buildClearComposerScript's own
            // comment). Best-effort: a failed clear is logged but never
            // allowed to override the real error raised below.
            const clearResult = await browser.execute(
                buildClearComposerScript()
            ) as { success: boolean; reason?: string } | undefined;

            if (!clearResult?.success) {

                console.error(
                    "[Generate] composer clear-after-failure did not complete:",
                    clearResult?.reason ?? "no result"
                );

            }

            raiseError(promptResult?.step ?? "prompt-send-failed", {
                detail: promptResult?.reason ?? "no result",
            });

            return;

        }

        console.log(
            `[Generate] OK - prompt inserted, send accepted (${promptResult.acceptedBy})`
        );

        // =====================================================================
        // v1.3.1 TXT Attachment Mode: confirmed live that a message
        // containing ONLY a file/document attachment (no inline text)
        // is treated by ChatGPT as reference material to discuss, not
        // an instruction to act on - it replies asking what to do
        // instead of generating an image. A short, fixed, non-Prompt-
        // Library follow-up message (sent as a completely ordinary
        // buildPromptScript send - it's short enough to never trigger
        // ChatGPT's own document-attachment conversion) is what
        // actually gets it to act on the attachment just sent above.
        // =====================================================================

        if (workspace.txtAttachmentMode) {

            // Confirmed live: right after the attachment message is
            // accepted, ChatGPT's own reply to it ("what would you
            // like me to do?") can still be actively streaming -
            // #composer-submit-button sits in its "stop generation"
            // state during that time, which is clickable but is NOT
            // the normal Send action. Attempting the trigger send
            // immediately risked that click landing on "stop" instead
            // of "send", leaving the typed trigger text sitting unsent
            // in the composer (confirmed live via a real screenshot).
            const idleResult = await browser.execute(
                buildWaitForComposerIdleScript()
            ) as { success: boolean; reason?: string } | undefined;

            if (!idleResult?.success) {

                console.error(
                    `[Generate] FAILED waiting for composer to leave generating state before TXT trigger: ${idleResult?.reason ?? "no result"}`
                );

                raiseError("txt-trigger-composer-not-idle", {
                    detail: idleResult?.reason ?? "no result",
                });

                return;

            }

            // Confirmed live: ChatGPT's own reaction to the attachment-
            // only message is inconsistent - it sometimes replies with
            // text only (needs the trigger below), but other times
            // proceeds straight to generating an image from the
            // attachment alone with no trigger needed at all. Sending
            // the trigger unconditionally in that second case produced
            // a real, confirmed-live duplicate/unwanted 2nd image - so
            // check first whether an image already appeared on its own
            // before ever sending the trigger.
            const alreadyGenerated = await browser.execute(
                buildWaitImageBoundedScript(10000)
            ) as { success: boolean } | undefined;

            if (alreadyGenerated?.success) {

                txtImageAlreadyDetected = true;

                console.log("[Generate] TXT attachment mode - image already generated from the attachment alone, skipping trigger message");

                logPipelineStage(debugSessionId, workspace.id, "TXT Image Generated Without Trigger");

            }
            else {

                console.log("[Generate] TXT attachment mode - sending follow-up trigger message");

                const triggerResult = await browser.execute(
                    buildPromptScript(TXT_ATTACHMENT_TRIGGER_MESSAGE)
                ) as { success: boolean; step?: string; reason?: string; acceptedBy?: string } | undefined;

                if (!triggerResult?.success) {

                    console.error(
                        `[Generate] FAILED to send TXT trigger message at step "${triggerResult?.step}": ${triggerResult?.reason ?? "no result"}`
                    );

                    const clearResult = await browser.execute(
                        buildClearComposerScript()
                    ) as { success: boolean; reason?: string } | undefined;

                    if (!clearResult?.success) {

                        console.error(
                            "[Generate] composer clear-after-failure did not complete:",
                            clearResult?.reason ?? "no result"
                        );

                    }

                    raiseError(triggerResult?.step ?? "txt-trigger-send-failed", {
                        detail: triggerResult?.reason ?? "no result",
                    });

                    return;

                }

                logPipelineStage(debugSessionId, workspace.id, "TXT Trigger Message Sent", {
                    acceptedBy: triggerResult.acceptedBy,
                });

                console.log(
                    `[Generate] OK - TXT trigger message sent, accepted (${triggerResult.acceptedBy})`
                );

            }

        }

        // =====================================================================
        // Capture this Workspace's own conversation URL, once.
        // =====================================================================

        if (!workspace.conversationUrl) {

            const conversationUrl = await waitForConversationUrl(browser);

            if (conversationUrl) {

                console.log(
                    `[Generate] Captured conversation URL for workspace ${workspace.id}: ${conversationUrl}`
                );

                logPipelineStage(debugSessionId, workspace.id, "Conversation Started", { conversationUrl });

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
        //
        // Skipped when the TXT branch above already found the image
        // (generated from the attachment alone, no trigger needed) -
        // calling buildWaitImageScript() again here would start a
        // fresh baseline AT that already-generated image and wait for
        // a second, unwanted one that will never come.
        // =====================================================================

        if (!txtImageAlreadyDetected) {

            const waitResult = await browser.execute(

                buildWaitImageScript()

            ) as { success: boolean } | undefined;

            if (!waitResult?.success) {

                console.error("[Generate] FAILED - image generation was not detected");

                raiseError("image-generation-not-detected");

                return;

            }

        }

        console.log("[Generate] image generation detected");

        logPipelineStage(debugSessionId, workspace.id, "Image Detection");

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

        logPipelineStage(debugSessionId, workspace.id, "Download Start");

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

            logPipelineStage(debugSessionId, workspace.id, "Download Complete", { imagePath });

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

        logPipelineStage(debugSessionId, workspace.id, "Save Complete", { imagePath, size: verifyResult.size });

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

        onUpdate(w => {

            const updated: Workspace = {

                ...w,

                status: "done",

                imagePath,

                completedAt: new Date().toISOString(),

            };

            saveWorkspaceSnapshot(debugSessionId, "after", JSON.stringify(updated));

            return updated;

        });

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

        logPipelineStage(debugSessionId, workspace.id, "Workspace Ready");

    }

    catch (err) {

        console.error(err);

        logWorkspaceEvent(workspace.id, "Error Raised", {
            reason: "uncaught-exception",
            detail: String(err),
            webContentsId: browser.getWebContentsId(),
            conversationUrl: workspace.conversationUrl,
        });

        if (isDebugModeEnabled()) {

            captureError({
                sessionId: debugSessionId,
                workspaceId: workspace.id,
                stage: "uncaught-exception",
                reason: String(err),
                exception: err,
            });

            captureScreenshot(debugSessionId, workspace.id, "after_send");

        }

        onUpdate(w => {

            if (w.status !== "running")
                return w;

            const updated: Workspace = { ...w, status: "error" };

            saveWorkspaceSnapshot(debugSessionId, "after", JSON.stringify(updated));

            return updated;

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
