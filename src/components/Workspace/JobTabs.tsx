// ============================================================================
// File : src/components/Workspace/JobTabs.tsx
// ============================================================================

import "./JobTabs.css";

import { Project } from "../../types/Project";

interface JobTabsProps {

    project: Project;

    onSwitch: (id: string) => void;

    onAdd: () => void;

    onDelete: (id: string) => void;

}

export default function JobTabs({

    project,

    onSwitch,

    onAdd,

    onDelete,

}: JobTabsProps) {

    return (

        <div className="job-tabs">

            {project.tabs.map(tab => (

                <div

                    key={tab.id}

                    className={`job ${tab.id === project.currentTabId ? "active" : ""}`}

                    onClick={() => onSwitch(tab.id)}

                >

                    <span>{tab.name}</span>

                    {project.tabs.length > 1 && (

                        <button

                            className="job-delete"

                            onClick={e => {

                                e.stopPropagation();

                                onDelete(tab.id);

                            }}

                        >

                            ✕

                        </button>

                    )}

                </div>

            ))}

            <button

                className="job-add"

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
