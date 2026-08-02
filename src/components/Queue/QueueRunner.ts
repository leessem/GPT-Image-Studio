// ============================================================================
// File : src/components/Queue/QueueRunner.ts
// ============================================================================

import { Project } from "../../types/Project";
import { BrowserHandle } from "../Browser/Browser";
import {
    buildPromptScript,
    buildWaitImageScript,
    buildOpenImageViewerScript,
    buildWaitImageViewerScript,
    buildClickDownloadButtonScript,
} from "../Browser/ChatGPT";
import {
    getCurrentJobs,
    updateCurrentJobs,
} from "../../services/JobService";

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
            // Prompt 입력
            // =================================================================

            console.log("[Queue] Prompt script injected");

            const promptResult = await browser.execute(

                buildPromptScript(

                    currentJob.prompt

                )

            ) as { success: boolean; step?: string; reason?: string } | undefined;

            if (!promptResult) {

                console.error(
                    "[Queue] Prompt automation aborted: browser.execute() returned no result (webview not ready?)"
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
                promptResult.step === "send-button-not-found"
            ) {
                console.log("[Queue] Prompt inserted");
            }

            if (promptResult.success) {
                console.log("[Queue] Send button clicked");
            }

            if (!promptResult.success) {

                console.error(
                    `[Queue] Prompt automation failed at step "${promptResult.step}": ${promptResult.reason}`
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

            console.log("[Queue] Waiting for generation");

            // =================================================================
            // 이미지 생성 대기
            // =================================================================

            const waitResult = await browser.execute(

                buildWaitImageScript()

            ) as { success: boolean } | undefined;

            if (!waitResult?.success) {

                console.error(
                    "[Queue] Image generation was not detected"
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

            try {

                const downloadedPath = await withTimeout(
                    downloadEventPromise,
                    DOWNLOAD_EVENT_TIMEOUT_MS
                );

                console.log(
                    "[Queue] Electron will-download event fired:",
                    downloadedPath
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
            // 완료 처리 (imagePath 반영은 다음 단계에서 구현 예정)
            // =================================================================

            setProject(prev =>
                updateCurrentJobs(prev, tabJobs =>
                    tabJobs.map((job, index) =>

                        index === i

                            ? {

                                ...job,

                                status: "done",

                                completedAt:

                                    new Date().toISOString(),

                            }

                            : job

                    )
                )
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
