import { useEffect, useRef, useState } from "react";

import Browser, { BrowserHandle } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import ImageDrop from "../ImageDrop/ImageDrop";
import JobTabs from "./JobTabs";

import { Job } from "../types/Job";

import {
    buildPromptScript,
    buildWaitImageScript,
} from "../Browser/ChatGPT";

import "./Workspace.css";

const STORAGE_KEY = "gpt-image-studio-project";

const defaultJobs: Job[] = [
    {
        id: crypto.randomUUID(),
        prompt: "Ultra realistic portrait, 8k, masterpiece",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
    {
        id: crypto.randomUUID(),
        prompt: "Anime style, best quality, masterpiece",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
    {
        id: crypto.randomUUID(),
        prompt: "Cinematic photography, dramatic lighting",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
    {
        id: crypto.randomUUID(),
        prompt: "Fantasy landscape, ultra detailed",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
    {
        id: crypto.randomUUID(),
        prompt: "Luxury product photo, studio lighting",
        status: "waiting",
        createdAt: new Date().toISOString(),
    },
];

export default function Workspace() {

    const browserRef = useRef<BrowserHandle>(null);

    const stopRef = useRef(false);

    const [running, setRunning] = useState(false);

    const [jobs, setJobs] = useState<Job[]>(() => {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {

            try {

                return JSON.parse(saved);

            } catch {

            }

        }

        return defaultJobs;

    });

    useEffect(() => {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(jobs)
        );

    }, [jobs]);

    const startQueue = async () => {

        if (!browserRef.current)
            return;

        if (running)
            return;

        stopRef.current = false;

        setRunning(true);

        try {

            for (let i = 0; i < jobs.length; i++) {

                if (stopRef.current)
                    break;

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

                await browserRef.current.execute(
                    buildPromptScript(jobs[i].prompt)
                );

                await browserRef.current.execute(
                    buildWaitImageScript()
                );

                setJobs(prev =>
                    prev.map((job, index) =>

                        index === i

                            ? {

                                ...job,

                                status: "done",

                                completedAt: new Date().toISOString(),

                            }

                            : job

                    )
                );

            }

        } catch (err) {

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

        } finally {

            setRunning(false);

        }

    };

    const stopQueue = () => {

        stopRef.current = true;

    };

    const addJob = () => {

        setJobs(prev => [

            ...prev,

            {

                id: crypto.randomUUID(),

                prompt: "New Prompt",

                status: "waiting",

                createdAt: new Date().toISOString(),

            },

        ]);

    };

    const deleteJob = (id: string) => {

        setJobs(prev =>
            prev.filter(job => job.id !== id)
        );

    };

    const editJob = (

        id: string,

        prompt: string

    ) => {

        setJobs(prev =>
            prev.map(job =>

                job.id === id

                    ? {

                        ...job,

                        prompt,

                    }

                    : job

            )
        );

    };

    return (

        <div className="workspace">

            <Toolbar />

            <JobTabs />

            <div className="workspace-body">

                <Prompt

                    jobs={jobs}

                    onStart={startQueue}

                    onAdd={addJob}

                    onDelete={deleteJob}

                    onEdit={editJob}

                />

                <Browser
                    ref={browserRef}
                />

                <ImageDrop />

            </div>

            {running && (

                <button

                    style={{

                        position: "fixed",

                        right: 20,

                        bottom: 20,

                    }}

                    onClick={stopQueue}

                >

                    Stop

                </button>

            )}

        </div>

    );

}