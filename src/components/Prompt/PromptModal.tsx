// ============================================================================
// File : src/components/Prompt/PromptModal.tsx
//
// One modal used for both Create ("New Prompt") and Edit ("Edit Prompt") -
// mode is decided by the caller (Prompt.tsx) based on which action opened
// it. Delete only appears in edit mode and asks for confirmation first.
// ============================================================================

import { useEffect, useState } from "react";

import { PromptDraft, PromptItem } from "../../types/Prompt";

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

    const handleSave = () => {

        onSave({

            title: title.trim(),

            prompt,

            negativePrompt,

            requiresName,

            requiresNumber,

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

                <p className="prompt-modal-help-text">
                    ※ 프롬프트에서 {"{NAME}"} 또는 {"{NUM}"} 키워드를 입력하면
                    자동으로 치환됩니다.
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
