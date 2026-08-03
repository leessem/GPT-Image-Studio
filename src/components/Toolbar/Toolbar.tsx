import { useState } from "react";

import "./Toolbar.css";

import Settings from "../Settings/Settings";

interface ToolbarProps {

    onPromptLibraryChanged: () => void;

    onWorkTypesChanged: () => void;

}

export default function Toolbar({

    onPromptLibraryChanged,

    onWorkTypesChanged,

}: ToolbarProps) {

    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleOpenFolder = () => {

        window.ipcRenderer.settings.openDownloadFolder();

    };

    return (
        <div className="toolbar">

            <div className="toolbar-title">
                GPT Image Studio
            </div>

            <div className="toolbar-buttons">

                <button onClick={handleOpenFolder}>📂 Open Folder</button>

                <button onClick={() => setSettingsOpen(true)}>⚙ Settings</button>

            </div>

            {settingsOpen && (

                <Settings
                    onClose={() => setSettingsOpen(false)}
                    onPromptLibraryChanged={onPromptLibraryChanged}
                    onWorkTypesChanged={onWorkTypesChanged}
                />

            )}

        </div>
    );
}
