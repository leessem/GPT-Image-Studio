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

const DOWNLOAD_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {

    return Promise.race([

        promise,

        new Promise<T>((_, reject) => {

            setTimeout(
                () => reject(new Error("download timed out")),
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

            ) as { success: boolean };

            // =================================================================
            // 이미지 다운로드
            // (이미지 클릭 -> 뷰어 오픈 대기 -> 다운로드 버튼 클릭 ->
            //  will-download 캡처)
            // =================================================================

            let imagePath: string | undefined;

            if (waitResult?.success) {

                await browser.execute(
                    buildOpenImageViewerScript()
                );

                await browser.execute(
                    buildWaitImageViewerScript()
                );

                window.ipcRenderer.image.armDownload(
                    currentJob.id
                );

                const downloadPromise =
                    window.ipcRenderer.image.waitForDownload(
                        currentJob.id
                    );

                await browser.execute(
                    buildClickDownloadButtonScript()
                );

                try {

                    imagePath = await withTimeout(
                        downloadPromise,
                        DOWNLOAD_TIMEOUT_MS
                    );

                }
                catch (err) {

                    console.error(err);

                }

            }

            // =================================================================
            // 완료 처리
            // =================================================================

            setProject(prev =>
                updateCurrentJobs(prev, tabJobs =>
                    tabJobs.map((job, index) =>

                        index === i

                            ? {

                                ...job,

                                status: "done",

                                imagePath: imagePath ?? job.imagePath,

                                completedAt:

                                    new Date().toISOString(),

                            }

                            : job

                    )
                )
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
