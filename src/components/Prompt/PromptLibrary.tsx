// ============================================================================
// File : src/components/Prompt/PromptLibrary.tsx
//
// Lightweight template manager: titles only, nothing else. Clicking a
// title opens it in the edit modal (Prompt.tsx owns that state) - this
// component never renders prompt content itself.
// ============================================================================

import { PromptItem } from "../../types/Prompt";

interface PromptLibraryProps {

    prompts: PromptItem[];

    onSelect: (item: PromptItem) => void;

    onNew: () => void;

}

export default function PromptLibrary({

    prompts,

    onSelect,

    onNew,

}: PromptLibraryProps) {

    return (

        <div className="prompt-library">

            <div className="prompt-library-header">

                Prompt Library

            </div>

            <div className="prompt-library-list">

                {prompts.map(item => (

                    <div

                        key={item.id}

                        className="prompt-library-item"

                        onClick={() => onSelect(item)}

                    >

                        {item.title}

                    </div>

                ))}

            </div>

            <div className="prompt-library-footer">

                <button onClick={onNew}>

                    + New Prompt

                </button>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
