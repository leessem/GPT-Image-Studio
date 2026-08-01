import { Project } from "../types/Project";

const STORAGE_KEY = "gpt-image-studio-project";

/**
 * 프로젝트 형태 검증
 * (localStorage든 외부 .gisp 파일이든, 신뢰할 수 없는 값은 항상 여기로 검증)
 */
export function isValidProject(value: unknown): value is Project {

    if (
        !value ||
        typeof value !== "object"
    )
        return false;

    const project = value as Project;

    return (
        typeof project.id === "string" &&
        typeof project.name === "string" &&
        typeof project.currentTabId === "string" &&
        Array.isArray(project.tabs) &&
        project.tabs.length > 0 &&
        project.tabs.every(tab =>
            tab &&
            typeof tab.id === "string" &&
            typeof tab.name === "string" &&
            Array.isArray(tab.jobs)
        )
    );

}

/**
 * 프로젝트 저장
 */
export function saveProject(project: Project) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(project)
    );

}

/**
 * 프로젝트 불러오기
 */
export function loadProject(defaultProject: Project): Project {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved)
        return defaultProject;

    try {

        const project = JSON.parse(saved) as unknown;

        if (!isValidProject(project))
            return defaultProject;

        return project;

    }
    catch {

        return defaultProject;

    }

}

/**
 * 프로젝트 삭제
 */
export function clearProject() {

    localStorage.removeItem(STORAGE_KEY);

}