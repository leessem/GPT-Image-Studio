// ============================================================================
// File : src/services/JobService.ts
// ============================================================================

import { Job } from "../types/Job";
import {
    Project,
    ProjectTab,
    createTab,
} from "../types/Project";

/**
 * 현재 탭 반환
 */
export function getCurrentTab(
    project: Project
): ProjectTab {

    return (
        project.tabs.find(
            tab => tab.id === project.currentTabId
        ) ?? project.tabs[0]
    );

}

/**
 * 현재 작업 반환
 */
export function getCurrentJobs(
    project: Project
): Job[] {

    return getCurrentTab(project).jobs;

}

/**
 * 탭 추가
 */
export function addTab(

    project: Project,

    name = "New Tab"

): Project {

    const tab = createTab(name);

    return {

        ...project,

        currentTabId: tab.id,

        tabs: [
            ...project.tabs,
            tab,
        ],

    };

}

/**
 * 탭 삭제
 */
export function deleteTab(

    project: Project,

    id: string

): Project {

    if (project.tabs.length <= 1)
        return project;

    const tabs = project.tabs.filter(
        tab => tab.id !== id
    );

    const currentTabId =
        project.currentTabId === id
            ? tabs[0].id
            : project.currentTabId;

    return {

        ...project,

        tabs,

        currentTabId,

    };

}

/**
 * 탭 전환
 */
export function switchTab(

    project: Project,

    id: string

): Project {

    if (!project.tabs.some(tab => tab.id === id))
        return project;

    return {

        ...project,

        currentTabId: id,

    };

}

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
 * 현재 탭 작업 변경
 */
export function updateCurrentJobs(

    project: Project,

    updater: (jobs: Job[]) => Job[]

): Project {

    return {

        ...project,

        tabs: project.tabs.map(tab =>

            tab.id === project.currentTabId
                ? {
                      ...tab,
                      jobs: updater(tab.jobs),
                  }
                : tab

        ),

    };

}

/**
 * 작업 추가
 */
export function addJob(

    project: Project,

    prompt = "New Prompt"

): Project {

    return updateCurrentJobs(
        project,
        jobs => [
            ...jobs,
            createJob(prompt),
        ]
    );

}

/**
 * 작업 삭제
 */
export function deleteJob(

    project: Project,

    id: string

): Project {

    return updateCurrentJobs(
        project,
        jobs => jobs.filter(
            job => job.id !== id
        )
    );

}

/**
 * 작업 수정
 */
export function editJob(

    project: Project,

    id: string,

    prompt: string

): Project {

    return updateCurrentJobs(
        project,
        jobs =>
            jobs.map(job =>
                job.id === id
                    ? {
                          ...job,
                          prompt,
                      }
                    : job
            )
    );

}

/**
 * 작업 복제
 */
export function duplicateJob(

    project: Project,

    id: string

): Project {

    return updateCurrentJobs(
        project,
        jobs => {

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
    );

}

/**
 * 상태 초기화
 */
export function resetJobs(

    project: Project

): Project {

    return updateCurrentJobs(
        project,
        jobs =>
            jobs.map(job => ({

                ...job,

                status: "waiting",

                completedAt: undefined,

            }))
    );

}

/**
 * 완료 개수
 */
export function completedCount(
    project: Project
): number {

    return getCurrentJobs(project).filter(
        job => job.status === "done"
    ).length;

}

/**
 * 실행 개수
 */
export function runningCount(
    project: Project
): number {

    return getCurrentJobs(project).filter(
        job => job.status === "running"
    ).length;

}

/**
 * 대기 개수
 */
export function waitingCount(
    project: Project
): number {

    return getCurrentJobs(project).filter(
        job => job.status === "waiting"
    ).length;

}

/**
 * 에러 개수
 */
export function errorCount(
    project: Project
): number {

    return getCurrentJobs(project).filter(
        job => job.status === "error"
    ).length;

}

// ============================================================================
// End
// ============================================================================