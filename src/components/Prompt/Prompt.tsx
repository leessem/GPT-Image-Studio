// ============================================================================
// File : src/components/Prompt/Prompt.tsx
//
// Job-first architecture: the Prompt Library is only a reusable template
// collection now (Create/Edit/Delete/Save templates), and it never shows
// an editor inline on the main screen - Create/Edit both happen in a
// modal (PromptModal), opened from PromptLibrary's title list.
// ============================================================================

import { useState } from "react";

import "./Prompt.css";

import { PromptDraft, PromptItem } from "../../types/Prompt";

import PromptLibrary from "./PromptLibrary";
import PromptModal from "./PromptModal";

interface PromptProps {

    prompts: PromptItem[];

    onCreatePrompt: (draft: PromptDraft) => void;

    onSavePrompt: (id: string, draft: PromptDraft) => void;

    onDeletePrompt: (id: string) => void;

}

type ModalState =
    | { mode: "create" }
    | { mode: "edit"; prompt: PromptItem }
    | null;

export default function Prompt({

    prompts,

    onCreatePrompt,

    onSavePrompt,

    onDeletePrompt,

}: PromptProps) {

    const [modalState, setModalState] = useState<ModalState>(null);

    const handleSave = (draft: PromptDraft) => {

        if (modalState?.mode === "edit") {
            onSavePrompt(modalState.prompt.id, draft);
        } else {
            onCreatePrompt(draft);
        }

        setModalState(null);

    };

    const handleDelete = () => {

        if (modalState?.mode === "edit") {
            onDeletePrompt(modalState.prompt.id);
        }

        setModalState(null);

    };

    return (

        <div className="prompt-panel">

            <PromptLibrary

                prompts={prompts}

                onSelect={item => setModalState({ mode: "edit", prompt: item })}

                onNew={() => setModalState({ mode: "create" })}

            />

            {modalState && (

                <PromptModal

                    mode={modalState.mode}

                    initial={modalState.mode === "edit" ? modalState.prompt : null}

                    onSave={handleSave}

                    onDelete={modalState.mode === "edit" ? handleDelete : undefined}

                    onCancel={() => setModalState(null)}

                />

            )}

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
