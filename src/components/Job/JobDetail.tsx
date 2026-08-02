// ============================================================================
// File : src/components/Job/JobDetail.tsx
//
// Per-Job session view under the Job-first architecture: upload an
// image, select a prompt from the Prompt Library, Generate, watch
// status, see the result - all scoped to one Job.
// ============================================================================

import { useRef, useState } from "react";

import "./JobDetail.css";

import { Job } from "../../types/Job";
import { PromptItem } from "../../types/Prompt";
import { toFileUrl } from "../../utils/fileUrl";

const STATUS_LABEL: Record<Job["status"], string> = {

    waiting: "Waiting",

    running: "Generating...",

    done: "Done",

    error: "Error",

};

interface JobDetailProps {

    job: Job | null;

    prompts: PromptItem[];

    running: boolean;

    onUploadImage: (jobId: string, dataUrl: string) => void;

    onRemoveImage: (jobId: string) => void;

    onSelectPrompt: (jobId: string, promptId: string) => void;

    onGenerate: (jobId: string) => void;

}

export default function JobDetail({

    job,

    prompts,

    running,

    onUploadImage,

    onRemoveImage,

    onSelectPrompt,

    onGenerate,

}: JobDetailProps) {

    const [isDragging, setIsDragging] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    if (!job) {

        return (

            <div className="job-detail job-detail-empty">

                Select or create a job.

            </div>

        );

    }

    const addFile = (files: FileList | null) => {

        const file = files?.[0];

        if (!file || !file.type.startsWith("image/"))
            return;

        const reader = new FileReader();

        reader.onload = () => {

            onUploadImage(job.id, reader.result as string);

        };

        reader.readAsDataURL(file);

    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        setIsDragging(false);

        addFile(e.dataTransfer.files);

    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        setIsDragging(true);

    };

    const onDragLeave = () => {

        setIsDragging(false);

    };

    return (

        <div className="job-detail">

            <div className="job-detail-header">

                <span>Job Detail</span>

                <span className={`job-status-badge ${job.status}`}>

                    {STATUS_LABEL[job.status]}

                </span>

            </div>

            {/* ---------------------------------------------------------
                1. Upload Image
            ---------------------------------------------------------- */}

            <div className="job-detail-section">

                <div className="job-detail-section-title">

                    Uploaded Image

                </div>

                {job.uploadedImagePath ? (

                    <div className="job-upload-preview">

                        <img src={job.uploadedImagePath} alt="Uploaded" />

                        <button

                            onClick={() => onRemoveImage(job.id)}

                        >

                            Remove

                        </button>

                    </div>

                ) : (

                    <div

                        className={
                            "job-upload-dropzone" +
                            (isDragging ? " dragging" : "")
                        }

                        onDrop={onDrop}

                        onDragOver={onDragOver}

                        onDragLeave={onDragLeave}

                        onClick={() => inputRef.current?.click()}

                    >

                        Drag & Drop or Click to Upload

                    </div>

                )}

                <input

                    ref={inputRef}

                    type="file"

                    accept="image/*"

                    className="job-upload-input"

                    onChange={e => addFile(e.target.files)}

                />

            </div>

            {/* ---------------------------------------------------------
                2. Select Prompt
            ---------------------------------------------------------- */}

            <div className="job-detail-section">

                <div className="job-detail-section-title">

                    Prompt

                </div>

                <select

                    value={job.selectedPromptId ?? ""}

                    onChange={e => {

                        const promptId = e.target.value;

                        if (promptId)
                            onSelectPrompt(job.id, promptId);

                    }}

                >

                    <option value="" disabled>

                        Select a prompt from the Library...

                    </option>

                    {prompts.map(item => (

                        <option key={item.id} value={item.id}>

                            {item.title}

                        </option>

                    ))}

                </select>

                {job.prompt && (

                    <div className="job-prompt-preview">

                        {job.prompt}

                    </div>

                )}

            </div>

            {/* ---------------------------------------------------------
                3. Generate
            ---------------------------------------------------------- */}

            <div className="job-detail-section">

                <button

                    className="job-generate-button"

                    disabled={!job.prompt || running}

                    onClick={() => onGenerate(job.id)}

                >

                    Generate

                </button>

            </div>

            {/* ---------------------------------------------------------
                4. Result (auto-saved by QueueRunner into job.imagePath)
            ---------------------------------------------------------- */}

            <div className="job-detail-section job-detail-result">

                <div className="job-detail-section-title">

                    Result

                </div>

                {job.imagePath ? (

                    <img

                        className="job-result-image"

                        src={toFileUrl(job.imagePath)}

                        alt="Generated"

                    />

                ) : (

                    <div className="job-result-empty">

                        No result yet.

                    </div>

                )}

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
