import { useEffect, useState } from "react";

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

    // Same window.ipcRenderer.settings.getAppInfo() Settings.tsx already
    // uses for its own "Application Version" row - reused here rather
    // than adding a new IPC channel for the same value.
    const [appVersion, setAppVersion] = useState<string | null>(null);

    useEffect(() => {

        window.ipcRenderer.settings.getAppInfo().then(info => setAppVersion(info.appVersion));

    }, []);

    const handleOpenFolder = () => {

        window.ipcRenderer.settings.openDownloadFolder();

    };

    return (
        <div className="toolbar">

            <div className="toolbar-title">
                GPT Image Studio
                {appVersion && <span className="toolbar-version">v{appVersion}</span>}
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
