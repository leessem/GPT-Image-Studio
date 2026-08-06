// ============================================================================
// File : src/components/Workspace/Workspace.tsx
//
// V1.0: the Workspace IS the tab - there is no separate Job/Project
// concept, no Job List, no Queue. State is runtime-only and never
// persisted; closing the app discards every open Workspace. Only the
// Prompt Library survives a restart.
// ============================================================================

import { useRef, useState, useEffect } from "react";

import BrowserPool, { BrowserPoolHandle, CHATGPT_HOME_URL } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import WorkspaceTabs from "./WorkspaceTabs";
import WorkspacePanel from "./WorkspacePanel";
import FirstLaunchNotice from "../FirstLaunchNotice/FirstLaunchNotice";

import { type Workspace, createWorkspace } from "../../types/Workspace";
import { PromptDraft, PromptItem } from "../../types/Prompt";
import { WorkType } from "../../types/WorkType";

import { runGenerate } from "../../services/generate";
import {
    logWorkspaceEvent,
    describeWorkspace,
    diffWorkspaceSnapshots,
    logWorkspaceStateDiff,
    logClobberConfirmed,
} from "../../utils/workspaceLogger";

import PromptStore from "../../store/Promptstore";
import WorkTypeStore from "../../store/WorkTypeStore";

import {
    getCurrentWorkspace,
    addWorkspace,
    deleteWorkspace,
    updateWorkspace,
    setWorkspacePrompt,
    setWorkspaceWorkType,
    setWorkspaceUploadedImage,
    setWorkspaceCustomerName,
    setWorkspaceCustomerNumber,
    clearWorkspace,
} from "../../services/WorkspaceService";

import "./Workspace.css";

export default function Workspace() {

    // ========================================================================
    // Browser (one shared partition/login, one persistent webview per
    // Workspace - a Workspace's independence comes from owning its own
    // webview, which stays parked on its own conversation; switching
    // Workspaces never navigates)
    // ========================================================================

    const browserPoolRef = useRef<BrowserPoolHandle>(null);

    // ========================================================================
    // Workspaces - runtime only, never persisted. Always starts with
    // exactly one Workspace, and always has at least one open.
    // ========================================================================

    const [workspaces, setWorkspaces] = useState<Workspace[]>(
        () => [createWorkspace()]
    );

    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(
        () => workspaces[0].id
    );

    const currentWorkspace = getCurrentWorkspace(workspaces, currentWorkspaceId);

    // Mirrors `workspaces` for the switch effect below, so it can depend on
    // currentWorkspaceId alone (not on workspaces, which changes constantly
    // during generation) while still reading fresh data.
    const workspacesRef = useRef(workspaces);

    useEffect(() => {

        workspacesRef.current = workspaces;

    }, [workspaces]);

    // Switching Workspaces never navigates anything - each Workspace owns
    // its own persistent webview, which already sits on its own
    // conversation. This only makes sure that webview *exists* (creating
    // it - and restoring its conversationUrl, if any - the first time this
    // Workspace is activated); visibility is driven purely by passing
    // currentWorkspaceId as BrowserPool's activeWorkspaceId prop.
    useEffect(() => {

        if (!browserPoolRef.current)
            return;

        const workspace = workspacesRef.current.find(
            w => w.id === currentWorkspaceId
        );

        browserPoolRef.current.ensure(currentWorkspaceId, workspace?.conversationUrl);

    }, [currentWorkspaceId]);

    // ========================================================================
    // TEMPORARY (root-cause audit for the still-reproducible cross-
    // Workspace Error bug - release policy: v1.1.0 stays frozen, a fix
    // ships as v1.1.1 only after this is proven): every setWorkspaces
    // call in this file goes through this one wrapper, purely for
    // logging - behavior is byte-for-byte identical to calling
    // setWorkspaces directly.
    //
    // Every handler in this file EXCEPT onAddWorkspace and
    // onDeleteWorkspace already uses React's functional update form
    // (`setWorkspaces(prev => ...)`), which is safe under concurrent
    // updates because `prev` is always whatever React actually has at
    // apply time. onAddWorkspace/onDeleteWorkspace are the only two
    // call sites that instead compute a full replacement array from a
    // `workspaces`/`workspacesRef.current` snapshot read at the START
    // of the click handler, then call `setWorkspaces(next)` directly -
    // a plain replace, not a merge. If that update and another
    // Workspace's in-flight generate.ts onUpdate() (also a
    // setWorkspaces call, from an awaited browser.execute() promise
    // resolving around the same moment) land in the same React batch,
    // the plain replace silently wins and discards whatever the other
    // update just applied, because `next`/`remaining` never incorporated
    // it in the first place.
    //
    // This wrapper logs, for every call, a full BEFORE/AFTER state-diff
    // (status, conversationUrl, and derived Generate/Upload/Error/Save
    // state per Workspace - see describeWorkspace in workspaceLogger.ts)
    // plus a field-level diff, so exactly which property changed is
    // provable from the log rather than eyeballed.
    //
    // It also runs an automatic, mechanical clobber check on the two
    // REPLACE call sites: a REPLACE's `result` was built from a
    // Workspace[] snapshot read at the START of the click handler, not
    // from `prev` (what React actually has when the update is applied).
    // Every Workspace carried over unchanged by the REPLACE (present in
    // both `prev` and `result`) MUST therefore be byte-identical to its
    // live `prev` entry - if any field differs, `result` provably
    // overwrote a live update with a stale one, for exactly the fields
    // logged under [WS-AUDIT][CLOBBER CONFIRMED]. This is not a
    // heuristic: it fires if and only if a REPLACE actually discarded a
    // concurrent change, for the exact Workspace/fields it discarded.
    //
    // Note: React 18 StrictMode (see src/main.tsx) intentionally
    // double-invokes updater functions in dev, so each call may log
    // twice here - harmless, expected, not a sign of a double update.
    // ========================================================================

    const setWorkspacesLogged = (
        origin: string,
        next: Workspace[] | ((prev: Workspace[]) => Workspace[])
    ) => {

        const isReplace = typeof next !== "function";

        setWorkspaces(prev => {

            const before = prev.map(describeWorkspace);

            const result = typeof next === "function" ? next(prev) : next;

            const after = result.map(describeWorkspace);

            const diffs = diffWorkspaceSnapshots(before, after);

            logWorkspaceStateDiff(origin, isReplace ? "REPLACE" : "functional", { before, after, diffs });

            if (isReplace) {

                const prevById = new Map(prev.map(w => [w.id, w]));

                for (const w of result) {

                    const live = prevById.get(w.id);

                    // Not carried over from the stale snapshot (a
                    // genuinely new Workspace, e.g. addWorkspace's
                    // `created`) - nothing to compare against.
                    if (!live)
                        continue;

                    const liveDescriptor = describeWorkspace(live);
                    const staleDescriptor = describeWorkspace(w);

                    const staleFields = (
                        Object.keys(liveDescriptor) as (keyof typeof liveDescriptor)[]
                    )
                        .filter(key => liveDescriptor[key] !== staleDescriptor[key])
                        .map(key => ({
                            field: key,
                            live: liveDescriptor[key],
                            staleValueApplied: staleDescriptor[key],
                        }));

                    if (staleFields.length > 0) {

                        logClobberConfirmed(origin, w.id, staleFields);

                    }

                }

            }

            return result;

        });

    };

    // ========================================================================
    // Prompt Library
    //
    // PromptStore is the single source of truth for prompt content - this
    // is just a rendering cache kept in lockstep with it, re-synced
    // immediately after every mutation since the plain singleton store
    // can't trigger a React re-render on its own.
    // ========================================================================

    const [prompts, setPrompts] = useState<PromptItem[]>(
        () => PromptStore.getAll()
    );

    // ========================================================================
    // Work Type Management
    //
    // WorkTypeStore is the single source of truth (Settings > Work Type
    // Management) - this is just a rendering cache, re-synced after every
    // mutation. Only enabled Work Types are ever shown as chips in the
    // Workspace panel.
    // ========================================================================

    const [workTypes, setWorkTypes] = useState<WorkType[]>(
        () => WorkTypeStore.getAll()
    );

    const enabledWorkTypes = workTypes.filter(workType => workType.enabled);

    // ========================================================================
    // First Launch Notice - shown exactly once, ever. Persisted in
    // main.ts's settings.json (not this runtime-only Workspace state),
    // so it survives a restart and never reappears once acknowledged.
    // ========================================================================

    const [showFirstLaunchNotice, setShowFirstLaunchNotice] = useState(false);

    useEffect(() => {

        window.ipcRenderer.settings.getFirstLaunchNoticeShown().then(shown => {

            if (!shown)
                setShowFirstLaunchNotice(true);

        });

    }, []);

    const onAcknowledgeFirstLaunchNotice = () => {

        window.ipcRenderer.settings.markFirstLaunchNoticeShown();

        setShowFirstLaunchNotice(false);

    };

    // ========================================================================
    // Generate
    //
    // Generation state (isGenerating/isDownloading, both folded into
    // workspace.status - see generate.ts) belongs ONLY to the Workspace
    // being generated, never to a global flag - this is what lets Workspace
    // A generate while Workspace B/C stay independently Ready. The
    // reentrancy guard below checks *this* Workspace's own status, not a
    // shared one, so it only ever blocks a Workspace from generating twice
    // at once - it never blocks a different Workspace.
    // ========================================================================

    const onGenerate = async () => {

        console.log("[Generate] Generate clicked for workspace", currentWorkspace.id);

        if (!browserPoolRef.current) {
            console.error("[Generate] Aborted: browser pool not ready");
            return;
        }

        if (currentWorkspace.status === "running") {
            console.warn("[Generate] Aborted: this Workspace is already generating");
            return;
        }

        const selectedPrompt = prompts.find(p => p.id === currentWorkspace.selectedPromptId);

        if (selectedPrompt?.requiresName && !currentWorkspace.customerName?.trim()) {
            console.warn("[Generate] Aborted: this prompt requires a customer name");
            return;
        }

        if (selectedPrompt?.requiresNumber && !currentWorkspace.customerNumber?.trim()) {
            console.warn("[Generate] Aborted: this prompt requires a number");
            return;
        }

        const workspace = currentWorkspace;

        const browser = await browserPoolRef.current.ensure(
            workspace.id,
            workspace.conversationUrl
        );

        await runGenerate({

            browser,

            workspace,

            onUpdate: updater =>
                setWorkspacesLogged("generate:onUpdate", prev => updateWorkspace(prev, workspace.id, updater)),

            onError: err => console.error(err),

        });

    };

    // ========================================================================
    // Clear - instant reset of ONLY the active Workspace (its own image/
    // prompt/Work Type/status/conversation), so the user can start the
    // next generation right away without opening a new Workspace tab.
    // Never touches the Prompt Library, Work Type definitions, Settings,
    // or any other Workspace. Disabled while this Workspace is running
    // (see WorkspacePanel) so it can never race the in-flight generation.
    // ========================================================================

    const onClearWorkspace = () => {

        const workspace = currentWorkspace;

        // The visual reset must happen first and synchronously - it's
        // the "instant" part. Re-pointing the webview at a fresh
        // conversation is a real page navigation (not instant), so it
        // fires after, without the reset ever waiting on it.
        setWorkspacesLogged("clearWorkspace", prev => clearWorkspace(prev, workspace.id));

        browserPoolRef.current?.get(workspace.id)?.loadURL(CHATGPT_HOME_URL);

    };

    // ========================================================================
    // Workspace events
    // ========================================================================

    const onAddWorkspace = () => {

        // `created` is independent of the existing Workspace list
        // (createWorkspace() takes no input) - only the array append
        // itself needs to happen against React's live `prev`, not a
        // snapshot read at the start of this handler (see
        // setWorkspacesLogged's clobber-detection comment above).
        const { created } = addWorkspace(workspaces);

        setWorkspacesLogged("addWorkspace", prev => [...prev, created]);

        setCurrentWorkspaceId(created.id);

        logWorkspaceEvent(created.id, "Workspace Created");

    };

    const onSwitchWorkspace = (id: string) => {

        setCurrentWorkspaceId(id);

    };

    const onDeleteWorkspace = (id: string) => {

        // The array removal itself now runs against React's live
        // `prev`, not a workspacesRef.current snapshot (see
        // setWorkspacesLogged's clobber-detection comment above). The
        // currentWorkspaceId fallback below is unrelated to that bug
        // (it only ever picks which tab to switch to, never mutates
        // Workspace data) and is left exactly as it was, still off
        // workspacesRef.current.
        setWorkspacesLogged("deleteWorkspace", prev => deleteWorkspace(prev, id));

        setCurrentWorkspaceId(prev => {

            if (prev !== id)
                return prev;

            const remaining = deleteWorkspace(workspacesRef.current, id);

            return remaining[0].id;

        });

        browserPoolRef.current?.destroy(id);

        logWorkspaceEvent(id, "Workspace Destroyed");

    };

    const onUploadImage = (dataUrl: string) => {

        setWorkspacesLogged("uploadImage", prev =>
            setWorkspaceUploadedImage(prev, currentWorkspace.id, dataUrl)
        );

    };

    const onRemoveImage = () => {

        setWorkspacesLogged("removeImage", prev =>
            setWorkspaceUploadedImage(prev, currentWorkspace.id, undefined)
        );

    };

    const onSelectPrompt = (promptId: string) => {

        const item = prompts.find(p => p.id === promptId);

        if (!item)
            return;

        setWorkspacesLogged("selectPrompt", prev =>
            setWorkspacePrompt(
                prev,
                currentWorkspace.id,
                promptId,
                item.prompt,
                item.title
            )
        );

    };

    // Clicking the already-selected chip again deselects it - "No Work
    // Type selected" is a valid, documented state (see the Filename
    // section of Settings), not just an unreachable default.
    const onSelectWorkType = (workTypeId: string) => {

        const next = currentWorkspace.workTypeId === workTypeId
            ? undefined
            : workTypeId;

        const workType = next
            ? workTypes.find(w => w.id === next)
            : undefined;

        setWorkspacesLogged("selectWorkType", prev =>
            setWorkspaceWorkType(
                prev,
                currentWorkspace.id,
                next,
                workType?.filenamePrefix
            )
        );

    };

    // Prompt Variable feature (v1.2.0) - free-text value substituted for
    // {NAME} in the selected prompt, independent of Work Type.
    const onSetCustomerName = (customerName: string) => {

        setWorkspacesLogged("setCustomerName", prev =>
            setWorkspaceCustomerName(prev, currentWorkspace.id, customerName)
        );

    };

    // Prompt Variable feature (v1.2.1) - free-text value substituted for
    // {NUM} in the selected prompt, independent of customerName/{NAME}.
    const onSetCustomerNumber = (customerNumber: string) => {

        setWorkspacesLogged("setCustomerNumber", prev =>
            setWorkspaceCustomerNumber(prev, currentWorkspace.id, customerNumber)
        );

    };

    // ========================================================================
    // Prompt Library (template management only)
    // ========================================================================

    const onCreatePrompt = (draft: PromptDraft) => {

        PromptStore.create(draft);

        setPrompts(PromptStore.getAll());

    };

    const onSavePrompt = (id: string, draft: PromptDraft) => {

        PromptStore.update(id, draft);

        setPrompts(PromptStore.getAll());

    };

    const onDeletePrompt = (id: string) => {

        PromptStore.remove(id);

        setPrompts(PromptStore.getAll());

    };

    return (

        <div className="workspace">

            {showFirstLaunchNotice && (

                <FirstLaunchNotice onAcknowledge={onAcknowledgeFirstLaunchNotice} />

            )}

            {/* ===============================================================
                Toolbar
            ================================================================ */}

            <Toolbar

                onPromptLibraryChanged={() => setPrompts(PromptStore.getAll())}

                onWorkTypesChanged={() => setWorkTypes(WorkTypeStore.getAll())}

            />

            {/* ===============================================================
                Workspace Tabs
            ================================================================ */}

            <WorkspaceTabs

                workspaces={workspaces}

                currentWorkspaceId={currentWorkspaceId}

                onSwitch={onSwitchWorkspace}

                onAdd={onAddWorkspace}

                onDelete={onDeleteWorkspace}

            />

            {/* ===============================================================
                Main Layout: Prompt Library | ChatGPT Browser | Workspace Panel
            ================================================================ */}

            <div className="workspace-body">

                <div className="workspace-sidebar">

                    <Prompt

                        prompts={prompts}

                        onCreatePrompt={onCreatePrompt}

                        onSavePrompt={onSavePrompt}

                        onDeletePrompt={onDeletePrompt}

                    />

                </div>

                <BrowserPool

                    ref={browserPoolRef}

                    activeWorkspaceId={currentWorkspaceId}

                />

                <WorkspacePanel

                    workspace={currentWorkspace}

                    prompts={prompts}

                    workTypes={enabledWorkTypes}

                    onUploadImage={onUploadImage}

                    onRemoveImage={onRemoveImage}

                    onSelectPrompt={onSelectPrompt}

                    onSelectWorkType={onSelectWorkType}

                    onSetCustomerName={onSetCustomerName}

                    onSetCustomerNumber={onSetCustomerNumber}

                    onGenerate={onGenerate}

                    onClear={onClearWorkspace}

                />

            </div>

        </div>

    );

}

// ============================================================================
// File End
// ============================================================================
