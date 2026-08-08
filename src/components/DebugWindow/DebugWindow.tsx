// ============================================================================
// File : src/components/DebugWindow/DebugWindow.tsx
//
// Version 1.2.3 Debug Build: a small floating panel showing the live
// state of whatever Generate run is in progress - Current Stage,
// Current Workspace, Selected Prompt, Elapsed Time, and Last Error -
// plus an "Export Diagnostics" button that zips the most recent
// session folder. Subscribes to debugLogger.ts's own pub-sub state
// (subscribeDebugPanel) - it never touches generate.ts/Workspace.tsx
// directly, and logPipelineStage already updates that state as a side
// effect of normal pipeline logging, so this component adds no new
// calls into the Generate pipeline itself.
//
// Only ever mounted when Debug Mode is on (see Workspace.tsx) - this
// file has no effect on production behavior by simply existing.
// ============================================================================

import { useEffect, useState } from "react";

import "./DebugWindow.css";

import {
    subscribeDebugPanel,
    exportDiagnostics,
    type DebugPanelState,
} from "../../utils/debugLogger";

function formatElapsed(startedAt: number | null): string {

    if (!startedAt)
        return "—";

    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${String(s).padStart(2, "0")}`;

}

export default function DebugWindow() {

    const [state, setState] = useState<DebugPanelState | null>(null);

    const [, forceTick] = useState(0);

    const [exportStatus, setExportStatus] = useState<string | null>(null);

    useEffect(() => {

        return subscribeDebugPanel(setState);

    }, []);

    // Re-renders once a second purely to keep Elapsed Time moving while
    // a run is in progress - never touches pipeline state itself.
    useEffect(() => {

        const interval = setInterval(() => forceTick(t => t + 1), 1000);

        return () => clearInterval(interval);

    }, []);

    const handleExport = async () => {

        if (!state?.sessionId) {
            setExportStatus("No debug session yet - run Generate at least once first.");
            return;
        }

        setExportStatus("Exporting...");

        const result = await exportDiagnostics(state.sessionId);

        if (result.success) {
            setExportStatus(`Saved: ${result.filePath}`);
        }
        else if (!result.canceled) {
            setExportStatus(
                [
                    "Export failed:",
                    result.error ?? "unknown error",
                    "",
                    "Error code:",
                    result.code ?? "(none)",
                    "",
                    "Path:",
                    result.path ?? "(none)",
                    "",
                    "Stack:",
                    result.stack ?? "(none)",
                ].join("\n")
            );
        }
        else {
            setExportStatus(null);
        }

    };

    if (!state)
        return null;

    return (

        <div className="debug-window">

            <div className="debug-window-title">
                Debug
            </div>

            <div className="debug-window-row">
                <span>Stage</span>
                <code>{state.stage ?? "—"}</code>
            </div>

            <div className="debug-window-row">
                <span>Workspace</span>
                <code>{state.workspaceName ?? "—"}</code>
            </div>

            <div className="debug-window-row">
                <span>Prompt</span>
                <code>{state.promptName ?? "—"}</code>
            </div>

            <div className="debug-window-row">
                <span>Elapsed</span>
                <code>{formatElapsed(state.startedAt)}</code>
            </div>

            <div className="debug-window-row debug-window-error-row">
                <span>Last Error</span>
                <code>{state.lastError ?? "—"}</code>
            </div>

            <button className="debug-window-export" onClick={handleExport}>
                Export Diagnostics
            </button>

            {exportStatus && (

                <div className="debug-window-status">
                    {exportStatus}
                </div>

            )}

        </div>

    );

}

// ============================================================================
// End of File
// ============================================================================
