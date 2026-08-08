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

import PromptStore, { isValidExportPayload as isValidPromptExportPayload } from "../../store/Promptstore";
import { PromptExportItem } from "../../types/Prompt";

import WorkTypeStore, { isValidExportPayload as isValidWorkTypeExportPayload } from "../../store/WorkTypeStore";
import { WorkType, WorkTypeDraft, WorkTypeExportItem } from "../../types/WorkType";
import { initDebugLogger } from "../../utils/debugLogger";

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

    prompts: PromptExportItem[];

    workTypes: WorkTypeExportItem[] | null;

    duplicateCount: number;

}

/**
 * Unified Backup / Restore file shape (v1.2.0+): Prompt Library + Work
 * Type List together, tagged with the app version that produced it.
 * A pre-1.2.0 backup file is a bare PromptExportItem[] with no
 * envelope at all - isUnifiedBackupPayload only matches the new
 * shape, so an old file always falls through to
 * isValidPromptExportPayload in handleRestore below (backward
 * compatibility: missing `version` or `workTypes` means "assume an
 * old backup format, restore the Prompt Library only").
 */
interface UnifiedBackupPayload {

    version: string;

    prompts: PromptExportItem[];

    workTypes: WorkTypeExportItem[];

}

function isUnifiedBackupPayload(value: unknown): value is UnifiedBackupPayload {

    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    )
        return false;

    const payload = value as Record<string, unknown>;

    return (
        typeof payload.version === "string" &&
        isValidPromptExportPayload(payload.prompts) &&
        isValidWorkTypeExportPayload(payload.workTypes)
    );

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

    const [confirmingReset, setConfirmingReset] = useState(false);

    const [workTypes, setWorkTypes] = useState<WorkType[]>(
        () => WorkTypeStore.getAll()
    );

    const [workTypeForm, setWorkTypeForm] = useState<WorkTypeFormState | null>(null);

    const [debugMode, setDebugModeState] = useState(false);

    const [debugLogsPath, setDebugLogsPath] = useState<string | null>(null);

    useEffect(() => {

        window.ipcRenderer.settings.getDownloadFolder().then(setDownloadFolder);

        window.ipcRenderer.settings.getFilenamePrefix().then(setFilenamePrefix);

        window.ipcRenderer.settings.getAppInfo().then(setAppInfo);

        window.ipcRenderer.settings.getDebugMode().then(setDebugModeState);

        window.ipcRenderer.settings.getDebugLogsPath().then(setDebugLogsPath);

    }, []);

    // Persists immediately and re-initializes debugLogger.ts's cached
    // flag in the SAME tick, so toggling takes effect right away without
    // needing Workspace.tsx to re-fetch or the app to restart.
    const handleDebugModeChange = (value: boolean) => {

        setDebugModeState(value);

        window.ipcRenderer.settings.setDebugMode(value);

        initDebugLogger(value);

    };

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

    const handleBackup = async () => {

        const payload: UnifiedBackupPayload = {

            version: appInfo?.appVersion ?? "1.2.0",

            prompts: PromptStore.exportPayload(),

            workTypes: WorkTypeStore.exportPayload(),

        };

        const json = JSON.stringify(payload, null, 2);

        const result = await window.ipcRenderer.backup.export(json);

        if (result.success) {

            setStatusMessage(`Backed up to ${result.filePath}`);

        }
        else if (!result.canceled) {

            setStatusMessage("Backup failed.");

        }

    };

    const handleRestore = async () => {

        const result = await window.ipcRenderer.backup.import();

        if (!result.success) {

            if (!result.canceled)
                setStatusMessage(result.error ?? "Restore failed.");

            return;

        }

        let incomingPrompts: PromptExportItem[];

        let incomingWorkTypes: WorkTypeExportItem[] | null;

        if (isUnifiedBackupPayload(result.data)) {

            incomingPrompts = result.data.prompts;

            incomingWorkTypes = result.data.workTypes;

        }
        else if (isValidPromptExportPayload(result.data)) {

            // Pre-1.2.0 backup file: a bare Prompt Library array, no
            // `version`/`workTypes` envelope. Restore the Prompt
            // Library exactly as before - Work Type List untouched.
            incomingPrompts = result.data;

            incomingWorkTypes = null;

        }
        else {

            setStatusMessage("That file isn't a valid backup.");

            return;

        }

        const existingPromptTitles = new Set(
            PromptStore.getAll().map(item => item.title)
        );

        const promptDuplicateCount = incomingPrompts.filter(
            item => existingPromptTitles.has(item.title)
        ).length;

        const existingWorkTypeNames = new Set(
            WorkTypeStore.getAll().map(item => item.displayName)
        );

        const workTypeDuplicateCount = incomingWorkTypes
            ? incomingWorkTypes.filter(item => existingWorkTypeNames.has(item.displayName)).length
            : 0;

        const duplicateCount = promptDuplicateCount + workTypeDuplicateCount;

        if (duplicateCount === 0) {

            PromptStore.importPayload(incomingPrompts, "keep");

            onPromptLibraryChanged();

            if (incomingWorkTypes) {

                WorkTypeStore.importPayload(incomingWorkTypes, "keep");

                refreshWorkTypes();

            }

            const workTypeNote = incomingWorkTypes ? ` and ${incomingWorkTypes.length} work type(s)` : "";

            setStatusMessage(`Restored ${incomingPrompts.length} prompt(s)${workTypeNote}.`);

            return;

        }

        setPendingImport({ prompts: incomingPrompts, workTypes: incomingWorkTypes, duplicateCount });

    };

    const resolveImport = (strategy: DuplicateStrategy) => {

        if (!pendingImport)
            return;

        PromptStore.importPayload(pendingImport.prompts, strategy);

        onPromptLibraryChanged();

        if (pendingImport.workTypes) {

            WorkTypeStore.importPayload(pendingImport.workTypes, strategy);

            refreshWorkTypes();

        }

        const workTypeNote = pendingImport.workTypes ? ` and ${pendingImport.workTypes.length} work type(s)` : "";

        setStatusMessage(`Restored ${pendingImport.prompts.length} prompt(s)${workTypeNote}.`);

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

    // ========================================================================
    // Maintenance
    //
    // Reset Application Data only ever touches the Prompt Library and
    // Work Type list - never the Download Folder, filename Prefix, or
    // any other Setting - so it can't silently undo anything else the
    // user configured.
    // ========================================================================

    const handleResetApplicationData = () => {

        PromptStore.clear();

        WorkTypeStore.clear();

        onPromptLibraryChanged();

        refreshWorkTypes();

        setConfirmingReset(false);

        setStatusMessage("Application data has been reset.");

    };

    return (

        <div className="settings-overlay" onClick={onClose}>

            <div
                className="settings-modal"
                onClick={e => e.stopPropagation()}
            >

                <div className="settings-title">Settings</div>

                {confirmingReset ? (

                    <div className="settings-section">

                        <div className="settings-section-title">
                            Reset Application Data
                        </div>

                        <p className="settings-note">
                            This will remove all saved Prompt Library items
                            and all Work Types. Application settings and
                            download folder will remain unchanged.
                        </p>

                        <div className="settings-button-row">

                            <button onClick={() => setConfirmingReset(false)}>
                                Cancel
                            </button>

                            <button
                                className="settings-reset-confirm"
                                onClick={handleResetApplicationData}
                            >
                                Reset
                            </button>

                        </div>

                    </div>

                ) : pendingImport ? (

                    <div className="settings-section">

                        <div className="settings-section-title">
                            Duplicate Items Found
                        </div>

                        <p className="settings-note">
                            {pendingImport.duplicateCount} of{" "}
                            {pendingImport.prompts.length + (pendingImport.workTypes?.length ?? 0)}{" "}
                            item(s) in this file (Prompt Library and/or Work
                            Type List) share a name with one already saved.
                            Choose how to handle them:
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
                            2. Backup / Restore (Prompt Library + Work
                            Type List, unified into one file)
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Backup / Restore
                            </div>

                            <p className="settings-note">
                                Backs up your Prompt Library and Work Type
                                List together into one file. Restoring an
                                older Prompt-Library-only backup still works.
                            </p>

                            <div className="settings-button-row">

                                <button onClick={handleBackup}>
                                    Backup
                                </button>

                                <button onClick={handleRestore}>
                                    Restore
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
                            Debug Mode (Version 1.2.3 Debug Build) - off by
                            default, does not affect production behavior at
                            all when unchecked (see debugLogger.ts / main.ts).
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Debug Mode
                            </div>

                            <label className="settings-worktype-row">

                                <input

                                    type="checkbox"

                                    checked={debugMode}

                                    onChange={e => handleDebugModeChange(e.target.checked)}

                                />

                                <span>
                                    Record a detailed diagnostic log of every Generate run
                                </span>

                            </label>

                            <p className="settings-note">
                                When on, a new timestamped folder is saved
                                under Debug Logs for every Generate attempt
                                (pipeline timing, the exact Prompt sent, DOM
                                activity, and - on failure - a full snapshot).
                                No effect on Generate itself either way.
                            </p>

                            <div className="settings-readonly-row">
                                <span>Debug Logs</span>
                                <code>{debugLogsPath ?? "—"}</code>
                            </div>

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

                        {/* -------------------------------------------------
                            6. Maintenance
                        -------------------------------------------------- */}

                        <div className="settings-section">

                            <div className="settings-section-title">
                                Maintenance
                            </div>

                            <div className="settings-button-row">

                                <button onClick={() => setConfirmingReset(true)}>
                                    Reset Application Data
                                </button>

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
                    7. Credits & Copyright
                    ------------------------------------------------------ */}

                <div className="settings-credits">

                    <div>GPT Image Studio</div>

                    <div>Version {appInfo?.appVersion ?? "1.0.0"}</div>

                    <div>Created by</div>

                    <div>leessem</div>

                    <div>© 2026 leessem</div>

                    <div className="settings-credits-divider" />

                    <div className="settings-credits-legal">

                        <p>본 프로그램은 개인용 비상업적 목적으로 제작되었습니다.</p>

                        <p>
                            제작자의 사전 허가 없이 본 프로그램의 무단 복제,
                            무단 배포 및 무단 판매를 금합니다.
                        </p>

                        <p>All Rights Reserved.</p>

                    </div>

                </div>

            </div>

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
