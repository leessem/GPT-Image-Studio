# GPT-Image-Studio

Electron + React + TypeScript + Vite desktop application that automates
ChatGPT image generation.

The app embeds ChatGPT inside an Electron `<webview>` and automatically
submits prompts, waits for image generation to complete, and processes
multiple jobs sequentially.

----------------------------------------------------
Architecture
----------------------------------------------------

Data model: `Project -> Tabs -> Jobs[]`

```
Project
 ├── currentTabId
 └── tabs: ProjectTab[]
        └── jobs: Job[]
```

Each tab is an independent job queue. Only the tab matching
`currentTabId` is "current." The queue always resolves work as
`Project -> Current Tab -> Jobs` and must never touch jobs from an
inactive tab.

**Process layout**

```
electron/
  main.ts        BrowserWindow creation, GPU/single-instance setup,
                  native .gisp project save/open/saveAs via IPC
  preload.ts      contextBridge: exposes ipcRenderer (on/off/send/invoke)
                  + a `project` API (open/save/saveAs) to the renderer

src/
  components/
    Workspace/    Top-level layout + state orchestration. Owns the
                  `Project` state, wires Toolbar/JobTabs/Prompt/
                  Browser/ImageDrop, drives the queue lifecycle.
    Toolbar/       Header buttons — currently NOT wired to handlers.
    Workspace/JobTabs.tsx  Static single-tab stub — does not yet read
                  from `project.tabs` or support switching/adding tabs.
    Prompt/        Job list/editor panel. Reads jobs via
                  `getCurrentJobs(project)`.
    Browser/       `<webview>` wrapper (`Browser.tsx`) exposing
                  execute/reload/goBack/goForward via ref, plus
                  `ChatGPT.ts` — raw JS strings injected into the
                  webview to fill the prompt, click send, wait for the
                  generated image, and fetch it as base64.
    Queue/QueueRunner.ts  Drives the browser through a project's
                  current-tab jobs sequentially, updating job status
                  via `updateCurrentJobs`.
    ImageDrop/     Static stub — drag/drop and upload are unimplemented.
  services/JobService.ts   Pure functions over `Project`: getCurrentTab,
                  getCurrentJobs, updateCurrentJobs, add/delete/edit/
                  duplicate/reset job, status counts.
  types/           Job.ts, Project.ts (createProject/createTab),
                  Prompt.ts (PromptItem — see "Known unused code").
  utils/ProjectStorage.ts  localStorage persistence. `loadProject`
                  validates the stored value actually has a `tabs`
                  array before trusting it — untyped/legacy data falls
                  back to a fresh default project instead of crashing.
```

**Two persistence paths exist and are not unified:**
- `localStorage` autosave (`ProjectStorage.ts`), driven by a `useEffect`
  in `Workspace.tsx` — always active.
- Native `.gisp` file save/open/saveAs (`main.ts` IPC handlers +
  `preload.ts`'s `project` API) — fully implemented but not yet wired
  to any UI control.

**Known unused code (do not treat as broken — it's just not wired up):**
- `src/store/Promptstore.ts` + `src/data/prompts.json` + `PromptItem`
  type: a separate "prompt template library" concept, unused anywhere.
- `src/data/defaultJobs.ts` vs `src/components/data/defaultJobs.ts`:
  two near-duplicate seed files. Only the one under `components/data`
  is actually imported (by `Workspace.tsx`).

----------------------------------------------------
Coding Rules
----------------------------------------------------

- Always keep the project compiling: `npx tsc --noEmit` and
  `npx eslint . --ext ts,tsx` must both pass clean before considering
  a change done.
- Never output partial code. Always modify complete files.
- If multiple files must change together (e.g. a shared function
  signature), modify them together in the same pass.
- Read the existing implementation before changing it.
- Reuse existing code whenever possible. Do not rewrite working code
  without reason. Minimize unnecessary refactoring.
- Preserve the existing formatting style (this codebase favors heavy
  blank-line spacing inside function bodies — match it in files that
  already use it, don't impose it on files that don't).
- Never trust persisted/external data shape blindly. Validate before
  using (see `ProjectStorage.loadProject` — stale/legacy-shaped
  `localStorage` data caused a real production crash; it now falls
  back to a default instead of assuming the shape is correct).
- Electron GPU flags: `app.disableHardwareAcceleration()` +
  `app.commandLine.appendSwitch("disable-gpu")` +
  `("disable-gpu-compositing")` are required for stable rendering in
  constrained/virtualized environments. Do **not** also add
  `disable-software-rasterizer` — it removes the CPU fallback path
  entirely, which produces a fully blank/white window with zero
  console errors (very hard to diagnose).
- Call `app.requestSingleInstanceLock()` in `main.ts`. Without it,
  two concurrent instances can race over the same `userData` profile
  (localStorage LevelDB lock, GPU cache) and fail unpredictably.

----------------------------------------------------
Development Workflow
----------------------------------------------------

For every implementation step:

1. Read related files.
2. Modify files (complete files, not diffs/snippets).
3. Verify build: `npx tsc --noEmit` and `npx eslint . --ext ts,tsx`.
4. Run the app (`npm run dev`) and check DevTools console for runtime
   errors — a clean type-check does not guarantee a clean runtime.
5. Explain changes briefly.
6. Suggest a git commit message. Only commit when explicitly asked;
   only push to GitHub when explicitly asked.

**Build/run commands**
- `npm run dev` — Vite + Electron dev mode (auto-rebuilds
  `dist-electron/main.js` / `preload.mjs` on source change).
- `npm run build` — `tsc && vite build && electron-builder`.
- `npx tsc --noEmit -p tsconfig.json` — type-check only.
- `npx eslint . --ext ts,tsx` — lint only.

**Developer Preferences**
- Prefer complete source files over fragments.
- Keep explanations short; focus on implementation.
- Minimize unnecessary refactoring.
- Preserve existing coding style.
- Never ask to be pasted files that already exist in the repo — read
  the repository directly.
- When finished with a step, recommend a Git commit message.



## Approval Policy

- Group related file edits into one operation.
- Do not ask for approval for every individual file edit.
- Ask for approval only before:
  - deleting project files
  - removing directories
  - resetting git history
  - force pushing
  - running destructive shell commands


# Development Rules

- Never guess.
- Verify every implementation.
- One feature at a time.
- Do not modify unrelated files.
- Build must always pass.
- TypeScript must always pass.
- ESLint must always pass.
- Verify features before committing.
- Push every completed milestone.
- Update WORKLOG.md after every work session.
- Keep ROADMAP.md updated.

All normal code edits, builds, tests and commits should be grouped whenever possible.