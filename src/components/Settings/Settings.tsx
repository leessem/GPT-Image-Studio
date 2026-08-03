// ============================================================================
// File : src/components/Settings/Settings.tsx
//
// V1.0 Settings: a workspace configuration window for a production
// image-generation tool, not a general preferences panel - every
// section here directly serves the workflow (where images save to,
// backing up/restoring the Prompt Library, per-job Work Type presets,
// the filename rule, and read-only build info/credits). Nothing else
// belongs here - no theme/language/notification/cache preferences.
// ============================================================================

import { useEffect, useState } from "react";

import "./Settings.css";

import PromptStore, { isValidExportPayload } from "../../store/Promptstore";
import { PromptExportItem } from "../../types/Prompt";

import WorkTypeStore from "../../store/WorkTypeStore";
import { WorkType, WorkTypeDraft } from "../../types/WorkType";

interface SettingsProps {

    onClose: () => void;

    onPromptLibraryChanged: () => void;

    onWorkTypesChanged: () => void;

}

interface AppInfo {

    appVersion: string;

    electronVersion: string;

    nodeVersion: string;

    gitCommit: string | null;

}

const DEFAULT_FILENAME_PREFIX = "★";

/**
 * Preview-only mirror of main.ts's sanitizeFilenamePart() - shows what
 * the saved filename will actually look like as the user types, even
 * though the raw (unsanitized) Prefix is what gets persisted; the real
 * sanitization that decides the file on disk happens once, in main.ts,
 * at save time.
 */
function sanitizeForPreview(value: string): string {

    return value.replace(/[\\/:*?"<>|]/g, "_").trim();

}

type DuplicateStrategy = "replace" | "keep" | "rename";

interface PendingImport {

    items: PromptExportItem[];

    duplicateCount: number;

}

type WorkTypeFormState =
    | { mode: "create"; displayName: string; filenamePrefix: string }
    | { mode: "edit"; id: string; displayName: string; filenamePrefix: string };

export default function Settings({

    onClose,

    onPromptLibraryChanged,

    onWorkTypesChanged,

}: SettingsProps) {

    const [downloadFolder, setDownloadFolder] = useState<string | null>(null);

    const [filenamePrefix, setFilenamePrefix] = useState("");

    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

    const [workTypes, setWorkTypes] = useState<WorkType[]>(
        () => WorkTypeStore.getAll()
    );

    const [workTypeForm, setWorkTypeForm] = useState<WorkTypeFormState | null>(null);

    useEffect(() => {

        window.ipcRenderer.settings.getDownloadFolder().then(setDownloadFolder);

        window.ipcRenderer.settings.getFilenamePrefix().then(setFilenamePrefix);

        window.ipcRenderer.settings.getAppInfo().then(setAppInfo);

    }, []);

    const handlePrefixChange = (value: string) => {

        setFilenamePrefix(value);

        window.ipcRenderer.settings.setFilenamePrefix(value);

    };

    const handleBrowse = async () => {

        const result = await window.ipcRenderer.settings.browseDownloadFolder();

        if (result.success) {

            setDownloadFolder(result.folder);

            setStatusMessage("Download folder updated.");

        }

    };

    const handleBackupPrompts = async () => {

        const json = JSON.stringify(PromptStore.exportPayload(), null, 2);

        const result = await window.ipcRenderer.promptLibrary.export(json);

        if (result.success) {

            setStatusMessage(`Backed up to ${result.filePath}`);

        }
        else if (!result.canceled) {

            setStatusMessage("Backup failed.");

        }

    };

    const handleRestorePrompts = async () => {

        const result = await window.ipcRenderer.promptLibrary.import();

        if (!result.success) {

            if (!result.canceled)
                setStatusMessage(result.error ?? "Restore failed.");

            return;

        }

        if (!isValidExportPayload(result.data)) {

            setStatusMessage("That file isn't a valid Prompt Library backup.");

            return;

        }

        const existingTitles = new Set(
            PromptStore.getAll().map(item => item.title)
        );

        const duplicateCount = result.data.filter(
            item => existingTitles.has(item.title)
        ).length;

        if (duplicateCount === 0) {

            PromptStore.importPayload(result.data, "keep");

            onPromptLibraryChanged();

            setStatusMessage(`Restored ${result.data.length} prompt(s).`);

            return;

        }

        setPendingImport({ items: result.data, duplicateCount });

    };

    const resolveImport = (strategy: DuplicateStrategy) => {

        if (!pendingImport)
            return;

        PromptStore.importPayload(pendingImport.items, strategy);

        onPromptLibraryChanged();

        setStatusMessage(`Restored ${pendingImport.items.length} prompt(s).`);

        setPendingImport(null);

    };

    // ========================================================================
    // Work Type Management
    // ========================================================================

    const refreshWorkTypes = () => {

        setWorkTypes(WorkTypeStore.getAll());

        onWorkTypesChanged();

    };

    const handleAddWorkType = () => {

        setWorkTypeForm({ mode: "create", displayName: "", filenamePrefix: "" });

    };

    const handleEditWorkType = (workType: WorkType) => {

        setWorkTypeForm({
            mode: "edit",
            id: workType.id,
            displayName: workType.displayName,
            filenamePrefix: workType.filenamePrefix,
        });

    };

    const handleSaveWorkType = () => {

        if (!workTypeForm)
            return;

        const draft: WorkTypeDraft = {

            displayName: workTypeForm.displayName.trim(),

            filenamePrefix: workTypeForm.filenamePrefix.trim(),

        };

        if (!draft.displayName)
            return;

        if (workTypeForm.mode === "create") {
            WorkTypeStore.create(draft);
        }
        else {
            WorkTypeStore.update(workTypeForm.id, draft);
        }

        refreshWorkTypes();

        setWorkTypeForm(null);

    };

    const handleDeleteWorkType = (id: string) => {

        if (!window.confirm("Delete this Work Type? This cannot be undone."))
            return;

        WorkTypeStore.remove(id);

        refreshWorkTypes();

    };

    const handleToggleWorkType = (id: string, enabled: boolean) => {

        WorkTypeStore.setEnabled(id, enabled);

        refreshWorkTypes();

    };

    const handleMoveWorkType = (id: string, direction: "up" | "down") => {

        if (direction === "up") {
            WorkTypeStore.moveUp(id);
        }
        else {
            WorkTypeStore.moveDown(id);
        }

        refreshWorkTypes();

    };

    return (

        <div className="settings-overlay" onClick={onClose}>

            <div
                className="settings-modal"
                onClick={e => e.stopPropagation()}
            >

                <div className="settings-title">Settings</div>

                {pendingImport ? (

                    <div className="settings-section">

                        <div className="settings-section-title">
                            Duplicate Prompts Found
                        </div>

                        <p className="settings-note">
                            {pendingImport.duplicateCount} of{" "}
                            {pendingImport.items.length} prompt(s) in this
                            file share a title with a prompt already in your
                            library. Choose how to handle them:
                        </p>

                        <div className="settings-import-choices">

                            <button onClick={() => resolveImport("replace")}>
                                Replace Existing
                            </button>

                            <button onClick={() => resolveImport("keep")}>
                                Keep Existing
                            </button>

                            <button onClick={() => resolveImport("rename")}>
                                Rename Imported
                            </button>

                        </div>

                        <button
                            className="settings-cancel-import"
                            onClick={() => setPendingImport(null)}
                        >
                            Cancel Restore
                        </button>

                    </div>

                ) : (

                    <>

                        {/* -------------------------------------------------
                            1. Download
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Download
                            </div>

                            <div className="settings-field-label">
                                Current Download Folder
                            </div>

                            <div className="settings-path-box">
                                {downloadFolder ?? "Loading..."}
                            </div>

                            <div className="settings-button-row">

                                <button onClick={handleBrowse}>
                                    Browse...
                                </button>

                            </div>

                        </div>

                        {/* -------------------------------------------------
                            2. Prompt Library
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Prompt Library
                            </div>

                            <div className="settings-button-row">

                                <button onClick={handleBackupPrompts}>
                                    Backup Prompts
                                </button>

                                <button onClick={handleRestorePrompts}>
                                    Restore Prompts
                                </button>

                            </div>

                        </div>

                        {/* -------------------------------------------------
                            3. Work Type Management
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Work Type Management
                            </div>

                            {workTypes.length > 0 && (

                                <div className="settings-worktype-list">

                                    {workTypes.map((workType, index) => (

                                        <div key={workType.id} className="settings-worktype-row">

                                            <div className="settings-worktype-reorder">

                                                <button

                                                    disabled={index === 0}

                                                    onClick={() => handleMoveWorkType(workType.id, "up")}

                                                    title="Move up"

                                                >
                                                    ↑
                                                </button>

                                                <button

                                                    disabled={index === workTypes.length - 1}

                                                    onClick={() => handleMoveWorkType(workType.id, "down")}

                                                    title="Move down"

                                                >
                                                    ↓
                                                </button>

                                            </div>

                                            <input

                                                type="checkbox"

                                                checked={workType.enabled}

                                                onChange={e => handleToggleWorkType(workType.id, e.target.checked)}

                                                title={workType.enabled ? "Enabled" : "Disabled"}

                                            />

                                            <div className="settings-worktype-info">

                                                <span className="settings-worktype-name">
                                                    {workType.displayName}
                                                </span>

                                                <span className="settings-worktype-prefix">
                                                    {workType.filenamePrefix}
                                                </span>

                                            </div>

                                            <div className="settings-worktype-actions">

                                                <button onClick={() => handleEditWorkType(workType)}>
                                                    Edit
                                                </button>

                                                <button onClick={() => handleDeleteWorkType(workType.id)}>
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                            {workTypeForm ? (

                                <div className="settings-worktype-form">

                                    <input

                                        placeholder="Display Name (예: 만삭)"

                                        value={workTypeForm.displayName}

                                        onChange={e => setWorkTypeForm({ ...workTypeForm, displayName: e.target.value })}

                                        autoFocus

                                    />

                                    <input

                                        placeholder="Filename Prefix (예: 만삭_)"

                                        value={workTypeForm.filenamePrefix}

                                        onChange={e => setWorkTypeForm({ ...workTypeForm, filenamePrefix: e.target.value })}

                                    />

                                    <div className="settings-button-row">

                                        <button

                                            disabled={!workTypeForm.displayName.trim()}

                                            onClick={handleSaveWorkType}

                                        >
                                            Save
                                        </button>

                                        <button onClick={() => setWorkTypeForm(null)}>
                                            Cancel
                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <div className="settings-button-row">

                                    <button onClick={handleAddWorkType}>
                                        + Add Work Type
                                    </button>

                                </div>

                            )}

                        </div>

                        {/* -------------------------------------------------
                            4. Filename - only the Prefix is configurable;
                            the Prompt Title is always appended
                            automatically and is never editable here.
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Filename
                            </div>

                            <div className="settings-field-label">
                                Prefix
                            </div>

                            <div className="settings-button-row">

                                <input
                                    className="settings-prefix-input"
                                    value={filenamePrefix}
                                    onChange={e => handlePrefixChange(e.target.value)}
                                />

                                <button onClick={() => handlePrefixChange(DEFAULT_FILENAME_PREFIX)}>
                                    Reset
                                </button>

                            </div>

                            <div className="settings-readonly-row">
                                <span>Preview</span>
                                <code>
                                    {sanitizeForPreview(filenamePrefix)}Portrait.png
                                </code>
                            </div>

                            <p className="settings-note">
                                The selected Work Type is automatically
                                inserted after the filename prefix - e.g.{" "}
                                {sanitizeForPreview(filenamePrefix)}만삭Portrait.png.
                                If that name already exists, a number is
                                added automatically:{" "}
                                {sanitizeForPreview(filenamePrefix)}만삭Portrait2.png,{" "}
                                {sanitizeForPreview(filenamePrefix)}만삭Portrait3.png.
                            </p>

                        </div>

                        {/* -------------------------------------------------
                            5. Application Information (read-only)
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Application Information
                            </div>

                            <div className="settings-readonly-row">
                                <span>Application</span>
                                <code>GPT Image Studio</code>
                            </div>

                            <div className="settings-readonly-row">
                                <span>Application Version</span>
                                <code>{appInfo?.appVersion ?? "—"}</code>
                            </div>

                            <div className="settings-readonly-row">
                                <span>Electron Version</span>
                                <code>{appInfo?.electronVersion ?? "—"}</code>
                            </div>

                            <div className="settings-readonly-row">
                                <span>Node Version</span>
                                <code>{appInfo?.nodeVersion ?? "—"}</code>
                            </div>

                            <div className="settings-readonly-row">
                                <span>Git Commit</span>
                                <code>{appInfo?.gitCommit ?? "—"}</code>
                            </div>

                        </div>

                    </>

                )}

                {statusMessage && (

                    <div className="settings-status">
                        {statusMessage}
                    </div>

                )}

                <div className="settings-actions">

                    <button className="settings-close" onClick={onClose}>
                        Close
                    </button>

                </div>

                {/* -----------------------------------------------------
                    6. Credits
                    ------------------------------------------------------ */}

                <div className="settings-credits">

                    <div>GPT Image Studio</div>

                    <div>Version {appInfo?.appVersion ?? "1.0.0"}</div>

                    <div>Created by</div>

                    <div>leessem</div>

                </div>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
