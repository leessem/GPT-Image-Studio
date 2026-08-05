// ============================================================================
// File : src/components/Workspace/WorkspacePanel.tsx
//
// V1.0: the right-hand panel for the current Workspace - Prompt select,
// Image Upload, Generate, Status. Nothing else (no Result/history section
// - every generated image is auto-saved to disk, there is nothing to
// browse here). Always shows the current Workspace directly - there is no
// separate Job to select, no empty state, since a Workspace always exists.
// ============================================================================

import { useEffect, useRef, useState } from "react";

import "./WorkspacePanel.css";

import { Workspace } from "../../types/Workspace";
import { PromptItem } from "../../types/Prompt";
import { WorkType } from "../../types/WorkType";
import { logWorkspaceEvent } from "../../utils/workspaceLogger";

const STATUS_LABEL: Record<Workspace["status"], string> = {

    waiting: "Ready",

    running: "Generating...",

    done: "Saved",

    error: "Error",

};

interface WorkspacePanelProps {

    workspace: Workspace;

    prompts: PromptItem[];

    workTypes: WorkType[];

    onUploadImage: (dataUrl: string) => void;

    onRemoveImage: () => void;

    onSelectPrompt: (promptId: string) => void;

    onSelectWorkType: (workTypeId: string) => void;

    onGenerate: () => void;

    onClear: () => void;

}

export default function WorkspacePanel({

    workspace,

    prompts,

    workTypes,

    onUploadImage,

    onRemoveImage,

    onSelectPrompt,

    onSelectWorkType,

    onGenerate,

    onClear,

}: WorkspacePanelProps) {

    const [isDragging, setIsDragging] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // ========================================================================
    // Clear - "✔ Workspace cleared" is a purely transient bit of local UI
    // feedback, not Workspace data, so it lives here rather than on the
    // Workspace object. Switching to a different Workspace tab must never
    // leave a stale message showing on it, so it's force-hidden whenever
    // the *displayed* workspace changes (this component instance is
    // reused across tabs - it never unmounts on switch).
    // ========================================================================

    const [showClearedMessage, setShowClearedMessage] = useState(false);

    const clearedMessageTimeout = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {

        setShowClearedMessage(false);

        return () => clearTimeout(clearedMessageTimeout.current);

    }, [workspace.id]);

    const handleClear = () => {

        onClear();

        setShowClearedMessage(true);

        clearTimeout(clearedMessageTimeout.current);

        clearedMessageTimeout.current = setTimeout(
            () => setShowClearedMessage(false),
            1000
        );

    };

    const addFile = (files: FileList | null) => {

        const file = files?.[0];

        if (!file || !file.type.startsWith("image/"))
            return;

        // TEMPORARY (V1.1 Workspace-isolation audit): logs the exact
        // Workspace this attach-image action targets - see
        // src/utils/workspaceLogger.ts. This is the literal "Upload an
        // image" UI action from the reported repro steps, distinct from
        // generate.ts's later "Upload Start/Complete" (attaching the
        // image into ChatGPT's own composer during Generate).
        logWorkspaceEvent(workspace.id, "Upload Start", {
            source: "attach-image-ui",
            fileName: file.name,
            fileSize: file.size,
        });

        const reader = new FileReader();

        reader.onload = () => {

            logWorkspaceEvent(workspace.id, "Upload Complete", {
                source: "attach-image-ui",
                fileName: file.name,
            });

            onUploadImage(reader.result as string);

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

        <div className="workspace-panel">

            <div className="workspace-panel-header">

                <span>Workspace</span>

                <span className={`workspace-status-badge ${workspace.status}`}>

                    {STATUS_LABEL[workspace.status]}

                </span>

            </div>

            {/* ---------------------------------------------------------
                Upload Image
            ---------------------------------------------------------- */}

            <div className="workspace-panel-section">

                <div className="workspace-panel-section-title">

                    Image

                </div>

                {workspace.uploadedImagePath ? (

                    <div className="workspace-upload-preview">

                        <img src={workspace.uploadedImagePath} alt="Uploaded" />

                        <button onClick={onRemoveImage}>

                            Remove

                        </button>

                    </div>

                ) : (

                    <div

                        className={
                            "workspace-upload-dropzone" +
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

                    className="workspace-upload-input"

                    onChange={e => addFile(e.target.files)}

                />

            </div>

            {/* ---------------------------------------------------------
                Select Prompt
            ---------------------------------------------------------- */}

            <div className="workspace-panel-section">

                <div className="workspace-panel-section-title">

                    Prompt

                </div>

                <select

                    value={workspace.selectedPromptId ?? ""}

                    onChange={e => {

                        const promptId = e.target.value;

                        if (promptId)
                            onSelectPrompt(promptId);

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

            </div>

            {/* ---------------------------------------------------------
                Work Type - at most one selected, independent per
                Workspace. Compact chips, not full-size buttons.
            ---------------------------------------------------------- */}

            {workTypes.length > 0 && (

                <div className="workspace-panel-section">

                    <div className="workspace-panel-section-title">

                        Work Type

                    </div>

                    <div className="workspace-worktype-chips">

                        {workTypes.map(workType => (

                            <button

                                key={workType.id}

                                className={
                                    "workspace-worktype-chip" +
                                    (workspace.workTypeId === workType.id ? " active" : "")
                                }

                                onClick={() => onSelectWorkType(workType.id)}

                            >

                                {workType.displayName}

                            </button>

                        ))}

                    </div>

                </div>

            )}

            {/* ---------------------------------------------------------
                Generate / Clear
            ---------------------------------------------------------- */}

            <div className="workspace-panel-section">

                <div className="workspace-generate-row">

                    <button

                        className="workspace-generate-button"

                        disabled={!workspace.prompt || workspace.status === "running"}

                        onClick={onGenerate}

                    >

                        Generate

                    </button>

                    <button

                        className="workspace-clear-button"

                        disabled={workspace.status === "running"}

                        onClick={handleClear}

                    >

                        Clear

                    </button>

                </div>

                {showClearedMessage && (

                    <span className="workspace-cleared-message">
                        ✔ Workspace cleared
                    </span>

                )}

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
