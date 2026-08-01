// ============================================================================
// File : src/components/Prompt/Prompt.tsx
// ============================================================================

import "./Prompt.css";

import { Project } from "../../types/Project";
import { getCurrentJobs } from "../../services/JobService";

interface PromptProps {

    project: Project;

    onStart: () => void;

    onAdd: () => void;

    onDelete: (id: string) => void;

    onEdit: (id: string, prompt: string) => void;

}

export default function Prompt({

    project,

    onStart,

    onAdd,

    onDelete,

    onEdit,

}: PromptProps) {

    const jobs = getCurrentJobs(project);

    return (

        <div className="prompt-panel">

            <div className="prompt-header">

                Prompt Library

            </div>

            <div className="prompt-search">

                <input

                    placeholder="Search..."

                />

            </div>

            <div className="prompt-list">

                {jobs.map(job => (

                    <div

                        key={job.id}

                        className={`prompt-item ${job.status}`}

                    >

                        <span>

                            {job.status === "waiting" && "○"}

                            {job.status === "running" && "▶"}

                            {job.status === "done" && "✔"}

                            {job.status === "error" && "✖"}

                        </span>

                        <input

                            className="prompt-text"

                            value={job.prompt}

                            onChange={e =>

                                onEdit(

                                    job.id,

                                    e.target.value

                                )

                            }

                        />

                        <button

                            className="prompt-delete"

                            onClick={() =>

                                onDelete(job.id)

                            }

                        >

                            ✕

                        </button>

                    </div>

                ))}

            </div>

            <div

                style={{

                    display: "flex",

                    gap: 8,

                }}

            >

                <button

                    onClick={onAdd}

                >

                    Add

                </button>

                <button

                    onClick={onStart}

                >

                    Start Queue

                </button>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================