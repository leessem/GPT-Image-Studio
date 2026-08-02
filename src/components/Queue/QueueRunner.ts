// ============================================================================
// File : src/components/Queue/QueueRunner.ts
// ============================================================================

import { Project } from "../../types/Project";
import { BrowserHandle, CHATGPT_HOME_URL } from "../Browser/Browser";
import {
    buildPromptScript,
    buildWaitImageScript,
    buildOpenImageViewerScript,
    buildWaitImageViewerScript,
    buildClickDownloadButtonScript,
    buildCloseImageViewerScript,
    buildUploadImageScript,
    buildWaitUploadScript,
    buildWaitComposerReadyScript,
} from "../Browser/ChatGPT";
import {
    getCurrentJobs,
    updateCurrentJobs,
} from "../../services/JobService";

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
 * Polls the shared webview's current URL until ChatGPT has routed to a real
 * conversation (contains "/c/"), so this Job's own conversationUrl can be
 * captured right after its first successful send.
 */
async function waitForConversationUrl(
    browser: BrowserHandle,
    timeoutMs = CONVERSATION_URL_TIMEOUT_MS
): Promise<string | null> {

    const pollMs = 200;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {

        const url = browser.getCurrentUrl();

        if (/\/c\//.test(url))
            return url;

        await new Promise(resolve => setTimeout(resolve, pollMs));

    }

    return null;

}

export interface QueueRunnerOptions {

    browser: BrowserHandle;

    project: Project;

    stopRef: React.MutableRefObject<boolean>;

    setProject: React.Dispatch<React.SetStateAction<Project>>;

    onStart?: () => void;

    onFinish?: () => void;

    onError?: (error: unknown) => void;

}

export async function runQueue({

    browser,

    project,

    stopRef,

    setProject,

    onStart,

    onFinish,

    onError,

}: QueueRunnerOptions) {

    console.log("[Queue] QueueRunner started");

    onStart?.();

    try {

        const jobs = getCurrentJobs(project);

        for (let i = 0; i < jobs.length; i++) {

            if (stopRef.current)
                break;

            const currentJob = jobs[i];

            console.log(
                `[Queue] ==== Generation ${i + 1}/${jobs.length} start ====`
            );

            console.log("[Queue] Job loaded", {
                id: currentJob.id,
                prompt: currentJob.prompt,
            });

            // =================================================================
            // 상태 변경
            // =================================================================

            setProject(prev =>
                updateCurrentJobs(prev, tabJobs =>
                    tabJobs.map((job, index) => {

                        if (index < i) {

                            return {

                                ...job,

                                status: "done",

                            };

                        }

                        if (index === i) {

                            return {

                                ...job,

                                status: "running",

                            };

                        }

                        return {

                            ...job,

                            status: "waiting",

                        };

                    })
                )
            );

            // =================================================================
            // 1. Activate Job: navigate the one shared webview/session to
            //    this Job's own conversation (or CHATGPT_HOME_URL to start a
            //    fresh one when it doesn't have one yet). One login/session
            //    is shared by every Job - independence comes from routing
            //    to a different conversation, not a different browser.
            // =================================================================

            const targetUrl = currentJob.conversationUrl ?? CHATGPT_HOME_URL;

            console.log(
                `[Pipeline] Step 1/10: Job activated (job ${currentJob.id}, navigating to ${targetUrl})`
            );

            await browser.loadURL(targetUrl);

            const composerReady = await browser.execute(

                buildWaitComposerReadyScript()

            ) as { success: boolean; reason?: string } | undefined;

            if (!composerReady?.success) {

                console.error(
                    "[Pipeline] Step 2/10: FAILED - ChatGPT composer ready",
                    {
                        selector: "#prompt-textarea",
                        reason: composerReady?.reason ?? "no result",
                    }
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Pipeline] Step 2/10: OK - ChatGPT composer ready");

            // =================================================================
            // 2-3. Upload Job image into ChatGPT, then wait until it
            //    completes (P0-2 - optional, only when this Job has one;
            //    skipped entirely when uploadedImagePath is not set)
            // =================================================================

            if (currentJob.uploadedImagePath) {

                const uploadResult = await browser.execute(

                    buildUploadImageScript(currentJob.uploadedImagePath)

                ) as {
                    success: boolean;
                    step?: number;
                    stepName?: string;
                    selector?: string;
                    domSnapshot?: unknown;
                    reason?: string;
                } | undefined;

                if (!uploadResult?.success) {

                    console.error(
                        `[Pipeline] Step ${uploadResult?.step ?? "3-4"}/10: FAILED - ${uploadResult?.stepName ?? "upload"}`,
                        {
                            selector: uploadResult?.selector,
                            domSnapshot: uploadResult?.domSnapshot,
                            reason: uploadResult?.reason ?? "no result",
                        }
                    );

                    setProject(prev =>
                        updateCurrentJobs(prev, tabJobs =>
                            tabJobs.map((job, index) =>
                                index === i
                                    ? { ...job, status: "error" }
                                    : job
                            )
                        )
                    );

                    break;

                }

                console.log(
                    "[Pipeline] Step 4/10: OK - image injected, waiting for upload to complete"
                );

                const uploadWaitResult = await browser.execute(

                    buildWaitUploadScript()

                ) as {
                    success: boolean;
                    step?: number;
                    stepName?: string;
                    selector?: string;
                    domSnapshot?: unknown;
                    reason?: string;
                } | undefined;

                if (!uploadWaitResult?.success) {

                    console.error(
                        `[Pipeline] Step ${uploadWaitResult?.step ?? 5}/10: FAILED - ${uploadWaitResult?.stepName ?? "upload-preview-detected"}`,
                        {
                            selector: uploadWaitResult?.selector,
                            domSnapshot: uploadWaitResult?.domSnapshot,
                            reason: uploadWaitResult?.reason ?? "no result",
                        }
                    );

                    setProject(prev =>
                        updateCurrentJobs(prev, tabJobs =>
                            tabJobs.map((job, index) =>
                                index === i
                                    ? { ...job, status: "error" }
                                    : job
                            )
                        )
                    );

                    break;

                }

                console.log("[Pipeline] Step 6/10: OK - upload completed");

            }

            // =================================================================
            // 4-5. Insert Prompt + Click Send (unchanged - see ChatGPT.ts)
            // =================================================================

            console.log(
                "[Pipeline] Steps 7-9/10: inserting prompt + clicking send"
            );

            const promptResult = await browser.execute(

                buildPromptScript(

                    currentJob.prompt

                )

            ) as { success: boolean; step?: string; reason?: string; acceptedBy?: string } | undefined;

            if (!promptResult) {

                console.error(
                    "[Pipeline] Steps 7-9/10: FAILED - browser.execute() returned no result (webview not ready?)"
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            if (promptResult.step && promptResult.step !== "textarea-not-found") {
                console.log("[Queue] Prompt textarea found");
            }

            if (
                promptResult.success ||
                promptResult.step === "send-button-not-found" ||
                promptResult.step === "send-not-accepted"
            ) {
                console.log("[Pipeline] Step 7/10: OK - Prompt inserted");
            }

            if (promptResult.success) {
                console.log("[Pipeline] Step 8/10: OK - Send button enabled");
                console.log(
                    `[Pipeline] Step 9/10: OK - Send clicked (message accepted: ${promptResult.acceptedBy})`
                );
            }

            if (!promptResult.success) {

                console.error(
                    `[Pipeline] Steps 7-9/10: FAILED at step "${promptResult.step}": ${promptResult.reason}`
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            // =================================================================
            // Capture this Job's own conversation URL, once - only needed
            // the first time (a Job that already has one keeps reusing it).
            // =================================================================

            if (!currentJob.conversationUrl) {

                const conversationUrl = await waitForConversationUrl(browser);

                if (conversationUrl) {

                    console.log(
                        `[Queue] Captured conversation URL for job ${currentJob.id}: ${conversationUrl}`
                    );

                    setProject(prev =>
                        updateCurrentJobs(prev, tabJobs =>
                            tabJobs.map((job, index) =>
                                index === i
                                    ? { ...job, conversationUrl }
                                    : job
                            )
                        )
                    );

                }
                else {

                    console.warn(
                        `[Queue] Could not capture a conversation URL for job ${currentJob.id} within timeout`
                    );

                }

            }

            console.log("[Pipeline] Step 10/10: waiting for generation");

            // =================================================================
            // 이미지 생성 대기
            // =================================================================

            const waitResult = await browser.execute(

                buildWaitImageScript()

            ) as { success: boolean } | undefined;

            if (!waitResult?.success) {

                console.error(
                    "[Pipeline] Step 10/10: FAILED - image generation was not detected"
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Pipeline] Step 10/10: OK - generation detected");

            console.log("[Queue] Image generation detected");

            // =================================================================
            // 이미지 클릭
            // =================================================================

            const openViewerResult = await browser.execute(

                buildOpenImageViewerScript()

            ) as { success: boolean; reason?: string } | undefined;

            if (!openViewerResult?.success) {

                console.error(
                    `[Queue] Failed to click generated image: ${openViewerResult?.reason ?? "no result"}`
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Queue] Generated image clicked");

            // =================================================================
            // 뷰어 오픈 대기
            // =================================================================

            let viewerResult: { success: boolean } | undefined;

            try {

                viewerResult = await withTimeout(
                    browser.execute(
                        buildWaitImageViewerScript()
                    ) as Promise<{ success: boolean }>,
                    VIEWER_TIMEOUT_MS
                );

            }
            catch (err) {

                console.error(
                    "[Queue] Image viewer did not open:",
                    err
                );

            }

            if (!viewerResult?.success) {

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Queue] Image viewer opened");

            // =================================================================
            // 다운로드 버튼 클릭 + will-download 이벤트 발생 검증
            // (ImageDrop 저장/imagePath 반영은 다음 단계에서 구현 예정)
            // =================================================================

            window.ipcRenderer.image.armDownload(currentJob.id);

            const downloadEventPromise =
                window.ipcRenderer.image.waitForDownload(
                    currentJob.id
                );

            const downloadClickResult = await browser.execute(

                buildClickDownloadButtonScript()

            ) as { success: boolean; reason?: string } | undefined;

            if (!downloadClickResult?.success) {

                console.error(
                    `[Queue] Download button not found: ${downloadClickResult?.reason ?? "no result"}`
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Queue] Download button found");
            console.log("[Queue] Download button clicked");

            let imagePath: string;

            try {

                imagePath = await withTimeout(
                    downloadEventPromise,
                    DOWNLOAD_EVENT_TIMEOUT_MS
                );

                console.log(
                    "[Queue] Electron will-download event fired:",
                    imagePath
                );

            }
            catch (err) {

                console.error(
                    "[Queue] will-download event did not fire:",
                    err
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            // =================================================================
            // 다운로드된 파일이 실제로 디스크에 존재하는지 검증
            // =================================================================

            const verifyResult = await window.ipcRenderer.image.verifyFile(
                imagePath
            );

            if (!verifyResult?.exists || verifyResult.size === 0) {

                console.error(
                    `[Queue] Downloaded file not found on disk: ${imagePath}`
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log(
                `[Queue] File verified on disk (${verifyResult.size} bytes): ${imagePath}`
            );

            // =================================================================
            // 뷰어 닫기 + 텍스트 입력창 활성화 확인
            // (다음 큐 항목으로 넘어가기 전 반드시 완료되어야 함)
            // =================================================================

            const closeViewerResult = await browser.execute(

                buildCloseImageViewerScript()

            ) as { success: boolean; reason?: string } | undefined;

            if (!closeViewerResult?.success) {

                console.error(
                    `[Queue] Failed to close image viewer: ${closeViewerResult?.reason ?? "no result"}`
                );

                setProject(prev =>
                    updateCurrentJobs(prev, tabJobs =>
                        tabJobs.map((job, index) =>
                            index === i
                                ? { ...job, status: "error" }
                                : job
                        )
                    )
                );

                break;

            }

            console.log("[Queue] Image viewer closed");
            console.log("[Queue] Prompt textarea active again");

            // =================================================================
            // 완료 처리 + imagePath 저장 (ImageDrop은 project 상태로부터
            // generatedImages를 다시 계산하므로 별도 refresh 호출이 필요 없음)
            // =================================================================

            setProject(prev =>
                updateCurrentJobs(prev, tabJobs =>
                    tabJobs.map((job, index) =>

                        index === i

                            ? {

                                ...job,

                                status: "done",

                                imagePath,

                                completedAt:

                                    new Date().toISOString(),

                            }

                            : job

                    )
                )
            );

            console.log(
                `[Queue] ImageDrop refreshed with ${imagePath}`
            );

            console.log(
                `[Queue] ==== Generation ${i + 1}/${jobs.length} done ====`
            );

        }

    }

    catch (err) {

        console.error(err);

        setProject(prev =>
            updateCurrentJobs(prev, tabJobs =>
                tabJobs.map(job =>

                    job.status === "running"

                        ? {

                            ...job,

                            status: "error",

                        }

                        : job

                )
            )
        );

        onError?.(err);

    }

    finally {

        onFinish?.();

    }

}

// ============================================================================
// End of File
// ============================================================================
