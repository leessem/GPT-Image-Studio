import { Job } from "./Job";

export interface ProjectTab {

    id: string;

    name: string;

    jobs: Job[];

}

export interface Project {

    id: string;

    name: string;

    currentTabId: string;

    tabs: ProjectTab[];

}

/**
 * 새 탭 생성
 */
export function createTab(name = "New Tab"): ProjectTab {

    return {

        id: crypto.randomUUID(),

        name,

        jobs: [],

    };

}

/**
 * 기본 프로젝트 생성
 */
export function createProject(): Project {

    const firstTab = createTab("Job 1");

    return {

        id: crypto.randomUUID(),

        name: "Untitled Project",

        currentTabId: firstTab.id,

        tabs: [

            firstTab,

        ],

    };

}