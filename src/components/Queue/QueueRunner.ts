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

    onStart?.();

    try {

        const jobs = getCurrentJobs(project);

        for (let i = 0; i < jobs.length; i++) {

            if (stopRef.current)
                break;

            const currentJob = jobs[i];

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

            await browser.execute(

                buildPromptScript(

                    currentJob.prompt

                )

            );

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
