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

    revising: "Revising...",

};

interface WorkspacePanelProps {

    workspace: Workspace;

    prompts: PromptItem[];

    workTypes: WorkType[];

    onUploadImage: (dataUrl: string) => void;

    onRemoveImage: () => void;

    onSelectPrompt: (promptId: string) => void;

    onSelectWorkType: (workTypeId: string) => void;

    onSetCustomerName: (customerName: string) => void;

    onSetCustomerNumber: (customerNumber: string) => void;

    onSetCustomerColor: (customerColor: string) => void;

    onGenerate: () => void;

    onClear: () => void;

    /** v1.3.0 Custom Image Revision */
    onReviseImage: (instruction: string) => void;

}

export default function WorkspacePanel({

    workspace,

    prompts,

    workTypes,

    onUploadImage,

    onRemoveImage,

    onSelectPrompt,

    onSelectWorkType,

    onSetCustomerName,

    onSetCustomerNumber,

    onSetCustomerColor,

    onGenerate,

    onClear,

    onReviseImage,

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

    // ========================================================================
    // v1.3.0 Custom Image Revision - the input box's open/closed state and
    // typed text are transient local UI state (never stored on the
    // Workspace itself, same reasoning as showClearedMessage above), so a
    // failed or abandoned revision instruction can never leak into a
    // different Workspace tab or a later Generate. Force-reset whenever
    // the *displayed* workspace changes, same as showClearedMessage.
    // ========================================================================

    const [showReviseInput, setShowReviseInput] = useState(false);

    const [reviseInstruction, setReviseInstruction] = useState("");

    useEffect(() => {

        setShowClearedMessage(false);

        setShowReviseInput(false);

        setReviseInstruction("");

        return () => clearTimeout(clearedMessageTimeout.current);

    }, [workspace.id]);

    const handleReviseSubmit = () => {

        const trimmed = reviseInstruction.trim();

        if (!trimmed)
            return;

        onReviseImage(trimmed);

        setReviseInstruction("");

        setShowReviseInput(false);

    };

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

    // ========================================================================
    // Prompt Variable feature (v1.2.0) - the "사용자 이름" field only
    // appears for prompts whose Prompt Library entry has requiresName
    // set, and Generate is blocked while it's required but empty.
    // Independent of Work Type, which only ever affects filenames.
    // ========================================================================

    const selectedPrompt = prompts.find(p => p.id === workspace.selectedPromptId);

    const nameRequired = selectedPrompt?.requiresName ?? false;

    const nameMissing = nameRequired && !workspace.customerName?.trim();

    // ========================================================================
    // Prompt Variable feature (v1.2.1) - same mechanism as 사용자 이름
    // above, for the second reserved variable {NUM}. Independent of
    // requiresName/customerName - either, both, or neither can be
    // active for a given prompt/Workspace.
    // ========================================================================

    const numberRequired = selectedPrompt?.requiresNumber ?? false;

    const numberMissing = numberRequired && !workspace.customerNumber?.trim();

    // ========================================================================
    // Prompt Variable feature (v1.3.1) - same mechanism as 사용자 이름/
    // 숫자 above, for the third reserved variable {COLOR}. Independent
    // of requiresName/requiresNumber - any combination can be active
    // for a given prompt/Workspace.
    // ========================================================================

    const colorRequired = selectedPrompt?.requiresColor ?? false;

    const colorMissing = colorRequired && !workspace.customerColor?.trim();

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
                사용자 이름 (Prompt Variable) - only shown for prompts
                whose Prompt Library entry requires it.
            ---------------------------------------------------------- */}

            {nameRequired && (

                <div className="workspace-panel-section">

                    <div className="workspace-panel-section-title">

                        사용자 이름

                    </div>

                    <input

                        type="text"

                        className="workspace-customer-name-input"

                        value={workspace.customerName ?? ""}

                        onChange={e => onSetCustomerName(e.target.value)}

                        placeholder="이름을 입력하세요"

                    />

                    {nameMissing && (

                        <span className="workspace-name-required-message">
                            사용자 이름을 입력해주세요.
                        </span>

                    )}

                </div>

            )}

            {/* ---------------------------------------------------------
                숫자 (Prompt Variable) - only shown for prompts whose
                Prompt Library entry requires it. Independent of the
                사용자 이름 field above.
            ---------------------------------------------------------- */}

            {numberRequired && (

                <div className="workspace-panel-section">

                    <div className="workspace-panel-section-title">

                        숫자

                    </div>

                    <input

                        type="text"

                        className="workspace-customer-number-input"

                        value={workspace.customerNumber ?? ""}

                        onChange={e => onSetCustomerNumber(e.target.value)}

                        placeholder="숫자를 입력하세요"

                    />

                    {numberMissing && (

                        <span className="workspace-number-required-message">
                            숫자를 입력해주세요.
                        </span>

                    )}

                </div>

            )}

            {/* ---------------------------------------------------------
                색상 (Prompt Variable, v1.3.1) - only shown for prompts
                whose Prompt Library entry requires it. Independent of
                사용자 이름/숫자 above.
            ---------------------------------------------------------- */}

            {colorRequired && (

                <div className="workspace-panel-section">

                    <div className="workspace-panel-section-title">

                        색상

                    </div>

                    <input

                        type="text"

                        className="workspace-customer-color-input"

                        value={workspace.customerColor ?? ""}

                        onChange={e => onSetCustomerColor(e.target.value)}

                        placeholder="색상을 입력하세요"

                    />

                    {colorMissing && (

                        <span className="workspace-color-required-message">
                            색상을 입력해주세요.
                        </span>

                    )}

                </div>

            )}

            {/* ---------------------------------------------------------
                Generate / Clear
            ---------------------------------------------------------- */}

            <div className="workspace-panel-section">

                <div className="workspace-generate-row">

                    <button

                        className="workspace-generate-button"

                        disabled={
                            !workspace.prompt ||
                            workspace.status === "running" ||
                            workspace.status === "revising" ||
                            nameMissing ||
                            numberMissing ||
                            colorMissing
                        }

                        onClick={onGenerate}

                    >

                        Generate

                    </button>

                    <button

                        className="workspace-clear-button"

                        disabled={workspace.status === "running" || workspace.status === "revising"}

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

            {/* ---------------------------------------------------------
                v1.3.0 Custom Image Revision - only shown once this
                Workspace actually has a saved result image (imagePath
                is set the moment a Generate or an earlier revision
                completes, and is never cleared by the "Ready" reset -
                see generate.ts/revise.ts). Never sends the Prompt
                Library's own prompt again; only this short instruction
                plus the existing result image.
            ---------------------------------------------------------- */}

            {workspace.imagePath && (

                <div className="workspace-panel-section">

                    <div className="workspace-panel-section-title">

                        커스텀 수정

                    </div>

                    {!showReviseInput ? (

                        <button

                            className="workspace-revise-toggle-button"

                            disabled={workspace.status === "running" || workspace.status === "revising"}

                            onClick={() => setShowReviseInput(true)}

                        >

                            커스텀 수정

                        </button>

                    ) : (

                        <div className="workspace-revise-input">

                            <textarea

                                value={reviseInstruction}

                                onChange={e => setReviseInstruction(e.target.value)}

                                placeholder="원하는 수정 내용을 입력하세요"

                                rows={3}

                                disabled={workspace.status === "revising"}

                            />

                            <div className="workspace-revise-actions">

                                <button

                                    className="workspace-revise-submit-button"

                                    disabled={!reviseInstruction.trim() || workspace.status === "revising"}

                                    onClick={handleReviseSubmit}

                                >

                                    수정 생성

                                </button>

                                <button

                                    className="workspace-revise-cancel-button"

                                    disabled={workspace.status === "revising"}

                                    onClick={() => {

                                        setShowReviseInput(false);

                                        setReviseInstruction("");

                                    }}

                                >

                                    취소

                                </button>

                            </div>

                        </div>

                    )}

                </div>

            )}

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
