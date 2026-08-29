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

import CropModal from "./CropModal";

import { CropRect, Workspace } from "../../types/Workspace";
import { PromptItem } from "../../types/Prompt";
import { WorkType } from "../../types/WorkType";
import { logWorkspaceEvent } from "../../utils/workspaceLogger";
import { MAX_ADDITIONAL_IMAGES } from "../../services/WorkspaceService";

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

    /** Multi Image Upload (v1.4.1) - called once per selected file, in
     *  selection order. */
    onAddAdditionalImage: (dataUrl: string) => void;

    /** Multi Image Upload (v1.4.1) */
    onRemoveAdditionalImage: (index: number) => void;

    /** Original Image Crop (v1.4.0) */
    onApplyCrop: (croppedDataUrl: string, cropRect: CropRect) => void;

    /** Multi Image Upload + per-image Crop (v1.4.1) */
    onApplyAdditionalImageCrop: (
        additionalImageId: string,
        croppedDataUrl: string,
        cropRect: CropRect
    ) => void;

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

    onAddAdditionalImage,

    onRemoveAdditionalImage,

    onApplyCrop,

    onApplyAdditionalImageCrop,

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

    // Multi Image Upload (v1.4.1) - separate file input for the "이미지
    // 추가" control, distinct from the primary dropzone's inputRef above.
    const additionalInputRef = useRef<HTMLInputElement>(null);

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

    // ========================================================================
    // Original Image Crop (v1.4.0) + per-image Crop (v1.4.1) - which
    // image the Crop UI is currently open for, if any: "primary" for
    // the main uploaded image, or an additional image's own stable id
    // (see types/Workspace.ts's AdditionalImage). Purely local,
    // transient UI state (same reasoning as showClearedMessage/
    // showReviseInput above), force-closed whenever the *displayed*
    // workspace changes so switching tabs can never leave one
    // Workspace's Crop UI open over a different Workspace's image.
    // ========================================================================

    const [cropTarget, setCropTarget] = useState<"primary" | string | null>(null);

    useEffect(() => {

        setShowClearedMessage(false);

        setShowReviseInput(false);

        setReviseInstruction("");

        setCropTarget(null);

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

    const readFileAsDataUrl = (file: File): Promise<string | null> =>

        new Promise(resolve => {

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result as string);

            reader.onerror = () => {

                console.error("[WorkspacePanel] failed to read image file", file.name);

                resolve(null);

            };

            reader.readAsDataURL(file);

        });

    // ========================================================================
    // Multi Image Upload (v1.4.1) - one shared handler for every image-
    // file entry point (the primary dropzone's click-to-upload AND
    // drag/drop, and the "이미지 추가" button's click-to-select AND
    // drag/drop): reads every selected/dropped file as a data: URL, in
    // the exact order the browser reports them, and never reorders.
    //
    // If this Workspace has no primary image yet, the FIRST file in the
    // list becomes it (via onUploadImage) - this keeps the original
    // "select 1 image -> Upload" flow byte-for-byte identical when
    // exactly one file is chosen, while also letting a single multi-
    // file drag/drop or multi-select fill the primary + several
    // additional slots in one action, per user request ("여러장이
    // 한번에 드래그로 올라가면 좋겠다"). Every remaining file (or every
    // file, if a primary already exists) becomes an additional image,
    // up to whatever's left of MAX_ADDITIONAL_IMAGES - anything beyond
    // that is silently dropped (the "이미지 추가" button is already
    // disabled at the cap, so this only matters for a drop/multi-select
    // that itself exceeds the remaining slots). Non-image files are
    // skipped entirely.
    // ========================================================================

    const addFiles = async (files: FileList | null) => {

        if (!files || files.length === 0)
            return;

        const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));

        if (imageFiles.length === 0)
            return;

        let nextIndex = 0;

        if (!workspace.uploadedImagePath) {

            const primaryFile = imageFiles[0];

            // TEMPORARY (V1.1 Workspace-isolation audit): logs the exact
            // Workspace this attach-image action targets - see
            // src/utils/workspaceLogger.ts. This is the literal "Upload
            // an image" UI action from the reported repro steps,
            // distinct from generate.ts's later "Upload Start/Complete"
            // (attaching the image into ChatGPT's own composer during
            // Generate).
            logWorkspaceEvent(workspace.id, "Upload Start", {
                source: "attach-image-ui",
                fileName: primaryFile.name,
                fileSize: primaryFile.size,
            });

            const primaryDataUrl = await readFileAsDataUrl(primaryFile);

            if (primaryDataUrl) {

                logWorkspaceEvent(workspace.id, "Upload Complete", {
                    source: "attach-image-ui",
                    fileName: primaryFile.name,
                });

                onUploadImage(primaryDataUrl);

            }

            nextIndex = 1;

        }

        const remainingSlots = MAX_ADDITIONAL_IMAGES - (workspace.additionalImages?.length ?? 0);

        const additionalFiles = imageFiles.slice(nextIndex, nextIndex + Math.max(0, remainingSlots));

        for (const file of additionalFiles) {

            const dataUrl = await readFileAsDataUrl(file);

            if (dataUrl)
                onAddAdditionalImage(dataUrl);

        }

    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        setIsDragging(false);

        void addFiles(e.dataTransfer.files);

    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        setIsDragging(true);

    };

    const onDragLeave = () => {

        setIsDragging(false);

    };

    // Multi Image Upload (v1.4.1) - same drag/drop support as the
    // primary dropzone above, scoped to the additional-images section
    // (only rendered once a primary image already exists).
    const [isDraggingAdditional, setIsDraggingAdditional] = useState(false);

    const additionalDropDisabled =
        workspace.status === "running" ||
        workspace.status === "revising" ||
        (workspace.additionalImages?.length ?? 0) >= MAX_ADDITIONAL_IMAGES;

    const onDropAdditional = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        setIsDraggingAdditional(false);

        if (additionalDropDisabled)
            return;

        void addFiles(e.dataTransfer.files);

    };

    const onDragOverAdditional = (e: React.DragEvent<HTMLDivElement>) => {

        e.preventDefault();

        if (!additionalDropDisabled)
            setIsDraggingAdditional(true);

    };

    const onDragLeaveAdditional = () => {

        setIsDraggingAdditional(false);

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

    // Multi Image Upload polish (v1.4.1, per live user feedback) - once
    // additional images exist, the primary preview shrinks to the same
    // small-thumbnail size as the additional list below (with its own
    // "1" order badge to match their 2/3/4/5), so the whole set reads
    // as one consistent row instead of one oversized image next to
    // several small ones. A Workspace with no additional images keeps
    // the original full-size preview exactly as before.
    const isMultiImage = (workspace.additionalImages?.length ?? 0) > 0;

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

                    <div className={"workspace-upload-preview" + (isMultiImage ? " compact" : "")}>

                        {/* -----------------------------------------------
                            Original Image Crop (v1.4.0) - the preview
                            shows the Crop result once one is applied, so
                            the user can see at a glance what will actually
                            be uploaded to ChatGPT (generate.ts uses this
                            same `croppedImagePath ?? uploadedImagePath`
                            precedence). The underlying original is never
                            touched or lost - [크롭] always re-opens the
                            CropModal against workspace.uploadedImagePath
                            itself (see below), never against this cropped
                            preview, so re-editing can still widen back out
                            past the current selection.
                        ------------------------------------------------ */}

                        <div className="workspace-upload-preview-image-wrap">

                            <img
                                src={workspace.croppedImagePath ?? workspace.uploadedImagePath}
                                alt="Uploaded"
                            />

                            {isMultiImage && (

                                <span className="workspace-additional-image-order">1</span>

                            )}

                        </div>

                        <div className="workspace-image-actions">

                            <button

                                disabled={workspace.status === "running" || workspace.status === "revising"}

                                onClick={() => inputRef.current?.click()}

                            >

                                원본 교체

                            </button>

                            <button

                                disabled={workspace.status === "running" || workspace.status === "revising"}

                                onClick={() => setCropTarget("primary")}

                            >

                                크롭

                            </button>

                            <button

                                className="workspace-image-delete"

                                disabled={workspace.status === "running" || workspace.status === "revising"}

                                onClick={onRemoveImage}

                            >

                                삭제

                            </button>

                        </div>

                        {workspace.croppedImagePath && (

                            <span className="workspace-crop-status">

                                ✂ Crop 적용됨 - 다시 편집하려면 [크롭]을 누르세요

                            </span>

                        )}

                        {/* -----------------------------------------------
                            Multi Image Upload (v1.4.1) - additional
                            images uploaded together with the primary
                            image above, in selection order. Only shown
                            once a primary image exists - this list
                            always builds on top of it, never standalone.
                        ------------------------------------------------ */}

                        <div

                            className={
                                "workspace-additional-images" +
                                (isDraggingAdditional ? " dragging" : "")
                            }

                            onDrop={onDropAdditional}

                            onDragOver={onDragOverAdditional}

                            onDragLeave={onDragLeaveAdditional}

                        >

                            <div className="workspace-additional-images-header">

                                <span className="workspace-additional-images-count">

                                    이미지 {(workspace.additionalImages?.length ?? 0) + 1}/{MAX_ADDITIONAL_IMAGES + 1}

                                </span>

                                <button

                                    type="button"

                                    className="workspace-additional-image-add-button"

                                    disabled={additionalDropDisabled}

                                    onClick={() => additionalInputRef.current?.click()}

                                >

                                    + 이미지 추가 (드래그 가능)

                                </button>

                            </div>

                            {workspace.additionalImages && workspace.additionalImages.length > 0 && (

                                <div className="workspace-additional-image-list">

                                    {workspace.additionalImages.map((image, index) => (

                                        <div key={image.id} className="workspace-additional-image-item">

                                            <span className="workspace-additional-image-order">

                                                {index + 2}

                                            </span>

                                            <img
                                                src={image.croppedImagePath ?? image.originalImagePath}
                                                alt={`추가 이미지 ${index + 2}`}
                                            />

                                            {image.croppedImagePath && (

                                                <span
                                                    className="workspace-additional-image-crop-badge"
                                                    title="Crop 적용됨"
                                                >
                                                    ✂
                                                </span>

                                            )}

                                            <div className="workspace-additional-image-actions">

                                                <button

                                                    type="button"

                                                    disabled={workspace.status === "running" || workspace.status === "revising"}

                                                    onClick={() => setCropTarget(image.id)}

                                                >

                                                    크롭

                                                </button>

                                                <button

                                                    type="button"

                                                    className="workspace-additional-image-delete"

                                                    disabled={workspace.status === "running" || workspace.status === "revising"}

                                                    onClick={() => onRemoveAdditionalImage(index)}

                                                >

                                                    삭제

                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                            <input

                                ref={additionalInputRef}

                                type="file"

                                accept="image/*"

                                multiple

                                className="workspace-upload-input"

                                onChange={e => {

                                    void addFiles(e.target.files);

                                    e.target.value = "";

                                }}

                            />

                        </div>

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

                        Drag & Drop or Click to Upload (여러 장 동시 선택 가능)

                    </div>

                )}

                <input

                    ref={inputRef}

                    type="file"

                    accept="image/*"

                    multiple

                    className="workspace-upload-input"

                    onChange={e => {

                        void addFiles(e.target.files);

                        e.target.value = "";

                    }}

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

            {/* ---------------------------------------------------------
                Original Image Crop (v1.4.0) - only ever opened against
                this Workspace's own uploadedImagePath (the untouched
                original), never against a Crop result.
            ---------------------------------------------------------- */}

            {cropTarget === "primary" && workspace.uploadedImagePath && (

                <CropModal

                    imageDataUrl={workspace.uploadedImagePath}

                    initialCropRect={workspace.cropRect}

                    onApply={(croppedDataUrl, cropRect) => {

                        onApplyCrop(croppedDataUrl, cropRect);

                        setCropTarget(null);

                    }}

                    onCancel={() => setCropTarget(null)}

                />

            )}

            {/* ---------------------------------------------------------
                per-image Crop (v1.4.1) - same CropModal, scoped to one
                additional image's own originalImagePath, addressed by
                its stable id (cropTarget holds that id whenever it's
                not "primary"/null). Independent of the primary Crop
                above and of every other additional image's.
            ---------------------------------------------------------- */}

            {cropTarget !== null && cropTarget !== "primary" && (() => {

                const target = workspace.additionalImages?.find(image => image.id === cropTarget);

                if (!target)
                    return null;

                return (

                    <CropModal

                        imageDataUrl={target.originalImagePath}

                        initialCropRect={target.cropRect}

                        onApply={(croppedDataUrl, cropRect) => {

                            onApplyAdditionalImageCrop(target.id, croppedDataUrl, cropRect);

                            setCropTarget(null);

                        }}

                        onCancel={() => setCropTarget(null)}

                    />

                );

            })()}

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
