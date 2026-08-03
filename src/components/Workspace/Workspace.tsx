// ============================================================================
// File : src/components/Workspace/Workspace.tsx
//
// V1.0: the Workspace IS the tab - there is no separate Job/Project
// concept, no Job List, no Queue. State is runtime-only and never
// persisted; closing the app discards every open Workspace. Only the
// Prompt Library survives a restart.
// ============================================================================

import { useRef, useState, useEffect } from "react";

import BrowserPool, { BrowserPoolHandle } from "../Browser/Browser";
import Prompt from "../Prompt/Prompt";
import Toolbar from "../Toolbar/Toolbar";
import WorkspaceTabs from "./WorkspaceTabs";
import WorkspacePanel from "./WorkspacePanel";

import { type Workspace, createWorkspace } from "../../types/Workspace";
import { PromptDraft, PromptItem } from "../../types/Prompt";

import { runGenerate } from "../../services/generate";

import PromptStore from "../../store/Promptstore";

import {
    getCurrentWorkspace,
    addWorkspace,
    deleteWorkspace,
    updateWorkspace,
    setWorkspacePrompt,
    setWorkspaceUploadedImage,
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
    // Generation (current Workspace only - there is no Queue)
    // ========================================================================

    const [running, setRunning] = useState(false);

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
    // Generate
    // ========================================================================

    const onGenerate = async () => {

        console.log("[Generate] Generate clicked for workspace", currentWorkspace.id);

        if (!browserPoolRef.current) {
            console.error("[Generate] Aborted: browser pool not ready");
            return;
        }

        if (running) {
            console.warn("[Generate] Aborted: already generating");
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
                setWorkspaces(prev => updateWorkspace(prev, workspace.id, updater)),

            onStart: () => setRunning(true),

            onFinish: () => setRunning(false),

            onError: err => console.error(err),

        });

    };

    // ========================================================================
    // Workspace events
    // ========================================================================

    const onAddWorkspace = () => {

        const { workspaces: next, created } = addWorkspace(workspaces);

        setWorkspaces(next);

        setCurrentWorkspaceId(created.id);

    };

    const onSwitchWorkspace = (id: string) => {

        setCurrentWorkspaceId(id);

    };

    const onDeleteWorkspace = (id: string) => {

        const remaining = deleteWorkspace(workspacesRef.current, id);

        setWorkspaces(remaining);

        setCurrentWorkspaceId(prev => (prev === id ? remaining[0].id : prev));

        browserPoolRef.current?.destroy(id);

    };

    const onUploadImage = (dataUrl: string) => {

        setWorkspaces(prev =>
            setWorkspaceUploadedImage(prev, currentWorkspace.id, dataUrl)
        );

    };

    const onRemoveImage = () => {

        setWorkspaces(prev =>
            setWorkspaceUploadedImage(prev, currentWorkspace.id, undefined)
        );

    };

    const onSelectPrompt = (promptId: string) => {

        const item = prompts.find(p => p.id === promptId);

        if (!item)
            return;

        setWorkspaces(prev =>
            setWorkspacePrompt(
                prev,
                currentWorkspace.id,
                promptId,
                item.prompt,
                item.title
            )
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

            {/* ===============================================================
                Toolbar
            ================================================================ */}

            <Toolbar />

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

                    running={running}

                    onUploadImage={onUploadImage}

                    onRemoveImage={onRemoveImage}

                    onSelectPrompt={onSelectPrompt}

                    onGenerate={onGenerate}

                />

            </div>

        </div>

    );

}

// ============================================================================
// File End
// ============================================================================
