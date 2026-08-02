// ============================================================================
// File : src/components/Prompt/Prompt.tsx
//
// Job-first architecture: the Prompt Library is only a reusable template
// collection now (Create/Edit/Delete/Save templates). It no longer owns
// or displays the Job queue - that moved to JobList/JobDetail.
// ============================================================================

import "./Prompt.css";

import { PromptDraft, PromptItem } from "../../types/Prompt";

import PromptLibrary from "./PromptLibrary";
import PromptEditor from "./PromptEditor";

interface PromptProps {

    prompts: PromptItem[];

    selectedPromptId: string | null;

    selectedPrompt: PromptItem | null;

    onSelectPrompt: (id: string) => void;

    onNewPrompt: () => void;

    onCreatePrompt: (draft: PromptDraft) => void;

    onSavePrompt: (id: string, draft: PromptDraft) => void;

    onDeletePrompt: (id: string) => void;

}

export default function Prompt({

    prompts,

    selectedPromptId,

    selectedPrompt,

    onSelectPrompt,

    onNewPrompt,

    onCreatePrompt,

    onSavePrompt,

    onDeletePrompt,

}: PromptProps) {

    return (

        <div className="prompt-panel">

            <PromptLibrary

                prompts={prompts}

                selectedId={selectedPromptId}

                onSelect={onSelectPrompt}

            />

            <PromptEditor

                selectedPrompt={selectedPrompt}

                onNew={onNewPrompt}

                onCreate={onCreatePrompt}

                onSave={onSavePrompt}

                onDelete={onDeletePrompt}

            />

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
