// ============================================================================
// File : src/components/Workspace/WorkspaceTabs.tsx
//
// V1.0: the top tab bar IS the Workspace list - each tab is one
// independent Workspace. There is no separate Job title anywhere; a
// tab's own name is renamed automatically the moment a Prompt is
// selected (see WorkspaceService.setWorkspacePrompt).
// ============================================================================

import "./WorkspaceTabs.css";

import { Workspace } from "../../types/Workspace";

interface WorkspaceTabsProps {

    workspaces: Workspace[];

    currentWorkspaceId: string;

    onSwitch: (id: string) => void;

    onAdd: () => void;

    onDelete: (id: string) => void;

}

export default function WorkspaceTabs({

    workspaces,

    currentWorkspaceId,

    onSwitch,

    onAdd,

    onDelete,

}: WorkspaceTabsProps) {

    return (

        <div className="workspace-tabs">

            {workspaces.map(workspace => (

                <div

                    key={workspace.id}

                    className={
                        "workspace-tab" +
                        (workspace.id === currentWorkspaceId ? " active" : "")
                    }

                    onClick={() => onSwitch(workspace.id)}

                >

                    <span>{workspace.name}</span>

                    {workspaces.length > 1 && (

                        <button

                            className="workspace-tab-delete"

                            onClick={e => {

                                e.stopPropagation();

                                onDelete(workspace.id);

                            }}

                        >

                            ✕

                        </button>

                    )}

                </div>

            ))}

            <button

                className="workspace-tab-add"

                onClick={onAdd}

            >

                +

            </button>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
