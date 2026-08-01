import { Project } from "../types/Project";

const STORAGE_KEY = "gpt-image-studio-project";

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

        const project = JSON.parse(saved) as Project;

        if (
            !project ||
            !Array.isArray(project.tabs) ||
            project.tabs.length === 0
        ) {
            return defaultProject;
        }

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