// ============================================================================
// File : src/components/Prompt/PromptLibrary.tsx
// ============================================================================

import { PromptItem } from "../../types/Prompt";

interface PromptLibraryProps {

    prompts: PromptItem[];

    selectedId: string | null;

    onSelect: (id: string) => void;

}

export default function PromptLibrary({

    prompts,

    selectedId,

    onSelect,

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

                        className={
                            "prompt-library-item" +
                            (item.id === selectedId ? " selected" : "")
                        }

                        onClick={() => onSelect(item.id)}

                    >

                        {item.title}

                    </div>

                ))}

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
