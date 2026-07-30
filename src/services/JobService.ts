import { Job } from "../types/Job";

/**
 * 새 작업 생성
 */
export function createJob(prompt = "New Prompt"): Job {

    return {

        id: crypto.randomUUID(),

        prompt,

        status: "waiting",

        createdAt: new Date().toISOString(),

    };

}

/**
 * 작업 추가
 */
export function addJob(

    jobs: Job[],

    prompt = "New Prompt"

): Job[] {

    return [

        ...jobs,

        createJob(prompt),

    ];

}

/**
 * 작업 삭제
 */
export function deleteJob(

    jobs: Job[],

    id: string

): Job[] {

    return jobs.filter(

        job => job.id !== id

    );

}

/**
 * 작업 수정
 */
export function editJob(

    jobs: Job[],

    id: string,

    prompt: string

): Job[] {

    return jobs.map(job =>

        job.id === id

            ? {

                ...job,

                prompt,

            }

            : job

    );

}

/**
 * 작업 복제
 */
export function duplicateJob(

    jobs: Job[],

    id: string

): Job[] {

    const target = jobs.find(

        job => job.id === id

    );

    if (!target)
        return jobs;

    return [

        ...jobs,

        {

            ...target,

            id: crypto.randomUUID(),

            status: "waiting",

            createdAt: new Date().toISOString(),

            completedAt: undefined,

        },

    ];

}

/**
 * 상태 초기화
 */
export function resetJobs(

    jobs: Job[]

): Job[] {

    return jobs.map(job => ({

        ...job,

        status: "waiting",

        completedAt: undefined,

    }));

}

/**
 * 완료된 작업 개수
 */
export function completedCount(

    jobs: Job[]

): number {

    return jobs.filter(

        job => job.status === "done"

    ).length;

}

/**
 * 실행 중인 작업 개수
 */
export function runningCount(

    jobs: Job[]

): number {

    return jobs.filter(

        job => job.status === "running"

    ).length;

}

/**
 * 대기 중인 작업 개수
 */
export function waitingCount(

    jobs: Job[]

): number {

    return jobs.filter(

        job => job.status === "waiting"

    ).length;

}

/**
 * 에러 작업 개수
 */
export function errorCount(

    jobs: Job[]

): number {

    return jobs.filter(

        job => job.status === "error"

    ).length;

}