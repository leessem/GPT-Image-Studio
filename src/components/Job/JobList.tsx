// ============================================================================
// File : src/components/Job/JobList.tsx
//
// Primary navigation under the Job-first architecture: one row per Job,
// status + a short label, nothing else. Selecting a row loads that Job
// into JobDetail.
// ============================================================================

import "./JobList.css";

import { Job } from "../../types/Job";

const STATUS_ICON: Record<Job["status"], string> = {

    waiting: "○",

    running: "▶",

    done: "✔",

    error: "✖",

};

interface JobListProps {

    jobs: Job[];

    selectedJobId: string | null;

    onSelect: (id: string) => void;

    onCreate: () => void;

    onDelete: (id: string) => void;

}

export default function JobList({

    jobs,

    selectedJobId,

    onSelect,

    onCreate,

    onDelete,

}: JobListProps) {

    return (

        <div className="job-list-panel">

            <div className="job-list-header">

                Jobs

            </div>

            <div className="job-list">

                {jobs.map((job, index) => (

                    <div

                        key={job.id}

                        className={
                            "job-list-item " +
                            job.status +
                            (job.id === selectedJobId ? " selected" : "")
                        }

                        onClick={() => onSelect(job.id)}

                    >

                        <span className="job-list-status">

                            {STATUS_ICON[job.status]}

                        </span>

                        <span className="job-list-label">

                            {job.prompt
                                ? job.prompt.slice(0, 40)
                                : `Job ${index + 1}`}

                        </span>

                        <button

                            className="job-list-delete"

                            onClick={e => {

                                e.stopPropagation();

                                onDelete(job.id);

                            }}

                        >

                            ✕

                        </button>

                    </div>

                ))}

            </div>

            <div className="job-list-footer">

                <button onClick={onCreate}>

                    Create Job

                </button>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
