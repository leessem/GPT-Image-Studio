// ============================================================================
// File : src/utils/debugLogger.ts
//
// Version 1.2.3 Debug Build: a permanent, Settings-toggleable ("Debug
// Mode") forensic logging system for the Generate pipeline - distinct
// from workspaceLogger.ts's WS-AUDIT system, which is dev-only/env-gated
// and explicitly temporary. This one is meant to stay, and to work in a
// real packaged build, not just `npm run dev`.
//
// One self-contained session folder per Generate attempt
// (DebugLogs/<sessionId>/, see electron/main.ts) rather than one
// running log file - startDebugSession() mints the sessionId once per
// runGenerate() call, and every log/artifact call below is scoped to
// it. Every exported function short-circuits immediately when Debug
// Mode is off - not just quieter, genuinely zero IPC calls and zero
// disk writes. All actual file I/O happens in electron/main.ts (the
// renderer can't write files directly); this module only ever formats
// data and hands it to window.ipcRenderer.debug.*, same "best-effort,
// never throw into the real pipeline" try/catch pattern
// workspaceLogger.ts's emit() already uses.
// ============================================================================

let debugModeEnabled = false;

const debugModeListeners = new Set<(enabled: boolean) => void>();

/**
 * Called once from Workspace.tsx on mount (after reading the persisted
 * setting) and again immediately whenever the Settings > Debug Mode
 * checkbox changes - so toggling it takes effect without an app
 * restart, in both directions. Also notifies subscribeDebugMode
 * listeners (Workspace.tsx uses this to decide whether to mount
 * DebugWindow at all) in the same tick.
 */
export function initDebugLogger(enabled: boolean): void {

    debugModeEnabled = enabled;

    for (const listener of debugModeListeners)
        listener(enabled);

}

export function isDebugModeEnabled(): boolean {

    return debugModeEnabled;

}

export function subscribeDebugMode(listener: (enabled: boolean) => void): () => void {

    debugModeListeners.add(listener);

    listener(debugModeEnabled);

    return () => {
        debugModeListeners.delete(listener);
    };

}

/**
 * Filesystem-safe timestamp, e.g. "2026-08-07_17-35-12" - matches the
 * example folder name in the spec exactly. Called once per Generate
 * attempt (runGenerate's very first line); every log/artifact call for
 * that attempt is scoped under this one session id.
 */
export function startDebugSession(workspaceId: string): string | null {

    if (!debugModeEnabled) {
        activeSessions.delete(workspaceId);
        return null;
    }

    const now = new Date();

    const pad = (n: number) => String(n).padStart(2, "0");

    const sessionId = (
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    );

    activeSessions.set(workspaceId, sessionId);

    return sessionId;

}

// A Workspace's own ChatGPT <webview> guest page (where the DOM
// MutationObserver runs - see ChatGPT.ts) has no way to receive the
// current sessionId directly; Browser.tsx's console-message listener
// only ever knows the workspaceId. This map lets logDomEvent resolve
// workspaceId -> "whichever session is currently running for it"
// without Browser.tsx needing to know anything about sessions at all.
const activeSessions = new Map<string, string>();

export function getActiveSessionId(workspaceId: string): string | null {

    return activeSessions.get(workspaceId) ?? null;

}

// ============================================================================
// Debug Window state - a tiny pub-sub so the floating debug panel
// (src/components/DebugWindow/DebugWindow.tsx) can re-render on every
// pipeline stage change without generate.ts or Workspace.tsx knowing
// anything about that component. logPipelineStage below is the only
// writer.
// ============================================================================

export interface DebugPanelState {

    sessionId: string | null;

    workspaceId: string | null;

    workspaceName: string | null;

    promptName: string | null;

    stage: string | null;

    startedAt: number | null;

    lastError: string | null;

}

let panelState: DebugPanelState = {
    sessionId: null,
    workspaceId: null,
    workspaceName: null,
    promptName: null,
    stage: null,
    startedAt: null,
    lastError: null,
};

const panelListeners = new Set<(state: DebugPanelState) => void>();

export function subscribeDebugPanel(listener: (state: DebugPanelState) => void): () => void {

    panelListeners.add(listener);

    listener(panelState);

    return () => {
        panelListeners.delete(listener);
    };

}

function updatePanelState(patch: Partial<DebugPanelState>): void {

    panelState = { ...panelState, ...patch };

    for (const listener of panelListeners)
        listener(panelState);

}

function emitLine(
    sessionId: string,
    file: "pipeline" | "prompt" | "workspace" | "dom" | "error",
    prefix: string,
    workspaceId: string | undefined,
    event: string,
    details?: Record<string, unknown>
): void {

    if (!debugModeEnabled)
        return;

    const line = `[${prefix}] ${new Date().toISOString()} | workspace=${workspaceId ?? "-"} | event=${event} ${JSON.stringify(details ?? {})}`;

    try {
        window.ipcRenderer.debug.log(sessionId, file, line);
    }
    catch {
        // best-effort - never let debug logging crash the renderer
    }

}

/**
 * One of the pipeline stages (Generate Click, Workspace Ready, Prompt
 * Selected, Variables Applied, Image Upload Start/Complete, Prompt
 * Insert Start/Complete, Prompt Verification Start/Pass, Send Button
 * Found/Enabled, Send Click, Conversation Started, Image Detection,
 * Download Start/Complete, Save Complete, Workspace Ready again) -
 * every call site is an existing point in generate.ts's control flow,
 * this only ever adds a log line (and updates the Debug Window's
 * state), never changes what happens next.
 */
export function logPipelineStage(
    sessionId: string | null,
    workspaceId: string,
    stage: string,
    details?: Record<string, unknown>
): void {

    updatePanelState({
        sessionId,
        workspaceId,
        stage,
        startedAt: panelState.workspaceId === workspaceId && panelState.startedAt
            ? panelState.startedAt
            : (stage === "Generate Click" ? Date.now() : panelState.startedAt),
    });

    if (!sessionId)
        return;

    emitLine(sessionId, "pipeline", "PIPELINE", workspaceId, stage, details);

}

/** Called once from onGenerate (Workspace.tsx) so the Debug Window can
 *  show the Workspace name / selected Prompt name even before the
 *  pipeline itself logs anything. */
export function setDebugPanelContext(workspaceName: string, promptName: string | null): void {

    updatePanelState({ workspaceName, promptName });

}

export function logWorkspaceDebug(
    sessionId: string | null,
    workspaceId: string,
    event: string,
    details?: Record<string, unknown>
): void {

    if (!sessionId)
        return;

    emitLine(sessionId, "workspace", "WORKSPACE", workspaceId, event, details);

}

/**
 * Forwards one already-formatted "[DOM-LOG] ..." console line captured
 * from the ChatGPT <webview>'s own console-message event (see
 * Browser.tsx) into that session's dom.log. The MutationObserver
 * producing these lines runs inside the webview's guest page, which has
 * no access to window.ipcRenderer at all (preload is only injected into
 * this app's own main window) - console.log + a console-message
 * listener is the only bridge back into this app.
 */
export function logDomEvent(workspaceId: string, rawConsoleLine: string): void {

    const sessionId = getActiveSessionId(workspaceId);

    if (!debugModeEnabled || !sessionId)
        return;

    const line = `[DOM] ${new Date().toISOString()} | workspace=${workspaceId} | ${rawConsoleLine}`;

    try {
        window.ipcRenderer.debug.log(sessionId, "dom", line);
    }
    catch {
        // best-effort
    }

}

export interface PromptDataInput {
    sessionId: string | null;
    workspaceId: string;
    promptName: string;
    promptId: string;
    original: string;
    substituted: string;
    composerReadback: string;
}

/**
 * Saves original_prompt.txt / resolved_prompt.txt / composer_readback.txt
 * / prompt_diff.txt plus the SHA256/char-count/line-count summary line
 * in that session's prompt.log. The diff itself and the hash are
 * computed in main.ts (Node's crypto, and the same LCS-based diff
 * already verified live this session) - this just forwards the raw
 * strings over IPC.
 */
export function savePromptData(input: PromptDataInput): void {

    if (!debugModeEnabled || !input.sessionId)
        return;

    try {
        void window.ipcRenderer.debug.savePromptData({ ...input, sessionId: input.sessionId });
    }
    catch {
        // best-effort
    }

}

/** workspace_before.json / workspace_after.json - a full JSON snapshot
 *  of the Workspace object at Generate-start and at whatever point the
 *  run finishes (success or failure). */
export function saveWorkspaceSnapshot(
    sessionId: string | null,
    phase: "before" | "after",
    workspaceJson: string
): void {

    if (!debugModeEnabled || !sessionId)
        return;

    try {
        void window.ipcRenderer.debug.saveWorkspaceSnapshot(sessionId, phase, workspaceJson);
    }
    catch {
        // best-effort
    }

}

/** composer.html / composer.txt - the ChatGPT composer's own markup and
 *  text at whatever moment this is called (used both by the error path
 *  and, once per run, right after Send). */
export function saveComposerSnapshot(
    sessionId: string | null,
    payload: { html: string | null; text: string | null }
): void {

    if (!debugModeEnabled || !sessionId)
        return;

    try {
        void window.ipcRenderer.debug.saveComposerSnapshot(sessionId, payload);
    }
    catch {
        // best-effort
    }

}

export interface ErrorCaptureInput {
    sessionId: string | null;
    workspaceId: string;
    stage: string;
    reason: string;
    exception: unknown;
}

/**
 * error.log entry for a pipeline failure. The Workspace/composer/DOM
 * snapshots and the screenshot are saved separately (saveWorkspaceSnapshot/
 * saveComposerSnapshot/captureScreenshot, called alongside this from
 * generate.ts) - this only ever writes the summary line. Fire-and-forget
 * by design (never awaited by the caller) and every failure mode inside
 * is swallowed - a logging problem must never turn into (or delay) the
 * real error the Workspace is already being marked with. Logging
 * continues after this - nothing here ever stops the pipeline.
 */
export function captureError(input: ErrorCaptureInput): void {

    if (!debugModeEnabled || !input.sessionId)
        return;

    try {

        const exception = input.exception;

        const exceptionMessage = exception instanceof Error
            ? exception.message
            : exception
                ? String(exception)
                : null;

        const stack = exception instanceof Error ? (exception.stack ?? null) : null;

        updatePanelState({ lastError: `${input.stage}: ${input.reason}` });

        void window.ipcRenderer.debug.captureError({
            sessionId: input.sessionId,
            workspaceId: input.workspaceId,
            stage: input.stage,
            reason: input.reason,
            exception: exceptionMessage,
            stack,
        });

    }
    catch {
        // best-effort
    }

}

/**
 * Captures a screenshot of the given Workspace's own ChatGPT webview
 * (main.ts resolves workspaceId -> that webview's own webContents.id)
 * for the given phase - "before_send" (right before buildPromptScript
 * runs) or "after_send" (right after it resolves, success or failure).
 * Independently best-effort - a failed screenshot must never block or
 * fail the rest of the pipeline/error capture.
 */
export function captureScreenshot(
    sessionId: string | null,
    workspaceId: string,
    phase: "before_send" | "after_send"
): void {

    if (!debugModeEnabled || !sessionId)
        return;

    try {
        void window.ipcRenderer.debug.screenshot(sessionId, workspaceId, phase);
    }
    catch {
        // best-effort
    }

}

/** Settings > Debug Mode / the Debug Window's own "Export Diagnostics"
 *  button - zips the given session's entire folder and lets the user
 *  choose where to save it. */
export function exportDiagnostics(sessionId: string) {

    return window.ipcRenderer.debug.exportDiagnostics(sessionId);

}

// ============================================================================
// End of File
// ============================================================================
