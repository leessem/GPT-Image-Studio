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

    /** Closes every open Workspace tab at once, replacing them with a
     *  single fresh one. */
    onClearAll: () => void;

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

    onClearAll,

}: WorkspaceTabsProps) {

    // "탭 클리어" - blocked while any Workspace is mid-generation/
    // revision so one click can never silently discard an in-flight
    // run (individual ✕ close has no such guard, but discarding every
    // tab at once is a bigger blast radius than closing one).
    const anyBusy = workspaces.some(
        w => w.status === "running" || w.status === "revising"
    );

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

            {workspaces.length > 1 && (

                <button

                    className="workspace-tabs-clear-all"

                    disabled={anyBusy}

                    title={anyBusy ? "생성/수정 중인 탭이 있어 비활성화됨" : "열려 있는 탭을 모두 닫습니다"}

                    onClick={onClearAll}

                >

                    탭 전체 닫기

                </button>

            )}

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
