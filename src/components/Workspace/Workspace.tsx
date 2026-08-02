// ============================================================================
// File : src/components/Workspace/Workspace.tsx
//
// Job-first architecture: Job is the primary object. Each Job owns its
// own uploaded image, selected prompt, status and result - JobList/
// JobDetail are the primary UI, Prompt is now template management only.
// ============================================================================

import { useRef, useState, useEffect } from "react";
import type { SetStateAction } from "react";

import Browser, { BrowserHandle, CHATGPT_HOME_URL } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import JobList from "../Job/JobList";
import JobDetail from "../Job/JobDetail";
import JobTabs from "./JobTabs";

import { Project, createProject } from "../../types/Project";
import { PromptDraft, PromptItem } from "../../types/Prompt";

import { defaultJobs } from "../data/defaultJobs";

import { runQueue } from "../Queue/QueueRunner";

import PromptStore from "../../store/Promptstore";

import {
    loadProject,
    saveProject,
    isValidProject,
} from "../../utils/ProjectStorage";

import {
    createJob,
    deleteJob,
    setJobPrompt,
    setJobUploadedImage,
    addTab,
    deleteTab,
    switchTab,
    getCurrentTab,
    getCurrentJobs,
    updateCurrentJobs,
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
    // Browser (one shared webview/partition/login for every Job - a Job's
    // independence comes from its own conversationUrl, not a separate
    // browser profile)
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

    const jobs = getCurrentJobs(project);

    // Mirrors `project` for the job-switch navigation effect below, so that
    // effect can depend on selectedJobId alone (not on project, which
    // changes constantly during generation) while still reading fresh data.
    const projectRef = useRef(project);

    useEffect(() => {

        projectRef.current = project;

    }, [project]);

    // ========================================================================
    // Job selection (primary object under the Job-first architecture)
    // ========================================================================

    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const selectedJob = selectedJobId
        ? jobs.find(job => job.id === selectedJobId) ?? null
        : null;

    // Switching to a Job restores its own ChatGPT conversation (or starts a
    // fresh one if it doesn't have one yet) in the one shared webview. Keyed
    // only on selectedJobId - reads the latest job data via projectRef so it
    // never re-navigates just because some other project state changed.
    useEffect(() => {

        if (!browserRef.current || !selectedJobId)
            return;

        const job = getCurrentJobs(projectRef.current).find(
            j => j.id === selectedJobId
        );

        browserRef.current.loadURL(job?.conversationUrl ?? CHATGPT_HOME_URL);

    }, [selectedJobId]);

    // ========================================================================
    // Prompt Library selection
    //
    // PromptStore is the single source of truth for prompt data - Workspace
    // only keeps track of which prompt id is selected, never a copy of its
    // title/prompt/negativePrompt content.
    // ========================================================================

    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(
        null
    );

    // PromptStore is the source of truth for prompt content - this is just
    // a rendering cache kept in lockstep with it, re-synced immediately
    // after every mutation (create/update/remove) since the plain
    // singleton store can't trigger a React re-render on its own.
    const [prompts, setPrompts] = useState<PromptItem[]>(() =>
        PromptStore.getAll()
    );

    const selectedPrompt = selectedPromptId
        ? prompts.find(item => item.id === selectedPromptId) ?? null
        : null;

    // ========================================================================
    // Auto Save
    // ========================================================================

    useEffect(() => {

        saveProject(project);

    }, [project]);

    // ========================================================================
    // Queue Start (tab-wide bulk run - unchanged automation, unchanged path)
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
    // Generate a single Job (Job-first "Generate" step)
    //
    // Runs the exact same, unmodified runQueue()/QueueRunner through a
    // scoped one-job "view" of the project, then merges the result back
    // onto the real job by id. QueueRunner/ChatGPT.ts are untouched.
    // ========================================================================

    const onGenerateJob = async (jobId: string) => {

        console.log("[Queue] Generate clicked for job", jobId);

        if (!browserRef.current) {
            console.error("[Queue] Aborted: browser ref not ready");
            return;
        }

        if (running) {
            console.warn("[Queue] Aborted: queue already running");
            return;
        }

        const currentTab = getCurrentTab(project);

        const job = currentTab.jobs.find(j => j.id === jobId);

        if (!job)
            return;

        let scopedProject: Project = {

            ...project,

            tabs: project.tabs.map(tab =>
                tab.id === currentTab.id
                    ? { ...tab, jobs: [job] }
                    : tab
            ),

        };

        stopRef.current = false;

        await runQueue({

            browser: browserRef.current,

            project: scopedProject,

            stopRef,

            setProject: (update: SetStateAction<Project>) => {

                scopedProject =
                    typeof update === "function"
                        ? update(scopedProject)
                        : update;

                const scopedJob = getCurrentJobs(scopedProject)[0];

                if (!scopedJob)
                    return;

                setProject(prevReal =>
                    updateCurrentJobs(prevReal, tabJobs =>
                        tabJobs.map(j =>
                            j.id === scopedJob.id ? scopedJob : j
                        )
                    )
                );

            },

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
    // Job Event (Job-first: create / select / delete / upload / prompt)
    // ========================================================================

    const onCreateJob = () => {

        const job = createJob();

        setProject(prev =>
            updateCurrentJobs(prev, tabJobs => [...tabJobs, job])
        );

        setSelectedJobId(job.id);

    };

    const onSelectJob = (id: string) => {

        setSelectedJobId(id);

    };

    const onDeleteJob = (id: string) => {

        setProject(prev => deleteJob(prev, id));

        setSelectedJobId(prev => (prev === id ? null : prev));

    };

    const onUploadJobImage = (jobId: string, dataUrl: string) => {

        setProject(prev => setJobUploadedImage(prev, jobId, dataUrl));

    };

    const onRemoveJobImage = (jobId: string) => {

        setProject(prev => setJobUploadedImage(prev, jobId, undefined));

    };

    const onSelectJobPrompt = (jobId: string, promptId: string) => {

        const item = prompts.find(p => p.id === promptId);

        if (!item)
            return;

        setProject(prev => setJobPrompt(prev, jobId, promptId, item.prompt));

    };

    // ========================================================================
    // Prompt Library (template management only)
    // ========================================================================

    const onSelectPrompt = (id: string) => {

        setSelectedPromptId(id);

    };

    const onNewPrompt = () => {

        setSelectedPromptId(null);

    };

    const onCreatePrompt = (draft: PromptDraft) => {

        const created = PromptStore.create(draft);

        setPrompts(PromptStore.getAll());

        setSelectedPromptId(created.id);

    };

    const onSavePrompt = (id: string, draft: PromptDraft) => {

        PromptStore.update(id, draft);

        setPrompts(PromptStore.getAll());

    };

    const onDeletePrompt = (id: string) => {

        PromptStore.remove(id);

        setPrompts(PromptStore.getAll());

        setSelectedPromptId(prev => (prev === id ? null : prev));

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

    return (

        <div className="workspace">

            {/* ===============================================================
                Toolbar
            ================================================================ */}

            <Toolbar

                onNewJob={onCreateJob}

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
                    Sidebar: Job List (primary nav) + Prompt Library
                    (template collection only)
                ------------------------------------------------------------ */}

                <div className="workspace-sidebar">

                    <JobList

                        jobs={jobs}

                        selectedJobId={selectedJobId}

                        onSelect={onSelectJob}

                        onCreate={onCreateJob}

                        onDelete={onDeleteJob}

                    />

                    <Prompt

                        prompts={prompts}

                        selectedPromptId={selectedPromptId}

                        selectedPrompt={selectedPrompt}

                        onSelectPrompt={onSelectPrompt}

                        onNewPrompt={onNewPrompt}

                        onCreatePrompt={onCreatePrompt}

                        onSavePrompt={onSavePrompt}

                        onDeletePrompt={onDeletePrompt}

                    />

                </div>

                {/* -----------------------------------------------------------
                    Browser
                ------------------------------------------------------------ */}

                <Browser

                    ref={browserRef}

                />

                {/* -----------------------------------------------------------
                    Job Detail: upload image, select prompt, generate,
                    status, result - all scoped to the selected Job
                ------------------------------------------------------------ */}

                <JobDetail

                    job={selectedJob}

                    prompts={prompts}

                    running={running}

                    onUploadImage={onUploadJobImage}

                    onRemoveImage={onRemoveJobImage}

                    onSelectPrompt={onSelectJobPrompt}

                    onGenerate={onGenerateJob}

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
// ============================================================================
