// ============================================================================
// File : src/components/Prompt/PromptModal.tsx
//
// One modal used for both Create ("New Prompt") and Edit ("Edit Prompt") -
// mode is decided by the caller (Prompt.tsx) based on which action opened
// it. Delete only appears in edit mode and asks for confirmation first.
// ============================================================================

import { useEffect, useState } from "react";

import { PromptDraft, PromptItem } from "../../types/Prompt";
import { TXT_ATTACHMENT_FORCE_INSTRUCTION } from "../Browser/ChatGPT";

interface PromptModalProps {

    mode: "create" | "edit";

    initial: PromptItem | null;

    onSave: (draft: PromptDraft) => void;

    onDelete?: () => void;

    onCancel: () => void;

}

export default function PromptModal({

    mode,

    initial,

    onSave,

    onDelete,

    onCancel,

}: PromptModalProps) {

    const [title, setTitle] = useState(initial?.title ?? "");

    const [prompt, setPrompt] = useState(initial?.prompt ?? "");

    const [negativePrompt, setNegativePrompt] = useState(
        initial?.negativePrompt ?? ""
    );

    const [requiresName, setRequiresName] = useState(
        initial?.requiresName ?? false
    );

    const [requiresNumber, setRequiresNumber] = useState(
        initial?.requiresNumber ?? false
    );

    const [requiresColor, setRequiresColor] = useState(
        initial?.requiresColor ?? false
    );

    const [txtAttachmentMode, setTxtAttachmentMode] = useState(
        initial?.txtAttachmentMode ?? false
    );

    const handleSave = () => {

        onSave({

            title: title.trim(),

            prompt,

            negativePrompt,

            requiresName,

            requiresNumber,

            requiresColor,

            txtAttachmentMode,

        });

    };

    const handleDelete = () => {

        if (window.confirm("Delete this prompt? This cannot be undone.")) {
            onDelete?.();
        }

    };

    // ESC closes the modal the same as Cancel - the only keyboard close
    // path, added here since none existed before. Bound to the document
    // for the modal's whole mounted lifetime (it's only ever mounted
    // while open - see Prompt.tsx's conditional render).
    useEffect(() => {

        const onKeyDown = (e: KeyboardEvent) => {

            if (e.key === "Escape")
                onCancel();

        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);

    }, [onCancel]);

    return (

        // Dismissing on the overlay's onClick used to also fire when a
        // text-selection drag started inside the modal (e.g. selecting
        // part of a long Prompt) and was released outside it - browsers
        // resolve a "click" from wherever mouseup lands, not from where
        // the drag started, so that drag looked identical to a genuine
        // outside click and closed the modal, discarding in-progress
        // edits. Tracking mousedown's own origin instead of click fixes
        // this structurally: a drag that starts inside .prompt-modal
        // never lets its mousedown reach this overlay's handler at all
        // (stopped at the modal's own boundary below), regardless of
        // where the mouseup/drag-release ends up - only a mousedown that
        // itself originates on the overlay (a genuine outside click) can
        // ever dismiss it.
        <div className="prompt-modal-overlay" onMouseDown={onCancel}>

            <div
                className="prompt-modal"
                onMouseDown={e => e.stopPropagation()}
            >

                <div className="prompt-modal-title">

                    {mode === "create" ? "New Prompt" : "Edit Prompt"}

                </div>

                <label className="prompt-modal-field">

                    <span>Title</span>

                    <input

                        autoFocus

                        value={title}

                        onChange={e => setTitle(e.target.value)}

                    />

                </label>

                <label className="prompt-modal-field">

                    <span>Prompt</span>

                    {txtAttachmentMode && (

                        // Locked, not part of `prompt`'s own editable state -
                        // see ChatGPT.ts's TXT_ATTACHMENT_FORCE_INSTRUCTION
                        // doc comment for why this can never be edited or
                        // deleted per-Prompt. generate.ts prepends the exact
                        // same constant to the actual text sent, so this is
                        // a preview of real behavior, not just a UI label.
                        <div className="prompt-modal-locked-line">
                            {TXT_ATTACHMENT_FORCE_INSTRUCTION}
                        </div>

                    )}

                    <textarea

                        value={prompt}

                        onChange={e => setPrompt(e.target.value)}

                    />

                </label>

                <label className="prompt-modal-field">

                    <span>Negative Prompt</span>

                    <textarea

                        value={negativePrompt}

                        onChange={e => setNegativePrompt(e.target.value)}

                    />

                </label>

                <label className="prompt-modal-checkbox-field">

                    <input

                        type="checkbox"

                        checked={requiresName}

                        onChange={e => setRequiresName(e.target.checked)}

                    />

                    <span>사용자 이름 입력 필요</span>

                </label>

                <label className="prompt-modal-checkbox-field">

                    <input

                        type="checkbox"

                        checked={requiresNumber}

                        onChange={e => setRequiresNumber(e.target.checked)}

                    />

                    <span>숫자 입력 필요</span>

                </label>

                <label className="prompt-modal-checkbox-field">

                    <input

                        type="checkbox"

                        checked={requiresColor}

                        onChange={e => setRequiresColor(e.target.checked)}

                    />

                    <span>색상 입력 필요</span>

                </label>

                <label className="prompt-modal-checkbox-field">

                    <input

                        type="checkbox"

                        checked={txtAttachmentMode}

                        onChange={e => setTxtAttachmentMode(e.target.checked)}

                    />

                    <span>TXT 첨부 방식</span>

                </label>

                <p className="prompt-modal-help-text">
                    ※ 프롬프트 해당 위치에 {"{NAME}"}, {"{NUM}"}, {"{COLOR}"}를
                    넣으시오. Generate 시 각 항목에 대응하는 Workspace 입력값으로
                    자동 치환됩니다. "TXT 첨부 방식"을 켜면 이 Prompt는 일반
                    붙여넣기 대신 ChatGPT 자체의 문서 첨부 방식으로 전달됩니다
                    (Prompt 내용은 동일하게 유지됩니다). 이때 상단에 표시되는
                    고정 지시문은 이미지 생성을 확실히 트리거하기 위해 항상
                    자동으로 함께 전송되며, 수정하거나 뺄 수 없습니다.
                </p>

                <div className="prompt-modal-actions">

                    <button

                        className="prompt-modal-save"

                        disabled={!title.trim()}

                        onClick={handleSave}

                    >

                        Save

                    </button>

                    {mode === "edit" && (

                        <button

                            className="prompt-modal-delete"

                            onClick={handleDelete}

                        >

                            Delete

                        </button>

                    )}

                    <button

                        className="prompt-modal-cancel"

                        onClick={onCancel}

                    >

                        Cancel

                    </button>

                </div>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
