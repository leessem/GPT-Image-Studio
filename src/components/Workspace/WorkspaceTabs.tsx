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

// Gray = Idle (never generated yet), Blue = Generating, Green =
// Completed/Ready (including the resting state after a prior successful
// generation - see generate.ts's return-to-waiting reset), Red = Error.
// `status` alone can't tell "never generated" and "ready again after a
// success" apart (both sit at "waiting"), so idle vs. ready is
// distinguished by whether completedAt has ever been set.
function statusDotClass(workspace: Workspace): string {

    if (workspace.status === "running")
        return "running";

    if (workspace.status === "error")
        return "error";

    if (workspace.status === "done")
        return "ready";

    return workspace.completedAt ? "ready" : "idle";

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

                    <span className={`workspace-tab-status ${statusDotClass(workspace)}`} />

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
