// ============================================================================
// File : src/components/Workspace/Workspace.tsx
// PART 1 / 2 시작
// ============================================================================

import { useEffect, useRef, useState } from "react";

import Browser, { BrowserHandle } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import ImageDrop from "../ImageDrop/ImageDrop";
import JobTabs from "./JobTabs";

import { Project, createProject } from "../../types/Project";

import { defaultJobs } from "../data/defaultJobs";

import { runQueue } from "../Queue/QueueRunner";
import { buildInsertPromptScript } from "../Browser/ChatGPT";

import {
    loadProject,
    saveProject,
    isValidProject,
} from "../../utils/ProjectStorage";

import {
    addJob,
    deleteJob,
    editJob,
    addTab,
    deleteTab,
    switchTab,
    getCurrentJobs,
} from "../../services/JobService";

import "./Workspace.css";

// ========================================================================
// 기본 프로젝트 생성
// ========================================================================

function buildDefaultProject(): Project {

    const project = createProject();

    project.tabs[0] = {

        ...project.tabs[0],

        jobs: defaultJobs,

    };

    return project;

}

export default function Workspace() {

    // ========================================================================
    // Browser
    // ========================================================================

    const browserRef = useRef<BrowserHandle>(null);

    // ========================================================================
    // Queue
    // ========================================================================

    const stopRef = useRef(false);

    const [running, setRunning] = useState(false);

    // ========================================================================
    // Project
    // ========================================================================

    const [project, setProject] = useState<Project>(() =>
        loadProject(buildDefaultProject())
    );

    // ========================================================================
    // Auto Save
    // ========================================================================

    useEffect(() => {

        saveProject(project);

    }, [project]);

    // ========================================================================
    // Queue Start
    // ========================================================================

    const startQueue = async () => {

        console.log("[Queue] Start Queue clicked");

        if (!browserRef.current) {
            console.error("[Queue] Aborted: browser ref not ready");
            return;
        }

        if (running) {
            console.warn("[Queue] Aborted: queue already running");
            return;
        }

        stopRef.current = false;

        await runQueue({

            browser: browserRef.current,

            project,

            stopRef,

            setProject,

            onStart: () => {

                setRunning(true);

            },

            onFinish: () => {

                setRunning(false);

            },

            onError: (err) => {

                console.error(err);

            },

        });

    };

    // ========================================================================
    // Queue Stop
    // ========================================================================

    const stopQueue = () => {

        stopRef.current = true;

    };

    // ========================================================================
    // Job Event
    // ========================================================================

    const onAdd = () => {

        setProject(prev => addJob(prev));

    };

    const onDelete = (id: string) => {

        setProject(prev => deleteJob(prev, id));

    };

    const onEdit = (

        id: string,

        prompt: string

    ) => {

        setProject(prev =>

            editJob(

                prev,

                id,

                prompt

            )

        );

    };

    // ========================================================================
    // Prompt Library Selection
    // ========================================================================

    const onSelectPrompt = async (prompt: string) => {

        if (!browserRef.current)
            return;

        await browserRef.current.execute(
            buildInsertPromptScript(prompt)
        );

    };

    // ========================================================================
    // Tab Event
    // ========================================================================

    const onSwitchTab = (id: string) => {

        setProject(prev => switchTab(prev, id));

    };

    const onAddTab = () => {

        setProject(prev => addTab(prev));

    };

    const onDeleteTab = (id: string) => {

        setProject(prev => deleteTab(prev, id));

    };

    // ========================================================================
    // Open / Save Project (native file)
    // ========================================================================

    const onOpenProject = async () => {

        const result = await window.ipcRenderer.project.open();

        if (!result)
            return;

        if (!isValidProject(result.data)) {

            console.error(
                "Invalid project file:",
                result.path
            );

            return;

        }

        setProject(result.data);

    };

    const onSaveProject = async () => {

        await window.ipcRenderer.project.saveAs(project);

    };

    // =========================================================================
    // PART 2부터 이어 붙여 넣으세요.
    // =========================================================================

// ============================================================================
// PART 1 / 2 끝
// ============================================================================


// ============================================================================
// File : src/components/Workspace/Workspace.tsx
// PART 2 / 2 시작
// ============================================================================

    return (

        <div className="workspace">

            {/* ===============================================================
                Toolbar
            ================================================================ */}

            <Toolbar

                onNewJob={onAdd}

                onGenerate={startQueue}

                onOpen={onOpenProject}

                onSave={onSaveProject}

            />

            {/* ===============================================================
                Job Tabs
            ================================================================ */}

            <JobTabs

                project={project}

                onSwitch={onSwitchTab}

                onAdd={onAddTab}

                onDelete={onDeleteTab}

            />

            {/* ===============================================================
                Main Layout
            ================================================================ */}

            <div className="workspace-body">

                {/* -----------------------------------------------------------
                    Prompt
                ------------------------------------------------------------ */}

                <Prompt

                    project={project}

                    onStart={startQueue}

                    onAdd={onAdd}

                    onDelete={onDelete}

                    onEdit={onEdit}

                    onSelectPrompt={onSelectPrompt}

                />

                {/* -----------------------------------------------------------
                    Browser
                ------------------------------------------------------------ */}

                <Browser

                    ref={browserRef}

                />

                {/* -----------------------------------------------------------
                    Image Panel
                ------------------------------------------------------------ */}

                <ImageDrop

                    generatedImages={getCurrentJobs(project)
                        .filter(job => job.imagePath)
                        .map(job => ({
                            id: job.id,
                            path: job.imagePath as string,
                        }))}

                />

            </div>

            {/* ===============================================================
                Stop Queue Button
            ================================================================ */}

            {running && (

                <button

                    className="queue-stop-button"

                    onClick={stopQueue}

                >

                    Stop

                </button>

            )}

        </div>

    );

}

// ============================================================================
// File End
// PART 2 / 2 끝
// ============================================================================
