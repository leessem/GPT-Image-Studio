// ============================================================================
// File : src/components/Prompt/PromptModal.tsx
//
// One modal used for both Create ("New Prompt") and Edit ("Edit Prompt") -
// mode is decided by the caller (Prompt.tsx) based on which action opened
// it. Delete only appears in edit mode and asks for confirmation first.
// ============================================================================

import { useState } from "react";

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

    const handleSave = () => {

        onSave({

            title: title.trim(),

            prompt,

            negativePrompt,

            requiresName,

        });

    };

    const handleDelete = () => {

        if (window.confirm("Delete this prompt? This cannot be undone.")) {
            onDelete?.();
        }

    };

    return (

        <div className="prompt-modal-overlay" onClick={onCancel}>

            <div
                className="prompt-modal"
                onClick={e => e.stopPropagation()}
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
