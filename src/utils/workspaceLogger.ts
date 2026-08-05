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
// production build (`npm run build`), so every WS-AUDIT call below is
// dead code under that branch and gets stripped by Rollup's minifier -
// this isn't just "quiet in prod," the console.* calls themselves are
// not present in the packaged app at all.
const DIAGNOSTICS_ENABLED = import.meta.env.DEV;

export function logWorkspaceEvent(

    workspaceId: string,

    event: string,

    details?: Record<string, unknown>

): void {

    if (!DIAGNOSTICS_ENABLED)
        return;

    console.log(

        `[WS-AUDIT] ${new Date().toISOString()} | workspace=${workspaceId} | event=${event}`,

        details ?? {}

    );

}

/**
 * Dev-only equivalent of setWorkspacesLogged's per-call state-diff log
 * (Workspace.tsx) - kept here so the DIAGNOSTICS_ENABLED gate lives in
 * exactly one place.
 */
export function logWorkspaceStateDiff(

    origin: string,

    kind: "functional" | "REPLACE",

    payload: { before: WorkspaceDiagSnapshot[]; after: WorkspaceDiagSnapshot[]; diffs: WorkspaceDiagDiff[] }

): void {

    if (!DIAGNOSTICS_ENABLED)
        return;

    console.log(

        `[WS-AUDIT][setWorkspaces] ${new Date().toISOString()} | origin=${origin} | kind=${kind}`,

        payload

    );

}

/**
 * Dev-only equivalent of setWorkspacesLogged's clobber-detection log
 * (Workspace.tsx) - see logWorkspaceStateDiff above for why this lives
 * here instead of at the call site.
 */
export function logClobberConfirmed(

    origin: string,

    workspaceId: string,

    staleFields: unknown

): void {

    if (!DIAGNOSTICS_ENABLED)
        return;

    console.error(

        `[WS-AUDIT][CLOBBER CONFIRMED] ${new Date().toISOString()} | origin=${origin} | workspace=${workspaceId} | a REPLACE call just overwrote live state with a stale snapshot`,

        { staleFields }

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
