// ============================================================================
// File : src/utils/workspaceLogger.ts
//
// TEMPORARY diagnostic instrumentation for the V1.1.1 Workspace-isolation
// audit (release blocked - see WORKLOG). Every cross-cutting Workspace
// event (Generate/Upload/Download/Save/Error) is logged through
// logWorkspaceEvent with a consistent, greppable shape - [WS-AUDIT]
// timestamp, workspaceId, event name, and any extra fields (webContentsId,
// conversationUrl, reason, ...) - so a live repro's DevTools console
// output can be read back as an exact per-Workspace event timeline.
//
// describeWorkspace/diffWorkspaceSnapshots are the state-diff half of
// that: a full BEFORE/AFTER snapshot of every field the audit's
// "Workspace isolation" checklist calls out (status, conversationUrl,
// derived Generate/Upload/Error/Save state), plus a field-level diff so
// a setWorkspaces call's exact effect - and which fields it changed -
// is provable from the log, not inferred.
//
// Remove this whole file (and its call sites) once the isolation bug is
// found and verified fixed.
// ============================================================================

import { Workspace } from "../types/Workspace";

// Vite replaces `import.meta.env.DEV` with a literal `false` in a
// production build (`npm run build`), so by default every WS-AUDIT
// call below is dead code under that branch and gets stripped by
// Rollup's minifier - not just quiet in prod, the console.* calls
// themselves are absent from the packaged app entirely.
//
// `window.__WS_AUDIT_FORCE__` (set by preload.ts from the
// WS_AUDIT_FORCE env var) is the escape hatch for force-enabling this
// in an already-packaged build without a dev rebuild - see preload.ts
// for why the renderer needs main-process help to see this at all.
// Default (env var unset) behavior is unchanged: dev-only.
const DIAGNOSTICS_ENABLED = import.meta.env.DEV || window.__WS_AUDIT_FORCE__ === true;

/**
 * Single emission point for every WS-AUDIT log line: prints to the
 * DevTools console (as before) AND forwards the same line to the main
 * process over IPC, which appends it into the SAME logs/ws-audit.log
 * file main-process events write to (see electron/main.ts's
 * "ws-audit:log" handler) - so renderer + main events interleave into
 * one chronological timeline, and capturing them never depends on
 * DevTools being open or even launched.
 */
function emit(line: string, details: unknown, isError: boolean): void {

    if (!DIAGNOSTICS_ENABLED)
        return;

    if (isError) {
        console.error(line, details);
    }
    else {
        console.log(line, details);
    }

    try {
        window.ipcRenderer.send("ws-audit:log", `${line} ${JSON.stringify(details)}`);
    }
    catch {
        // best-effort - never let diagnostic logging crash the renderer
    }

}

export function logWorkspaceEvent(

    workspaceId: string,

    event: string,

    details?: Record<string, unknown>

): void {

    emit(
        `[WS-AUDIT] ${new Date().toISOString()} | workspace=${workspaceId} | event=${event}`,
        details ?? {},
        false
    );

}

/**
 * Equivalent of setWorkspacesLogged's per-call state-diff log
 * (Workspace.tsx) - kept here so the DIAGNOSTICS_ENABLED gate lives in
 * exactly one place.
 */
export function logWorkspaceStateDiff(

    origin: string,

    kind: "functional" | "REPLACE",

    payload: { before: WorkspaceDiagSnapshot[]; after: WorkspaceDiagSnapshot[]; diffs: WorkspaceDiagDiff[] }

): void {

    emit(
        `[WS-AUDIT][setWorkspaces] ${new Date().toISOString()} | origin=${origin} | kind=${kind}`,
        payload,
        false
    );

}

/**
 * Equivalent of setWorkspacesLogged's clobber-detection log
 * (Workspace.tsx) - see logWorkspaceStateDiff above for why this lives
 * here instead of at the call site.
 */
export function logClobberConfirmed(

    origin: string,

    workspaceId: string,

    staleFields: unknown

): void {

    emit(
        `[WS-AUDIT][CLOBBER CONFIRMED] ${new Date().toISOString()} | origin=${origin} | workspace=${workspaceId} | a REPLACE call just overwrote live state with a stale snapshot`,
        { staleFields },
        true
    );

}

// ============================================================================
// State-diff logging
//
// Note on "Download ownership": that's not a field on `Workspace` at
// all - it only exists as `pendingDownloads`/`webviewOwners` state
// inside electron/main.ts (see logMainEvent there: Download Armed /
// Download Started / Webview Registered already carry the resolved
// Workspace ID). It's intentionally left out of this renderer-side
// snapshot rather than faked - cross-reference the two logs by
// timestamp instead of expecting one combined field.
// ============================================================================

export interface WorkspaceDiagSnapshot {

    id: string;

    status: Workspace["status"];

    conversationUrl: string | undefined;

    /** Derived: status === "running". */
    generating: boolean;

    /** Derived: an image is currently attached to this Workspace. */
    uploaded: boolean;

    /** Derived: status === "error". */
    errored: boolean;

    /** Derived: this Workspace has a successfully saved image. */
    saved: boolean;

    imagePath: string | undefined;

    completedAt: string | undefined;

}

export function describeWorkspace(w: Workspace): WorkspaceDiagSnapshot {

    return {

        id: w.id,

        status: w.status,

        conversationUrl: w.conversationUrl,

        generating: w.status === "running",

        uploaded: !!w.uploadedImagePath,

        errored: w.status === "error",

        saved: w.status === "done" || !!w.imagePath,

        imagePath: w.imagePath,

        completedAt: w.completedAt,

    };

}

export interface WorkspaceFieldDiff {

    field: keyof WorkspaceDiagSnapshot;

    before: unknown;

    after: unknown;

}

export interface WorkspaceDiagDiff {

    id: string;

    change: "created" | "removed" | "modified";

    fields?: WorkspaceFieldDiff[];

}

/**
 * Field-level diff between two full-Workspace-list snapshots, matched
 * by id. Only Workspaces that actually changed (or were created/
 * removed) are included - an unaffected Workspace produces no entry,
 * so a non-empty diff for a Workspace nobody touched is itself the
 * signal to look for.
 */
export function diffWorkspaceSnapshots(

    before: WorkspaceDiagSnapshot[],

    after: WorkspaceDiagSnapshot[]

): WorkspaceDiagDiff[] {

    const beforeById = new Map(before.map(w => [w.id, w]));
    const afterById = new Map(after.map(w => [w.id, w]));

    const allIds = new Set([...beforeById.keys(), ...afterById.keys()]);

    const diffs: WorkspaceDiagDiff[] = [];

    for (const id of allIds) {

        const b = beforeById.get(id);
        const a = afterById.get(id);

        if (!b) {
            diffs.push({ id, change: "created" });
            continue;
        }

        if (!a) {
            diffs.push({ id, change: "removed" });
            continue;
        }

        const fields = (Object.keys(a) as (keyof WorkspaceDiagSnapshot)[])
            .filter(key => a[key] !== b[key])
            .map(key => ({ field: key, before: b[key], after: a[key] }));

        if (fields.length > 0) {
            diffs.push({ id, change: "modified", fields });
        }

    }

    return diffs;

}

// ============================================================================
// End of File
// ============================================================================
