import { Job } from "../types/Job";
import { BrowserHandle } from "../Browser/Browser";
import {
    buildPromptScript,
    buildWaitImageScript,
} from "../Browser/ChatGPT";

export interface QueueRunnerOptions {

    browser: BrowserHandle;

    jobs: Job[];

    stopRef: React.MutableRefObject<boolean>;

    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;

    onStart?: () => void;

    onFinish?: () => void;

    onError?: (error: unknown) => void;

}

export async function runQueue({

    browser,

    jobs,

    stopRef,

    setJobs,

    onStart,

    onFinish,

    onError,

}: QueueRunnerOptions) {

    onStart?.();

    try {

        for (let i = 0; i < jobs.length; i++) {

            if (stopRef.current)
                break;

            // -----------------------------
            // 상태 변경
            // -----------------------------

            setJobs(prev =>
                prev.map((job, index) => {

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
            );

            // -----------------------------
            // Prompt 입력
            // -----------------------------

            await browser.execute(

                buildPromptScript(

                    jobs[i].prompt

                )

            );

            // -----------------------------
            // 이미지 생성 대기
            // -----------------------------

            await browser.execute(

                buildWaitImageScript()

            );

            // -----------------------------
            // 완료 처리
            // -----------------------------

            setJobs(prev =>
                prev.map((job, index) =>

                    index === i

                        ? {

                            ...job,

                            status: "done",

                            completedAt:

                                new Date().toISOString(),

                        }

                        : job

                )
            );

        }

    }

    catch (err) {

        console.error(err);

        setJobs(prev =>
            prev.map(job =>

                job.status === "running"

                    ? {

                        ...job,

                        status: "error",

                    }

                    : job

            )
        );

        onError?.(err);

    }

    finally {

        onFinish?.();

    }

}