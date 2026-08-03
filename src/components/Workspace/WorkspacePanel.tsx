// ============================================================================
// File : src/components/Workspace/WorkspacePanel.tsx
//
// V1.0: the right-hand panel for the current Workspace - Prompt select,
// Image Upload, Generate, Status. Nothing else (no Result/history section
// - every generated image is auto-saved to disk, there is nothing to
// browse here). Always shows the current Workspace directly - there is no
// separate Job to select, no empty state, since a Workspace always exists.
// ============================================================================

import { useRef, useState } from "react";

import "./WorkspacePanel.css";

import { Workspace } from "../../types/Workspace";
import { PromptItem } from "../../types/Prompt";

const STATUS_LABEL: Record<Workspace["status"], string> = {

    waiting: "Waiting",

    running: "Generating...",

    done: "Saved",

    error: "Error",

};

interface WorkspacePanelProps {

    workspace: Workspace;

    prompts: PromptItem[];

    running: boolean;

    onUploadImage: (dataUrl: string) => void;

    onRemoveImage: () => void;

    onSelectPrompt: (promptId: string) => void;

    onGenerate: () => void;

}

export default function WorkspacePanel({

    workspace,

    prompts,

    running,

    onUploadImage,

    onRemoveImage,

    onSelectPrompt,

    onGenerate,

}: WorkspacePanelProps) {

    const [isDragging, setIsDragging] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const addFile = (files: FileList | null) => {

        const file = files?.[0];

        if (!file || !file.type.startsWith("image/"))
            return;

        const reader = new FileReader();

        reader.onload = () => {

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
                Generate
            ---------------------------------------------------------- */}

            <div className="workspace-panel-section">

                <button

                    className="workspace-generate-button"

                    disabled={!workspace.prompt || running}

                    onClick={onGenerate}

                >

                    Generate

                </button>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
