// ============================================================================
// File : src/components/Prompt/PromptLibrary.tsx
//
// Lightweight template manager: titles only, nothing else. Clicking a
// title opens it in the edit modal (Prompt.tsx owns that state) - this
// component never renders prompt content itself. Shown to the user as
// "Prompt Settings" (v1.5.1 rename). Each row has a ☆/★ Favorites
// toggle (v1.5.1) - starred prompts are listed first in the Workspace
// panel's Prompt dropdown.
// ============================================================================

import { PromptItem } from "../../types/Prompt";

interface PromptLibraryProps {

    prompts: PromptItem[];

    onSelect: (item: PromptItem) => void;

    onNew: () => void;

    onToggleFavorite: (id: string, favorite: boolean) => void;

}

export default function PromptLibrary({

    prompts,

    onSelect,

    onNew,

    onToggleFavorite,

}: PromptLibraryProps) {

    return (

        <div className="prompt-library">

            <div className="prompt-library-header">

                Prompt Settings

            </div>

            <div className="prompt-library-list">

                {prompts.map(item => (

                    <div

                        key={item.id}

                        className="prompt-library-item"

                        onClick={() => onSelect(item)}

                    >

                        <button

                            className={
                                "prompt-library-favorite" +
                                (item.favorite ? " active" : "")
                            }

                            title={item.favorite ? "즐겨찾기 해제" : "즐겨찾기 (드롭다운 상단에 표시)"}

                            onClick={e => {

                                e.stopPropagation();

                                onToggleFavorite(item.id, !item.favorite);

                            }}

                        >

                            {item.favorite ? "★" : "☆"}

                        </button>

                        <span className="prompt-library-item-title">

                            {item.title}

                        </span>

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
