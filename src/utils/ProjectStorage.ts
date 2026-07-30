import { Job } from "../types/Job";

const STORAGE_KEY = "gpt-image-studio-project";

/**
 * 프로젝트 저장
 */
export function saveProject(jobs: Job[]) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(jobs)
    );

}

/**
 * 프로젝트 불러오기
 */
export function loadProject(defaultJobs: Job[]): Job[] {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved)
        return defaultJobs;

    try {

        return JSON.parse(saved);

    }
    catch {

        return defaultJobs;

    }

}

/**
 * 프로젝트 삭제
 */
export function clearProject() {

    localStorage.removeItem(STORAGE_KEY);

}