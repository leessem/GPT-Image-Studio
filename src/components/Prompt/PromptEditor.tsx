// ============================================================================
// File : src/components/Prompt/PromptEditor.tsx
// ============================================================================

import { useEffect, useState } from "react";

import { PromptDraft, PromptItem } from "../../types/Prompt";

const EMPTY_DRAFT: PromptDraft = {

    title: "",

    prompt: "",

    negativePrompt: "",

};

interface PromptEditorProps {

    selectedPrompt: PromptItem | null;

    onNew: () => void;

    onCreate: (draft: PromptDraft) => void;

    onSave: (id: string, draft: PromptDraft) => void;

    onDelete: (id: string) => void;

}

export default function PromptEditor({

    selectedPrompt,

    onNew,

    onCreate,

    onSave,

    onDelete,

}: PromptEditorProps) {

    const [draft, setDraft] = useState<PromptDraft>(EMPTY_DRAFT);

    useEffect(() => {

        setDraft(

            selectedPrompt
                ? {

                      title: selectedPrompt.title,

                      prompt: selectedPrompt.prompt,

                      negativePrompt: selectedPrompt.negativePrompt,

                  }
                : EMPTY_DRAFT

        );

    }, [selectedPrompt]);

    const handleSave = () => {

        if (selectedPrompt) {
            onSave(selectedPrompt.id, draft);
        } else {
            onCreate(draft);
        }

    };

    return (

        <div className="prompt-editor">

            <div className="prompt-editor-toolbar">

                <button onClick={onNew}>

                    New Prompt

                </button>

            </div>

            <label className="prompt-editor-field">

                <span>Title</span>

                <input

                    value={draft.title}

                    onChange={e =>
                        setDraft({ ...draft, title: e.target.value })
                    }

                />

            </label>

            <label className="prompt-editor-field">

                <span>Prompt</span>

                <textarea

                    value={draft.prompt}

                    onChange={e =>
                        setDraft({ ...draft, prompt: e.target.value })
                    }

                />

            </label>

            <label className="prompt-editor-field">

                <span>Negative Prompt</span>

                <textarea

                    value={draft.negativePrompt}

                    onChange={e =>
                        setDraft({ ...draft, negativePrompt: e.target.value })
                    }

                />

            </label>

            <div className="prompt-editor-actions">

                <button onClick={handleSave}>

                    Save

                </button>

                {selectedPrompt && (

                    <button

                        className="prompt-editor-delete"

                        onClick={() => onDelete(selectedPrompt.id)}

                    >

                        Delete

                    </button>

                )}

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
