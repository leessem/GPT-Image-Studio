# WORKLOG

## Date

2026-08-02

## Today's Completed Work

Starting point was a working Project/Tabs architecture with Toolbar and
JobTabs freshly wired to state (commit `70c2e85`), but the actual
ChatGPT browser automation (prompt -> generate -> download) was
unverified and, once tested, found to be broken. Today's session took
it from "looks wired up" to "verified working end-to-end across
repeated runs."

- Wired native `.gisp` **Open** into the Toolbar (Save/SaveAs already
  existed; Open did not).
- Built the first version of the generate -> capture -> display
  pipeline (`ImageDrop`, `QueueRunner`, `ChatGPT.ts` scripts), initially
  using an in-page `fetch()` + base64 approach to grab the generated
  image.
- **Rewrote image capture to use a real download**, per instruction to
  behave like an actual user (click image -> open viewer -> click
  Download -> capture via Electron's `will-download`) instead of
  reading image bytes out of the DOM.
- **Debugged prompt automation going completely silent** on Start
  Queue. Root cause (found via live CDP tracing against the real
  ChatGPT webview, not guessed): `QueueRunner` never checked
  `buildPromptScript`'s result, so a failed injection silently fell
  through into an infinite "wait for image" poll. Fixed, then found
  the *actual* underlying bug: clicking send in the same tick as the
  just-dispatched input event races ahead of React's state update.
- Added click-to-insert-only prompt selection from the Prompt Library
  (no queue, no auto-send) by extracting the shared insertion logic
  out of `buildPromptScript`.
- **Found and fixed the download button selector was language-specific**
  (matched English "download" text; ChatGPT's UI here is Korean, real
  control is `aria-label="저장"`). Replaced with a priority-ordered,
  language-independent matcher (data-testid -> aria-label -> role ->
  SVG icon -> text), with every candidate logged before deciding.
- **Found and fixed `will-download` never firing**: the `<webview>`
  uses a distinct partitioned session (`persist:gpt-image-studio`),
  but the listener was only attached to `session.defaultSession`.
  Fixed by attaching to both.
- **Investigated a reliability regression** (worked once, not
  reliably): found via live network monitoring that a naive
  "wait-a-fixed-delay-then-click" approach for the send button is
  flaky (works sometimes, silently fails others). Replaced with
  verify-and-retry: poll for a real, observable acceptance signal
  (textarea empties / user message count increases / assistant
  message starts / send button transitions into "generating" state),
  retrying the click (bounded, logged) if none appear. Had to guard
  the "generating state" signal against a false positive caused by
  the *previous* job's generation still finishing.
- Implemented viewer cleanup after download (close the dialog, confirm
  it's gone, confirm the textarea is focused again) before advancing
  to the next queue item - discovered and fixed a real bug here too:
  closing via a synthetic Escape keypress also triggered ChatGPT's own
  "stop conversation" call and broke the next send; switched to
  clicking the dialog's own close control instead.
- **Found and fixed a second real download-flow bug**: when a single
  ChatGPT turn generates multiple images ("series"), the Save/Download
  control becomes a menu trigger instead of a direct-download button.
  Added detection (poll for the menu's appearance) and click the
  single-image download item, avoiding the bulk "series" item.
- Added file-existence verification (`image:verifyFile` IPC, polls
  `fs.statSync`, never trusts the download-completed event alone),
  and wired the verified path into `job.imagePath` so `ImageDrop`
  displays it (no extra plumbing needed - it already derives its list
  from project state).
- Fixed an ESLint config gap (`dist-electron` wasn't in
  `ignorePatterns`, so a bare `eslint .` linted generated build output
  and errored on things like `process` not being defined).

All of the above investigation work was done by driving the real
ChatGPT webview live via Chrome DevTools Protocol (temporary
`--remote-debugging-port`, always reverted after use) - clicking
through the actual UI, monitoring real network requests and console
output - not by guessing at behavior.

## Current Architecture Summary

```
Project -> Tabs -> Jobs[]
```

- `electron/main.ts` - window/session setup, native `.gisp`
  open/save/saveAs, `will-download` capture (listens on both
  `session.defaultSession` and the webview's own partitioned
  session), `image:armDownload` / `image:verifyFile` IPC handlers.
- `electron/preload.ts` - exposes `ipcRenderer` + `project` + `image`
  APIs to the renderer.
- `src/components/Browser/ChatGPT.ts` - all injected-JS script
  builders: prompt insertion (queue-driven and click-to-insert
  variants), send with verify-and-retry, wait-for-generation, open
  viewer, wait-for-viewer, click download (handles both the direct
  button and the multi-image menu case), close viewer.
- `src/components/Queue/QueueRunner.ts` - drives one job at a time
  through the full pipeline (insert -> verify sent -> wait generation
  -> open viewer -> download -> verify file on disk -> close viewer),
  stopping immediately with an exact logged reason if any step fails,
  never silently continuing.
- `src/components/ImageDrop/ImageDrop.tsx` - renders generated images
  from `job.imagePath` (via `file://` URLs) plus the original
  drag/drop upload feature, unchanged.
- `src/components/Workspace/Workspace.tsx` - owns `Project` state,
  wires everything together, derives `ImageDrop`'s image list directly
  from project state (no manual refresh call needed).

## Current Verified Status

- `npx tsc --noEmit`: clean
- `npx eslint . --ext ts,tsx` and bare `npx eslint .`: clean
- `npm run build`: `tsc` + `vite build` succeed for both renderer and
  electron main/preload. The final `electron-builder` packaging step
  fails in this local environment (needs Windows Developer Mode or
  admin rights to extract bundled macOS code-signing tools via
  symlink) - a machine limitation, not a code defect.
- **Full queue workflow verified via 3 consecutive complete runs** of
  a 3-job queue, each finishing all 3 generations with zero manual
  interaction: prompt inserted and accepted (retries exercised and
  recovered in some runs), image generated, viewer opened, image
  downloaded (both the direct-button and multi-image-menu cases were
  hit across these runs), file verified on disk, viewer closed, and
  all 3 images correctly displayed in ImageDrop.

## Remaining Issues

- A gray circular CDP mouse-pointer artifact appears in the app during
  automated testing - identified as Chromium's native DevTools
  inspect-mode cursor (both the main window and the webview call
  `openDevTools()` unconditionally). Explicitly deferred as low
  priority; not investigated further per instruction.
- Two persistence paths still coexist unreconciled: localStorage
  autosave vs native `.gisp` file save/open. Not unified.
- `src/store/Promptstore.ts` + `src/data/prompts.json` + `PromptItem`
  type remain unused (a separate prompt-template-library concept never
  wired up).
- Toolbar's Settings button is still disabled/non-functional (no
  feature exists behind it).
- Verified reliability is at n=3 consecutive runs / 3 jobs each - not
  yet stress-tested with larger job counts or over long unattended
  periods.
- `electron-builder` installer packaging cannot complete on this
  machine without enabling Windows Developer Mode (or running as
  admin); untested on a properly configured machine.

## Next Recommended Task

With the queue now verified reliable, the next reasonable step is
either (a) stress-test with a larger job count (5-10+) and/or a longer
unattended run to shake out any issues that only show up over more
iterations, or (b) start on the previously-deferred low-priority items
(cursor artifact, Settings feature, unifying the two persistence
paths) now that they're no longer blocked by "queue must be reliable
first."

## Latest Commit Hash

`9e2ea42fa120089c392371ca483565ab7d122e06`

---

## Session 2 (2026-08-02): Prompt Library, DevTools, Job-first pivot

### Prompt Library redesign + full CRUD/persistence system

- Replaced the mislabeled job-list-posing-as-a-library with a real
  Prompt Library: `PromptLibrary.tsx` shows titles only,
  `PromptEditor.tsx` loads whatever title is selected.
- Moved all prompt data into `PromptStore` (`src/store/Promptstore.ts`)
  as the single source of truth - the UI never holds a copy of prompt
  content, only a selected id.
- Extended the data model to `id / title / prompt / negativePrompt /
  createdAt / updatedAt` and gave the editor full Create/Edit/Delete/
  Save actions.
- Added `localStorage` persistence (`gpt-image-studio-prompt-library`)
  with the same "never trust stored data blindly" validation pattern
  as `ProjectStorage`; a fresh install migrates the old
  `prompts.json` shape once as a starting seed.
- Verified against the actual shipped module (not a re-implementation):
  bundled `Promptstore.ts` with esbuild and ran it under Node twice as
  separate processes with a disk-backed `localStorage` polyfill -
  covered create/edit/delete, 120-prompt scale, order preservation,
  and a simulated restart restoring the library exactly.
- Left the Job Queue list and `QueueRunner`/`ChatGPT.ts` automation
  untouched; `onAdd` was changed to seed a new job from the selected
  library prompt's text so Start Queue still submits it through the
  same unmodified pipeline.

### Disable automatic DevTools opening

- Searched the repo for every `openDevTools`/`debugger.attach`/
  `inspectElement` call site; found exactly two automatic ones:
  `electron/main.ts` (`win.webContents.openDevTools()`, unconditional
  in `createWindow()`) and `Browser.tsx` (`webview.openDevTools()` on
  every `dom-ready`). Removed both.
- Added a single `DEVTOOLS_ENABLED` env flag (default off). When true
  it only makes manual opening possible (default F12/Ctrl+Shift+I
  shortcut) for both the main window and the ChatGPT `<webview>` guest
  (gated via a `will-attach-webview` hook); DevTools never auto-open
  either way.
- This is very likely the fix for the previously-deferred "gray CDP
  cursor artifact" (ROADMAP had already identified unconditional
  `openDevTools()` as the suspected cause) - not re-verified visually
  yet, worth a quick look next time the app is run interactively.
- Verified: `npm run dev` with the flag unset shows no
  `devtools://` console noise (present before the fix); with the flag
  set to `true` the app still starts normally with no auto-open either.

### Job-first architecture pivot (this session)

- Documented in ROADMAP.md before writing any code, per instruction.
  Job becomes the primary object (one independent ChatGPT session,
  owning its own uploaded image / selected prompt / status / result);
  Prompt Library becomes a reusable template collection only.
- See ROADMAP.md "Architecture Change - 2026-08-02: Job-first" for the
  full rationale and the P1 task breakdown for this work.

**Implementation:**

- `Job` (`src/types/Job.ts`) gained two additive optional fields,
  `uploadedImagePath` and `selectedPromptId` - every existing field
  QueueRunner reads/writes (`prompt`, `status`, `imagePath`,
  timestamps) is untouched, so old persisted Project data still loads.
- `JobService.ts` gained `setJobPrompt()` (copies a template's text
  onto a job + records which template it came from) and
  `setJobUploadedImage()` (attach/clear a job's reference image);
  `createJob()`'s default prompt changed from `"New Prompt"` to `""`
  since prompt text is now assigned via template selection, not typed
  inline.
- New `src/components/Job/JobList.tsx` + `JobDetail.tsx`: JobList is
  now the primary navigation (status + short label, Create/Delete).
  JobDetail is the per-Job session view - upload image (drag/drop or
  click, stored as a data: URL, no new IPC/disk plumbing), select
  prompt (dropdown sourced from PromptStore), Generate, a status
  badge, and the job's own result image.
- `Prompt.tsx` stripped down to just `PromptLibrary` + `PromptEditor`
  (template CRUD) - the job-queue list that used to live in the same
  file is gone, replaced by JobList/JobDetail.
- Deleted `ImageDrop.tsx`/`ImageDrop.css` - the global gallery's job
  was fully superseded by each Job showing its own result inline.
- `Workspace.tsx`: added `onGenerateJob(jobId)`, which builds a
  synthetic one-job "view" of the current tab's Project, feeds it
  through the **exact same, unmodified** `runQueue()`, and merges each
  `setProject` update back onto the real job by id. `QueueRunner.ts`
  and `ChatGPT.ts` have a verified zero-line diff from before this
  change - the tab-wide "Start Queue" bulk path (Toolbar's Generate
  button) is untouched and still calls `runQueue` directly against the
  whole tab, same as always.
- Known, deliberate limitation: "Upload Image" is UI/data-only for
  now. The automation engine was explicitly not touched this round, so
  it still only submits the text prompt - it does not attach a job's
  uploaded image into ChatGPT's composer. Tracked in ROADMAP P3.

**Verification:**

- `npx tsc --noEmit`, `npm run lint` (project's real `--max-warnings 0`
  gate), and `npx tsc && npx vite build` all clean.
- Confirmed via `git status`/diff that `QueueRunner.ts`, `ChatGPT.ts`,
  `Job.ts`'s pre-existing fields, and the image-generation IPC in
  `electron/main.ts` have no changes from this pivot.
- No GUI-automation tool available this session, so the new
  `onGenerateJob` merge-back logic was verified against the real
  `JobService` module directly (bundled with esbuild, run under plain
  Node): built a 3-job tab, ran the same setProject sequence
  QueueRunner produces (mark running -> mark done + imagePath) through
  the scoped-project adapter, and confirmed only the targeted job
  changed while its siblings and the job order stayed untouched.
  `setJobPrompt`/`setJobUploadedImage` were verified the same way.
- `npm run dev` starts cleanly with the new JobList/JobDetail/Prompt
  layout, no console errors.
- Not done: clicking through the actual running app by eye (upload a
  real image, pick a template, click Generate, watch it drive the
  real ChatGPT webview end to end) - worth a manual pass before
  relying on this in production use.

---

## Session 3 (2026-08-03): Two P0 fixes on the Job-first architecture

Two P0 issues were found blocking the Job-first architecture that
shipped in Session 2: all Jobs shared one ChatGPT webview/session, and
a Job's uploaded image never actually reached ChatGPT. UI layout was
explicitly not to be touched - only these two issues.

### P0-1: Independent ChatGPT Sessions per Job

- `Browser.tsx` was a single `<webview>` shared by every Job, one fixed
  partition (`persist:gpt-image-studio`) for the whole app - the root
  cause of Jobs affecting each other's conversations.
- Rewrote it into a pool: one `<webview>` per Job (across every tab,
  not just the current one), each on its own persistent partition
  (`persist:gpt-image-studio-job-<jobId>`). Every Job's webview stays
  mounted permanently and is only hidden via CSS when its Job isn't
  the active one - never torn down - so switching back to a Job shows
  its session exactly as it was left, not a fresh reload.
- The exposed ref changed from a single `BrowserHandle` to a
  `BrowserPoolHandle.getHandle(jobId)` registry. `QueueRunner`'s
  `runQueue()` now takes `getBrowser: (job) => BrowserHandle |
  undefined` instead of one fixed `browser`, resolving the correct
  webview at the top of each loop iteration - this is the one
  necessary change to the queue runner itself (routing, not the
  automation steps), and it's what makes the bulk "Start Queue" path
  correct too: each job in a tab-wide run now drives its own isolated
  session, not a shared one.
- `Workspace.tsx`: `browserRef` is now a `BrowserPoolHandle`; both
  `startQueue()` and `onGenerateJob()` pass a `getBrowser` resolver
  instead of a fixed handle; a new `allJobs` (flatMap across all tabs)
  feeds the Browser pool so no Job's session is ever unmounted by a
  tab switch.

### P0-2: Image Upload Integration

- The generation pipeline per Job is now: activate Job (resolve its
  webview) -> upload its image into ChatGPT (skipped if none) -> wait
  for the upload to complete -> insert prompt -> click send -> wait
  for the generated image -> download -> verify on disk -> mark done.
  Only the first two new steps were added; everything from "insert
  prompt" through "mark done" - including all download logic - is
  byte-for-byte unchanged.
- New `buildUploadImageScript(dataUrl)` in `ChatGPT.ts`: there's no CDP
  access from inside `executeJavaScript`, so a file input's `.files`
  can't be set directly. It rebuilds the *exact* uploaded image (the
  same data: URL shown in the Job's own upload preview, never a
  re-encoded copy) into a real `File`, wraps it in a `DataTransfer`,
  and dispatches a `dragenter`/`dragover`/`drop` sequence at the
  composer - the same path a user dragging a file in would trigger.
- New `buildWaitUploadScript()`: polls for a new `<img>` appearing in
  the composer's container as the completion signal, bounded timeout.
- **Caveat, unlike the download-button selectors:** this was not
  verified via live CDP tracing against the real chatgpt.com DOM the
  way the earlier download-flow fixes were - it's a best-effort,
  generic heuristic (structural: "a new image showed up near the
  composer"), not confirmed selectors. Treat as unverified until
  exercised against the live site; the selectors may need adjustment.
- Prompt Library and the download/verify/close portion of the pipeline
  were both explicitly left untouched, per instruction.

**Verification:**

- `npx tsc --noEmit`, `npm run lint` (`--max-warnings 0`), and
  `npx tsc && npx vite build` all clean.
- Confirmed via `git diff` that everything from `buildPromptScript`
  onward in `ChatGPT.ts`, and everything from "Insert Prompt" onward
  in `QueueRunner.ts`'s loop, is unchanged - the two new script
  builders are pure additions, the loop only gained a browser-resolve
  step and an optional upload block ahead of the untouched send/
  download/verify/close sequence.
- The two new injected scripts (`buildUploadImageScript`,
  `buildWaitUploadScript`) were bundled with esbuild and parsed with
  Node's `vm.Script` to confirm they're syntactically valid JS (can't
  exercise `document`/`DataTransfer`/`fetch` outside a real browser,
  so this only catches syntax errors, not DOM-behavior correctness).
- `npm run dev` starts cleanly with the multi-webview pool, no console
  errors.
- Not done, and important: actually opening 2+ Jobs in the running app
  and confirming each keeps its own independent ChatGPT conversation,
  and running a real Job with an uploaded image to confirm it lands in
  ChatGPT's composer and the upload-detection heuristic actually fires
  - both need a live human pass before relying on this.

### P0-1 correction: shared login, per-Job conversations (not per-Job browsers)

The P0-1 fix above was wrong: giving every Job its own Electron
partition made each one a fully separate browser profile - separate
cookies, separate localStorage, a separate ChatGPT login required per
Job. That's not what "independent ChatGPT session" meant - it meant
independent *conversations* under one shared login.

- Reverted `Browser.tsx` to a single `<webview>` on one fixed
  partition (`persist:gpt-image-studio`) - the `BrowserPoolHandle`/
  per-Job-partition pool from the first P0-1 pass is gone entirely
  (verified: no `BrowserPoolHandle`/`gpt-image-studio-job-`/
  `getHandle(` left anywhere in `src/`).
- `Job` gained `conversationUrl?: string` - the ChatGPT conversation
  URL (`https://chatgpt.com/c/<id>`) this Job's own conversation lives
  at, captured once after its first successful send.
- `BrowserHandle` gained `loadURL(url)` and `getCurrentUrl()`.
  `QueueRunner`'s "Activate Job" step now navigates the one shared
  webview to `currentJob.conversationUrl ?? CHATGPT_HOME_URL` (fresh
  new chat) instead of resolving a separate webview, then waits for
  the composer to be ready (a new, necessary step - the shared webview
  now actually navigates between conversations, which it never used to
  do, so the composer isn't guaranteed to exist the instant navigation
  resolves). Right after a successful send, if the Job didn't already
  have a `conversationUrl`, it polls `getCurrentUrl()` for a real
  conversation URL and stores it - once. A Job that already has one
  just reuses it on every later run.
- `Workspace.tsx`: switching the selected Job now navigates the shared
  webview to that Job's `conversationUrl` (or `CHATGPT_HOME_URL`) via a
  `useEffect` keyed only on `selectedJobId` (a `projectRef` mirror lets
  it read fresh job data without depending on `project` itself, which
  would otherwise re-navigate on every unrelated status update during a
  run).
- Prompt Library and the actual upload/prompt/download automation
  scripts were not touched - only the routing/navigation layer around
  them, plus the one new `buildWaitComposerReadyScript`.

**Verification:**

- `npx tsc --noEmit`, `npm run lint` (`--max-warnings 0`), `vite build`
  all clean.
- Grepped `src/` for `BrowserPoolHandle`/`gpt-image-studio-job-`/
  `getHandle(` - zero matches; grepped for `persist:gpt-image-studio`
  - exactly one occurrence, the single shared partition.
- The new routing logic (targetUrl decision + one-time capture) was
  verified against the real `JobService` module (same esbuild+Node
  approach as before): a fresh job activates to `CHATGPT_HOME_URL`,
  capturing its conversation URL after a simulated send makes it
  reuse that URL on every later activation, and a second job's
  capture never leaks onto the first - each keeps its own URL,
  switching between them restores the right one every time.
  `buildWaitComposerReadyScript` was bundled and parsed with Node's
  `vm.Script` to confirm it's valid JS.
- `npm run dev` starts cleanly, no console errors.
- Still not done: logging into ChatGPT for real in the running app and
  confirming (1) login happens once, (2) creating a new Job never
  prompts for login again, (3) switching Jobs visibly restores the
  right conversation. This needs a live human pass - the routing logic
  is verified, but "does the real chatgpt.com URL scheme still look
  like /c/<id>" and "does the composer-ready selector actually work"
  are unverified assumptions, same caveat as the upload heuristic.

### Session wrap-up: live upload-pipeline investigation, stopped mid-diagnosis

User asked to focus only on the image-upload runtime error (Job goes
straight to Error after selecting an image and clicking Generate), with
Job architecture / Prompt Library / session handling / conversation
routing / download logic explicitly off-limits. Session was cut short
before reaching a confirmed root cause or fix - documenting exact state
so tomorrow can resume without re-deriving it.

**Instrumentation added (kept - this is logging only, not a behavior
change):**

- `ChatGPT.ts`: `buildUploadImageScript` and `buildWaitUploadScript`
  now log a clearly numbered step (`[Step 3/10]` locate upload target,
  `[Step 4/10]` build File + dispatch drag/drop, `[Step 5/10]`/
  `[Step 6/10]` wait for/confirm the upload preview), and on failure
  return a rich payload (`step`, `stepName`, `selector`, `domSnapshot`,
  `reason`) via a new shared `domSnapshot()` snippet (composer
  presence, composer HTML, image count in the composer, any
  `input[type=file]` elements present, current URL).
- `QueueRunner.ts`: every one of the requested 10 pipeline steps
  (Job activated -> composer ready -> upload target found -> image
  injected -> upload preview detected -> upload completed -> prompt
  inserted -> send enabled -> send clicked -> generation detected) now
  logs a `[Pipeline] Step N/10: OK|FAILED - ...` line, forwarding the
  selector/domSnapshot/reason from the scripts above on failure. Steps
  7-10 (prompt/send/generation) got logging only - `buildPromptScript`/
  `buildWaitImageScript` themselves are untouched.
- Temporarily added `remote-debugging-port` to `electron/main.ts` to
  drive the app live via CDP (same technique as the original
  download-flow investigation) - **reverted before this commit**, not
  shipped.

**Live investigation findings so far (real run, real login, real
ChatGPT account - not simulated):**

- Confirmed the login is already persisted in the shared partition
  from earlier sessions (real conversation history visible) - no login
  prompt encountered.
- Drove the real app via CDP: created a Job, injected a real test PNG
  into the hidden upload `<input>` via `DOM.setFileInputFiles` (not a
  native dialog - CDP's standard mechanism for this), selected a
  Prompt Library template, clicked Generate.
- **A Job with no uploaded image ran the entire pipeline successfully**
  end to end (prompt inserted, sent, image generated, downloaded,
  verified on disk, marked done) - confirms the send/download/verify
  path QueueRunner already had is still fully intact.
- **Every Job with an uploaded image failed at Step 4/10
  ("image-injected")** - consistent with the user's bug report. The
  exact `reason` string was not yet captured with full detail (first
  capture pass only recorded `Object` placeholders instead of the
  resolved payload) - a second, corrected capture pass was in progress
  when the session was stopped. Leading (**unconfirmed**) hypothesis:
  `buildUploadImageScript`'s `await fetch(dataUrl)` may be blocked by
  ChatGPT's page CSP (`connect-src` typically doesn't whitelist `data:`
  fetches) - this is a guess pending tomorrow's confirmed log capture,
  explicitly not treated as verified.
- Separately discovered a process-hygiene problem while doing this:
  stopping a background `npm run dev` task (via TaskStop) does **not**
  reliably kill the spawned `electron.exe` child - five stray instances
  had accumulated across the session's testing before this was caught
  and force-killed. `app.requestSingleInstanceLock()` did not appear to
  prevent this. This is a plausible contributing factor (not confirmed)
  to the user's separately-reported observation that "Tabs still
  mirror the same ChatGPT conversation" / Jobs not truly isolated -
  multiple live instances contending for the same
  `persist:gpt-image-studio` partition and the same localStorage-backed
  Project state would produce exactly that kind of cross-contamination
  symptom. **First thing to check tomorrow**: confirm only one
  `electron.exe` is running before doing any Job-isolation testing.

**Current runtime status:**

- `npx tsc --noEmit`: clean.
- `npm run lint` (`--max-warnings 0`): clean.
- `npm run build` (`tsc && vite build && electron-builder`): `tsc` and
  `vite build` both succeed for renderer + electron main/preload;
  `electron-builder`'s final packaging step still fails on this machine
  for the same pre-existing reason as every prior session (needs
  Windows Developer Mode or admin rights to extract bundled macOS
  code-signing tools via symlink - not a code defect, unrelated to
  today's changes).
- The temporary CDP remote-debugging switch was removed from
  `electron/main.ts` before this commit.

**Known issues (open, carried into tomorrow):**

1. **P0-1, regressed**: despite the shared-partition/conversationUrl
   correction landing, the user reports Tabs still mirror the same
   ChatGPT conversation and Jobs are not truly isolated. Root cause not
   yet confirmed - the stray multi-instance discovery above is a
   plausible contributor but unverified; the conversationUrl
   capture/routing logic itself was only verified against a simulated
   `JobService`, never against a real multi-Job run end to end.
2. **P0-2, upload pipeline broken**: Job goes to Error immediately
   after Generate when an image is attached. Instrumented (see above)
   but the exact failure reason string was not yet captured before the
   session ended - `fetch(dataUrl)`-blocked-by-CSP is a lead, not a
   confirmed cause.

**Next debugging targets for tomorrow:**

- Before anything else: verify exactly one `electron.exe` process is
  running.
- Re-run the CDP-driven upload test (scripts left in the session's
  scratchpad, not part of the repo) with the object-detail capture fix
  already in place, and read the actual `reason`/`domSnapshot` for the
  Step 4/10 failure instead of guessing.
- Investigate the Job-isolation regression with a clean single-instance
  run: create two Jobs, generate on each, confirm they end up with two
  different `conversationUrl` values and that switching between them in
  the UI actually shows two different ChatGPT conversations.

---

## Session 4 (2026-08-03): Prompt Library modal redesign, automatic Job
naming, and the upload pipeline bug finally fixed (confirmed live)

Scope for this session, per instruction: UI refinement (Prompt Library
becomes a titles-only list + modal, Job Detail drops the full prompt-text
preview in favor of a dropdown, Jobs are automatically named/renamed from
their selected Prompt) plus resuming yesterday's cut-short upload
investigation. Job model, PromptStore persistence mechanics, download
automation, session/login handling, and the core queue pipeline were
explicitly not to be redesigned.

### Prompt Library: titles-only list + Create/Edit modal

- `PromptEditor.tsx` (the always-visible inline editor) is gone entirely
  - replaced by `PromptModal.tsx`, opened from `PromptLibrary.tsx`'s
    title rows or its new "+ New Prompt" footer button. Same modal
    component serves both Create ("New Prompt" title, Save/Cancel) and
    Edit ("Edit Prompt" title, Save/Delete/Cancel, `window.confirm`
    before delete) - mode is just a prop.
  - `PromptLibrary.tsx` now renders titles only, nothing else.
  - `Prompt.tsx` owns which-prompt-is-being-edited as local state (was
    previously threaded down from `Workspace.tsx` as
    `selectedPromptId`/`selectedPrompt`) - `Workspace.tsx` lost that
    state and its `onSelectPrompt`/`onNewPrompt` handlers, since nothing
    outside the Prompt Library needs to know which prompt is mid-edit
    anymore. `PromptStore` itself (create/update/remove + localStorage
    persistence) is untouched.

### Job Detail: dropdown only, no full prompt text

- Removed the `.job-prompt-preview` block that echoed the selected
  prompt's full text under the dropdown. The dropdown itself (already
  wired to `onSelectPrompt` -> `JobService.setJobPrompt`) is unchanged.

### Automatic Job naming (no manual rename)

- `Job` gained a required `title: string` (both `defaultJobs.ts` seed
  files updated to match). `JobService.createJob()` defaults it to
  `"New Prompt"`.
- `JobService.setJobPrompt()` now also computes the Job's `title`: the
  selected Prompt's own title, or `"<title> (N)"` if N-1 sibling Jobs in
  the same tab already have that same `selectedPromptId` (counted fresh
  on every call, so re-selecting the same prompt on the same Job is
  idempotent - it doesn't drift upward). `JobList.tsx` now renders
  `job.title` directly instead of slicing `job.prompt`.

### Verification (Prompt Library / Job Detail / naming)

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- Live-driven, not just typechecked: launched the app with a temporary
  `--remote-debugging-port` (reverted before this commit, same
  established technique as prior sessions) and drove the actual running
  main-window renderer via raw CDP `Runtime.evaluate` calls (no ChatGPT
  login needed for this part) - clicked through the real UI exactly as a
  user would: opened the New Prompt modal, created a prompt, confirmed
  the Library refreshed immediately; opened it again in Edit mode,
  confirmed the fields were pre-filled, edited it, confirmed the Library
  updated; deleted it (auto-accepting the real `window.confirm` dialog
  via CDP's `Page.javascriptDialogOpening` -> `handleJavaScriptDialog`),
  confirmed it disappeared. Created two Jobs and selected the same
  Prompt on both - confirmed the first became `"<title>"` and the second
  `"<title> (2)"`, and that `.job-prompt-preview` no longer exists in the
  DOM. 17/17 scripted checks passed.
- Restarted the app (killed and relaunched) and re-checked: the deleted
  prompt stayed deleted - `PromptStore`'s persistence survives a real
  restart, as required. (Separately noticed Job/Project state itself did
  *not* survive a hard `taskkill /F` in one restart attempt - traced to
  a pre-existing ~18MB `localStorage` entry, an old test Job carrying a
  full base64 JPEG in `uploadedImagePath` from months-old testing, plus
  Chromium's write-to-disk for `localStorage.setItem` not being
  synchronous - a hard kill can race an in-flight large write. Not
  caused by this session's changes, not in this session's required
  scope (only Prompt-restart-persistence was), left as-is and flagged
  here rather than silently ignored.)

### Upload pipeline: root cause found and fixed (two real bugs, both
confirmed live, neither guessed)

Resuming yesterday's cut-short investigation. Reused the same
diagnostic technique as prior sessions (temporary
`--remote-debugging-port`, reverted before commit) but went further:
instead of driving the app's UI to reach the upload code path,
connected CDP directly to the real `chatgpt.com` guest target and ran
the exact production `buildUploadImageScript`/`buildWaitUploadScript`
functions (bundled straight from `ChatGPT.ts` with esbuild, not
reimplemented) against a real test image - isolating the upload logic
itself from Job/React/webview plumbing entirely.

**Bug 1 - confirmed:** `buildUploadImageScript`'s `await
fetch(dataUrl)` throws `TypeError: Failed to fetch` on the real page -
ChatGPT's CSP blocks it, confirming yesterday's leading-but-unconfirmed
hypothesis. Fixed by decoding the base64 payload directly via `atob()`
into a `Blob`/`File`, which never touches the network and so isn't
subject to `connect-src` at all.

**Bug 2 - found only after fixing Bug 1, also confirmed live:** with
Bug 1 fixed, the drag/drop simulation onto the composer form turned out
to be non-deterministic - two identical live runs from the same
starting state produced two different real outcomes (one silently
never attached the file, the other triggered ChatGPT navigating to a
brand-new conversation URL mid-upload). Live DOM inspection
(`domSnapshot`) revealed ChatGPT's composer already renders its own
real `<input type="file" id="upload-photos" accept="image/*">` (used by
its native "add photos" button) - switched the injection to set
`.files` on that real input via a `DataTransfer` (the standard,
spec-supported way to script a file input) and dispatch `change`, which
was reliable across every subsequent run.

**Bug 3 - found while confirming Bug 2's fix, also confirmed live:**
`buildWaitUploadScript` compared "current image count in the composer"
against a "baseline" - but that baseline is captured at the *start of
its own, separate* `executeJavaScript` call, which in production always
runs *after* `buildUploadImageScript`'s call already completed. If the
thumbnail rendered before this second call started (the common case),
the baseline already included it, so the ">" comparison could never be
true - a structural bug, not a selector problem. Also confirmed live
that `fileInput.files` gets cleared by ChatGPT's own code right after
it ingests the file (`inputFilesLength: 0` immediately after a
successful upload), ruling that out as a completion signal too. Live
DOM capture of an actually-successful upload showed ChatGPT renders the
attached file as `<img src="https://chatgpt.com/backend-api/estuary/
content?id=...">` with `aria-label="파일 2 제거: cdp-diag-test.png"`
("Remove file: cdp-diag-test.png") - the exact same host/path pattern
`ChatGPT.ts` already trusts elsewhere for generated images
(`GENERATED_IMAGE_SELECTOR`). Rewrote the wait to poll for
`img[src*="/backend-api/estuary/content"]` inside the composer directly
instead of any baseline-count comparison.

**Live verification (real account, real chatgpt.com, not simulated):**
ran the fixed `buildUploadImageScript` -> `buildWaitUploadScript` pair
twice from a fresh "new chat" state - both times: control found, file
injected, real ChatGPT-hosted thumbnail detected, "upload completed".
Then, on the second run, also ran the existing (unmodified)
`buildPromptScript` against that same uploaded-image conversation:
prompt inserted, send button clicked, message accepted
(`acceptedBy: "textarea-empty"`) - confirms the fix doesn't just inject
the file but that the existing, untouched send/prompt-insertion path
still works correctly with an image attached. (This did send one real
test message - `"say hi in exactly 2 words"` with a 1x1 test PNG - into
a real, new ChatGPT conversation; not cleaned up, left for the user to
delete if desired.) Download/prompt-insertion/image-detection code was
not modified, per instruction - only `buildUploadImageScript` and
`buildWaitUploadScript` changed.

### Final verification (whole session)

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- `git diff --stat electron/main.ts`: empty - the temporary
  `--remote-debugging-port` switch used for both halves of this
  session's live verification was fully reverted before this commit,
  confirmed via diff, not just by memory.
- Every finding in this session (the CSP-blocked fetch, the
  non-deterministic drag/drop, the stale-baseline wait bug, the real
  file-input/thumbnail selectors) came from live CDP capture against
  the real `chatgpt.com` DOM - none were guessed.

---

## Session 5 (2026-08-03): Stabilization pass - 3 reported bugs, 1 real
root cause found and fixed, 2 could not be reproduced

Scope for this session: fix ONLY the three reported runtime bugs below,
no redesign/refactor, no new features, download pipeline / Prompt
Library / Settings untouched. Verified each live in the running
Electron app before moving to the next, per instruction.

### Environment note that shaped this whole session

The dev app kept exiting on its own, unprompted, roughly every 1-3
minutes throughout this session. Traced (via Windows Application Error
event log - no faulting module recorded, so not a native crash) to
**stray `electron.exe`/`node.exe` processes from repeated test
relaunches fighting over the same `--remote-debugging-port 9222`,
`localhost:5173`, and userData cache directory** (`bind() returned an
error`, `Unable to create cache` in the raw process log once actually
inspected) - the exact process-hygiene issue Session 3's WORKLOG had
already flagged, now confirmed as the direct cause of several
mid-session false leads (see Bug #3 below). Fully killing every
`electron.exe`/`node.exe` before each relaunch eliminated it. This is
almost certainly specific to how this session repeatedly relaunched the
app for testing, not something the end user would necessarily hit
running the app normally - noted here rather than silently ignored.

### Bug #1 (reported): Job title not updating after selecting a Prompt

**Could not reproduce.** Re-verified the exact code path from the prior
session (`JobDetail.tsx`'s `<select>` -> `Workspace.onSelectJobPrompt`
-> `JobService.setJobPrompt`) is unchanged and correct, then drove it
live twice against a clean app instance: (1) create a Job, select a
Prompt - title updated immediately and correctly; (2) select a
*different* Prompt on an already-selected Job - title updated correctly
again, no staleness. Both PASS. No code changed for this bug - the
logic already does exactly what was expected. Most likely explanation
given the environment note above: an interaction landed on a silently-
dead window and looked like nothing happened.

### Bug #2 (reported): Prompt never inserted after a successful upload

**Could not reproduce.** Drove the actual production pipeline end to
end (not a bypassed script call this time): created a Job via the real
UI, attached a real file via `DOM.setFileInputFiles` on the app's own
upload `<input>`, selected a Prompt, clicked the real Generate button,
and captured console output from both the main renderer and the
ChatGPT guest simultaneously. Full sequence observed: upload injected ->
upload preview detected -> upload completed -> **prompt inserted -> send
button enabled -> send clicked -> message accepted**. The job did end in
`error`, but at the **download** step (`download button not found`,
empty candidate list) - explicitly out of scope per instruction ("Do
NOT modify the download pipeline"), not the prompt-insertion step the
bug report described. No code changed for this bug.

### Bug #3 (reported, confirmed real): switching Jobs does not restore
that Job's own conversation

**Root cause found and fixed**, live-verified, not guessed.

Added the requested instrumentation first (`Workspace.tsx`'s Job-switch
effect now logs `[JobSwitch] activating job` with jobId/conversationUrl/
currentBrowserUrl/targetUrl, and `[JobSwitch] navigation complete` with
the resulting URL). Live testing with this instrumentation showed the
switch-navigation effect itself was firing correctly and calling
`loadURL()` with the right target every time - the bug was **upstream**,
in what URL gets captured as a Job's `conversationUrl` in the first
place:

- `QueueRunner.ts`'s `waitForConversationUrl()` polls the webview's URL
  after Send and accepts the first one matching `/\/c\//`. Live capture
  showed ChatGPT briefly routes to a **client-side-only placeholder URL**
  immediately after Send, of the form `/c/WEB:<client-generated-id>`,
  before the server assigns and swaps in the real permanent id (a plain
  `/c/<uuid>`, no `WEB:` prefix). The old regex matched the placeholder
  on its very first poll and returned immediately, so Jobs were having
  this placeholder saved as their `conversationUrl`.
- Confirmed live, directly: navigating to a captured `/c/WEB:...` URL
  redirects to `https://chatgpt.com/` (the home/new-chat page) within
  about a second - **indistinguishable from a Job that never
  generated**, which is exactly the reported symptom ("Job B shows
  exactly the same conversation as Job A" - both were actually showing
  the same *fresh new chat*, not literally the same conversation).
- Fix: `waitForConversationUrl()` now explicitly skips `/c/WEB:` URLs
  and keeps polling until a real one appears (`/\/c\//.test(url) &&
  !/\/c\/WEB:/.test(url)`), with a log line either way (`skipping
  client-side placeholder URL` / `real conversation URL captured`) so
  this is visible on every future run, not just this diagnostic.
- **No change to login/session/partition handling** - still exactly one
  shared `<webview>`, one shared partition, one shared login, per
  instruction. Only which URL gets *recorded* as a Job's conversation
  changed.

**A mid-session false lead worth recording:** an early version of this
test (before the process-hygiene issue above was understood) produced a
`Cannot read properties of undefined (reading 'click')` DOM error and
wildly inconsistent job counts between consecutive queries against what
was assumed to be the same running instance - actually two different
stray processes both listening/half-listening on the debug port at
once. Fully killing all `electron.exe`/`node.exe` and relaunching once
resolved it; the subsequent clean, single-instance runs were fully
reproducible and consistent.

**Live verification (real account, real chatgpt.com):**
1. Before the fix: Job A generated for real, captured
   `.../c/WEB:2294c1ba-...` as its `conversationUrl`. Switching to Job B
   correctly showed a different (fresh) page. Switching back to Job A:
   the webview briefly showed the *correct* target URL at +500ms/+1000ms,
   then silently reverted to `https://chatgpt.com/` by +2000ms - matching
   the direct-navigation redirect test above almost exactly. **FAIL**,
   confirmed live before touching any code.
2. After the fix: Job A generated for real (log shows the placeholder
   URL skipped ~10 times, then the real `/c/6a6fedb9-...` URL captured
   and saved - this run also happened to complete the full pipeline
   including download, unlike the flaky run in Bug #2's test). Switching
   to Job B showed a different page; switching back to Job A restored
   the exact correct URL, stably, checked at +500ms through +5000ms and
   across two more A/B round-trips. **PASS**, every time.

### Files modified this session

- `src/components/Queue/QueueRunner.ts` - `waitForConversationUrl()`
  fix (Bug #3) plus its new log lines. Nothing else in this file
  touched.
- `src/components/Workspace/Workspace.tsx` - added `[JobSwitch]`
  logging to the existing Job-switch navigation effect (instrumentation
  only, no behavior change - the effect's logic is byte-for-byte the
  same, just wrapped with `console.log` before/after).
- No other files changed this session. Prompt Library, Settings, the
  download pipeline, and every other part of the app are untouched.

### Verification (whole session)

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- `git diff --stat electron/main.ts`: empty - the temporary
  `--remote-debugging-port` switch was reverted before this commit,
  confirmed via diff.
- All three bugs were tested against the live, real Electron app with a
  real ChatGPT login (not simulated) per instruction; Bug #3's fix was
  verified with a full generate -> switch -> switch-back cycle,
  multiple times.

### Remaining known issues (not fixed, out of scope this session)

- **Download step is flaky**: one live run this session hit "download
  button not found" (empty candidate list) on a job that otherwise
  completed the entire pipeline correctly; a later run of the same kind
  of job completed the download successfully. Explicitly out of scope
  ("Do NOT modify the download pipeline") - flagged for a future
  session, not investigated further here.
- **Job/Project `localStorage` persistence across an abrupt process
  kill** remains unreliable for large payloads (see Session 4) - not
  touched this session either, still a real gap if the app is ever
  force-killed mid-write.
- The app's tendency to exit unexpectedly when several instances
  accumulate (see the environment note above) was worked around, not
  fixed - there's no code change in this repo that would prevent it,
  since it's caused by how this session repeatedly relaunched the app
  for testing rather than anything the shipped app does to itself.

---

## Session 6 (2026-08-03): fixed prompt insertion for real, then a
deliberate architecture change - one persistent WebView per Job

### Part 1: Prompt insertion (Bug #1) - the real fix, this time verified
against actual sent message content, not log return values

Session 5's live-log-based verification of prompt insertion turned out
to be a false positive - `buildPromptScript` reported `success: true,
acceptedBy: "textarea-empty"` even when no text was actually sent.
Re-investigated from scratch per instruction: reproduce visually first,
don't trust logs.

- **Reproduced live, visually**: a real screenshot of the running app
  showed ChatGPT's actual reply - *"I received the uploaded image, but
  it appears to be a 1×1 pixel file with no visible content... tell me
  what you'd like to help with"* - proof no prompt text arrived, despite
  the pipeline logging every step as successful.
- **Root cause, found by instrumenting the real insertion code**:
  ChatGPT's composer is a ProseMirror-based rich-text editor.
  `buildInsertPromptTextSnippet` manually mutated the DOM (`innerHTML`,
  a synthetic `beforeinput`/`input` `InputEvent`), which fools two
  superficial signals - the composer visibly shows the text, and
  ChatGPT's send button appears/enables - but ProseMirror's own internal
  transactional document model (what Send actually reads) never
  registers a synthetic `InputEvent` with no real native
  `getTargetRanges()` data. Confirmed by checking the *actual rendered
  message text* after send, not the script's return value: empty, every
  time, with the raw-DOM-mutation approach.
- **Fix**: replaced the DOM mutation with a simulated `paste`
  `ClipboardEvent` carrying the prompt as `text/plain`. ChatGPT's real
  paste-handling pipeline runs this through ProseMirror's normal
  transaction system. Verified live, repeatedly, including through the
  exact production call sequence (`buildUploadImageScript` ->
  `buildWaitUploadScript` -> `buildPromptScript`, called separately just
  like `QueueRunner.ts` calls them): the actual sent message now
  contains the real prompt text, and a real screenshot of the running
  app shows the message bubble with the correct text and a completed
  generation.
- File modified: `src/components/Browser/ChatGPT.ts`
  (`buildInsertPromptTextSnippet`) only.
- Bug #2 (Job title not renaming) and Bug #3 (Jobs sharing a
  conversation), also re-reported this session as still broken, were
  investigated but not reproduced under the architecture in place at the
  time - see Part 2, which replaces that architecture entirely and
  re-verifies both behaviors under the new one.

### Part 2: Architecture change - one persistent WebView per Job

After Part 1 landed, a joint architecture review (see the conversation
transcript, not reproduced here) concluded the single-shared-`<webview>`
design - however well the URL-capture bug was fixed - has a structural
ceiling: it can only guarantee Job isolation when Job interactions are
strictly serialized, because `Workspace.tsx`'s switch effect and
`QueueRunner.ts`'s per-job activation step both call `loadURL()`/
`execute()` on the *same* shared webview with no coordination between
them. Decision: adopt one persistent `<webview>` per Job, all on the
same partition (`persist:gpt-image-studio` - one login, unchanged),
instead of one shared webview navigated between conversations.

**`src/components/Browser/Browser.tsx` - rewritten as a WebView
registry (`BrowserPool`):**
- Keeps a `jobIds: string[]` state array; renders one `<webview
  partition="persist:gpt-image-studio">` per id in that array, each
  hidden via `style={{ display: jobId === activeJobId ? "inline-flex" :
  "none" }}` - a pure CSS show/hide, the DOM node itself is never
  touched by switching.
- New `BrowserPoolHandle` (replaces the old single-webview
  `BrowserHandle` as the ref surface): `ensure(jobId, initialUrl?)` -
  creates that Job's webview if it doesn't exist yet (adding it to
  `jobIds`, which mounts a new `<webview>`), waits for its `dom-ready`
  event, then - only if this is a *brand new* webview and `initialUrl`
  was given (a Job's saved `conversationUrl`) - navigates it there once;
  resolves with a `BrowserHandle` scoped to that Job's webview either
  way. Idempotent: calling `ensure()` again for a Job that already has a
  ready webview returns immediately, touches nothing. `get(jobId)` -
  synchronous lookup, never creates. `destroy(jobId)` - unmounts that
  Job's webview and clears all its bookkeeping (only called on Job
  delete).
- `BrowserHandle` itself (`execute`/`reload`/`goBack`/`goForward`/
  `loadURL`/`getCurrentUrl`) is unchanged in shape - each is now just
  bound to one specific Job's webview element instead of the single
  shared one, so `QueueRunner.ts`'s actual script-execution code needed
  no changes at all.
- Ref-callback pitfall avoided deliberately: an inline arrow function
  passed as `ref={el => ...}` gets a new identity every render, which
  makes React tear down and re-attach the ref on every re-render even
  though the underlying DOM node hasn't changed - this would have
  re-run the `dom-ready` wiring repeatedly. Fixed by caching one stable
  ref-callback per jobId in a `Map`, created once on first appearance.

**`src/components/Queue/QueueRunner.ts`:**
- `QueueRunnerOptions.browser: BrowserHandle` replaced with
  `getBrowser: (job: Job) => Promise<BrowserHandle>`.
- The old "Activate Job" step (`await browser.loadURL(targetUrl)`)
  is gone - navigation now only ever happens once, inside
  `BrowserPool.ensure()`, at webview-creation time. Step 1 now just
  resolves `const browser = await getBrowser(currentJob)` and proceeds;
  Step 2 (composer-ready) is unchanged and still necessary, since a
  freshly-created webview isn't guaranteed to be finished loading the
  instant `ensure()` resolves.
- Every other step in the loop (upload, prompt insertion, send, wait
  for generation, download, verify, close viewer) is unchanged - they
  already just called `browser.execute(...)` on whatever `browser` was
  in scope, so resolving a different (per-job) handle per iteration
  required no changes below Step 1.

**`src/components/Workspace/Workspace.tsx`:**
- `browserRef: RefObject<BrowserHandle>` -> `browserPoolRef:
  RefObject<BrowserPoolHandle>`; `<Browser ref={browserRef} />` ->
  `<BrowserPool ref={browserPoolRef} activeJobId={selectedJobId} />`.
- The Job-switch `useEffect` no longer navigates anything - it now only
  calls `browserPoolRef.current.ensure(selectedJobId,
  job?.conversationUrl)`, which is a no-op if that Job's webview already
  exists. Visibility is driven entirely by the `activeJobId` prop.
- `startQueue()` and `onGenerateJob()` now pass `getBrowser: job =>
  browserPoolRef.current!.ensure(job.id, job.conversationUrl)` into
  `runQueue()` instead of a fixed `browser` handle - this is what lets a
  tab-wide "Start Queue" run correctly create/resolve a different
  webview for each job in the queue as its turn comes up.
- `onDeleteJob()` now also calls `browserPoolRef.current?.destroy(id)`.

**Nothing else changed** - Prompt Library, the Prompt modal, the
download pipeline, `ProjectStorage`/persistence, and Settings were not
touched, per instruction.

### WebView lifecycle

```
Job created (JobList "Create Job")
  -> no webview yet (lazy)

Job selected in JobList, OR Job's "Generate" clicked
  -> BrowserPool.ensure(jobId, job.conversationUrl)
       -> already has a ready webview?  return its handle, no-op
       -> otherwise: mount a new <webview partition="persist:gpt-image-studio">
            -> wait for "dom-ready"
            -> job.conversationUrl set (restored from a previous session)?
                 -> loadURL(conversationUrl) once
               else: stays on the default CHATGPT_HOME_URL (fresh chat)
            -> resolve BrowserHandle bound to this Job's webview

Switching to a different Job
  -> activeJobId prop changes -> CSS show/hide only
  -> ensure() called again for the newly-selected Job (no-op if already ready)
  -> the previously-active Job's webview is untouched, stays mounted, stays on its own page

Job deleted
  -> BrowserPool.destroy(jobId) -> that Job's <webview> unmounts, guest process torn down
```

### Memory management

Each activated Job now costs one real Chromium renderer process for its
webview (ChatGPT's full JS bundle, live connection, the works) - this
is the direct, accepted trade-off of "true concurrency, no shared
resource" that was discussed and chosen over the single-webview design.
Measured live this session with 5 Jobs activated (one main window +
five Job webviews): 8 `electron.exe` processes (main + GPU + one
renderer per activated webview, roughly), totaling **~1.6 GB** resident
memory for the whole app. That's roughly 250-300MB per active Job
webview on top of the fixed baseline - this will scale close to
linearly with how many distinct Jobs a user actually activates in a
session, and is the number to keep in mind for the ROADMAP's existing
"stress-test 5-10+ jobs" item. Webviews are never destroyed except on
Job delete, so a long session with many created-and-abandoned Jobs will
hold onto that memory until those Jobs are explicitly deleted - there is
no idle-eviction/LRU mechanism, by design (not requested, would add
real complexity around "is it safe to tear down a webview that might
still be mid-generation").

### Verification results (live, real Electron app, real ChatGPT account)

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- **Webview count tracks Job activation exactly**: 0 webview CDP targets
  right after boot (before any Job is touched - confirms lazy creation,
  no eager creation of anything); grew to exactly 1/2/3/4 as each of 4
  Jobs was created-and-selected in turn, confirmed via the CDP target
  list, not application logs.
- **Full 3-Job isolation test** (Portrait / Anime / Landscape, matching
  the requested verification): generated in Job A (Portrait) - captured
  a real `conversationUrl`. Switched to Job B (Anime) - Job A's webview
  target stayed on its own URL, untouched, confirmed via the CDP target
  list before and after. Generated in Job B - captured its own,
  *different* `conversationUrl`. Switched back to Job A - **zero**
  navigation-related log lines fired (`[JobSwitch]` only ever logged
  "ensuring webview for job", never any loadURL/navigation), and the CDP
  target list confirmed Job A's webview was still sitting on its
  original URL the entire time, Job B's webview on its own different
  URL - both simultaneously, both correct. A real screenshot of the
  running app after all of this shows Job A's own conversation
  ("Ultra realistic portrait, 8k, masterpiece" + the real generated
  image) exactly as it was left, with Job B's generation having had
  zero visible effect on it.
- **Regression check - upload + prompt insertion + download, now
  through a per-Job webview**: ran the full pipeline on Job C
  (Landscape) with an uploaded image - reached `status: "done"` with a
  populated `imagePath`. Independently verified (not trusting the
  pipeline's own success logs, per this session's Part 1 lesson) by
  reading the actual rendered message text directly from Job C's own
  webview: `"Epic fantasy landscape, cinematic lighting"` - the real
  prompt, correctly sent, on the correct Job's own conversation.
- **Regression check - Prompt Library**: created two new prompts
  ("Anime", "Landscape") through the real Create-Prompt modal during
  this session's testing - confirms the modal/CRUD flow from Session 4
  is unaffected by this change.
- `git diff --stat electron/main.ts`: empty - the temporary
  `--remote-debugging-port` switch used for all of this session's live
  verification was fully reverted before this commit, confirmed via
  diff.

### Remaining known issues

- Bug #2 (Job title auto-naming) and Bug #3 (Job isolation), as
  reported at the start of this session, were never actually reproduced
  under live testing in this session - by the time thorough live
  verification was performed, both behaved correctly (title updates
  confirmed via screenshot multiple times; isolation is now the subject
  of this session's whole architecture change and is verified above).
  If either is still observed as broken in practice, it needs a fresh,
  specific repro - nothing in this session's testing reproduced them as
  independent defects.
- Download-step flakiness (Session 5) and large-payload `localStorage`
  persistence-across-a-crash (Session 4) remain open, untouched this
  session.
- No idle-eviction for Job webviews (see "Memory management" above) -
  an intentional omission, not a bug, but worth flagging if a session
  ends up with many activated-but-abandoned Jobs.

---

## Session 7 (2026-08-03): Version 1.0 - the Workspace IS the tab

Product direction change, approved and specified by the user: GPT Image
Studio Pro stops being a "ChatGPT manager" (Job list, Queue, Project
files, history) and becomes a minimal, fast Image Generation Studio.
Implementation order followed the user's recommended 5 steps; see
"Why Steps 1-4 landed together" below for why they're one milestone
instead of four.

### Why Steps 1-4 landed together

The recommended steps were: (1) remove Job List, (2) move Prompt/
Upload/Generate into the main workspace panel, (3) remove the Queue,
(4) rename Job terminology to Workspace. In practice these are one
change at the data-model level: a Tab can only "own one image/prompt/
status directly" (the whole point of removing Job List) once Job's
fields are folded directly into the Tab/Workspace type - there's no
intermediate state where that compiles and runs correctly. Rather than
force four commits through a broken intermediate state, all four
landed as a single verified milestone; Step 5 (styling) is genuinely
separable and is next.

### Data model

- New `src/types/Workspace.ts` - `Workspace { id, name, prompt, status,
  imagePath?, createdAt, completedAt?, uploadedImagePath?,
  selectedPromptId?, conversationUrl? }`. This is `Job`'s old field set,
  directly on what used to be `ProjectTab` - there is no more nesting.
  `name` is the *only* title anywhere (shown directly in the tab bar) -
  `Job.title` and `ProjectTab.name` used to be two separate things;
  now there's one.
- New `src/services/WorkspaceService.ts` - flat-array equivalent of the
  old `JobService.ts` (`getCurrentWorkspace`, `addWorkspace`,
  `deleteWorkspace`, `updateWorkspace`, `setWorkspacePrompt`,
  `setWorkspaceUploadedImage`). `setWorkspacePrompt` is what renames
  the tab: sets `name` to the selected Prompt's title, de-duplicated
  against sibling *Workspaces* (not sibling Jobs-within-a-tab, since
  there's no such nesting anymore) with " (2)", " (3)", ...
- **Deleted entirely**: `src/types/Job.ts`, `src/types/Project.ts`,
  `src/services/JobService.ts`, `src/utils/ProjectStorage.ts` (all
  Project/Tab/Job persistence logic - localStorage autosave, `.gisp`
  native file open/save/saveAs, and their IPC handlers in
  `electron/main.ts` + API surface in `electron/preload.ts`), both
  `defaultJobs.ts` seed files, `src/utils/fileUrl.ts` (only used by the
  now-removed Result-image section).

### Removed from the UI

- `JobList.tsx`/`.css` - deleted outright, not replaced. A Workspace
  always has exactly the one image/prompt/status it owns directly -
  there's nothing to list.
- The Result/generated-image preview section that used to live in
  `JobDetail` - the new `WorkspacePanel` shows only Image / Prompt /
  Generate / Status, matching the approved layout exactly (no history,
  no result browsing - the file is on disk, auto-named, nothing to
  look at here).
- Toolbar: `New Job`, `Generate` (bulk/queue), `Open`, `Save` buttons
  all removed. Only the app title and a disabled `Settings` button
  remain.
- The "Stop" queue-cancel button - gone; there's no queue to cancel,
  and it wasn't in the approved layout.

### Renamed / restructured

- `JobDetail.tsx` -> `src/components/Workspace/WorkspacePanel.tsx`.
  Props simplified: no more `job: Job | null` + id-addressed handlers -
  since there's only ever one Workspace to show/edit at a time now, it
  takes `workspace: Workspace` directly (never null - a Workspace
  always exists) and handlers like `onUploadImage(dataUrl)`/
  `onSelectPrompt(promptId)` no longer need an id parameter at all.
- `JobTabs.tsx` -> `src/components/Workspace/WorkspaceTabs.tsx` - same
  switch/add/delete UI, now reading `Workspace[]`/`currentWorkspaceId`
  directly instead of `Project.tabs`/`currentTabId`.
- `QueueRunner.ts` -> `src/services/generate.ts` - the automation
  pipeline itself (upload, prompt insertion via the paste-event fix,
  send, wait-for-generation, download, verify, close viewer) is
  byte-for-byte the same logic as before; only the "for each job in a
  queue" loop and its cross-job status-cascade bookkeeping are gone.
  `runGenerate()` now runs once, for exactly one `Workspace` passed in
  directly.
- `Browser.tsx` (`BrowserPool`) - identical design to Session 6's per-
  Job webview registry, just re-keyed by Workspace id
  (`activeWorkspaceId`, `ensure(workspaceId, ...)`, etc.) - the
  lifecycle (lazy creation on first activation, pure show/hide on
  switch, destroy on close) didn't need to change at all, since a
  Workspace *is* what a Job used to be for this purpose.
- `Workspace.tsx` - full rewrite around the flat `Workspace[]` state;
  no more `projectRef`-mirrors-for-a-nested-structure, no more scoped-
  one-job-view adapter for per-job Generate (not needed - there's only
  ever one thing to generate: the current Workspace).

### Automatic saving

New in `electron/main.ts`: `buildAutoFilename(dir, baseName)` - builds
`★_{PromptTitle}_{NNN}.png`, scanning the download folder and
incrementing `NNN` until it finds a name that doesn't already exist.
The `image:armDownload` IPC channel now carries `(id, baseName)`
instead of just a `jobId` - `id` is still used to correlate the
`will-download` event back to the right renderer-side promise,
`baseName` is `generate.ts`'s `baseFileName(workspace.name)`, which
strips the Workspace's own " (2)"/" (3)" tab-disambiguation suffix
first, so two tabs both using the "Portrait" prompt still produce a
single correctly-numbered sequence (`★_Portrait_001.png`,
`★_Portrait_002.png`, ...) instead of the tab suffix leaking into
filenames. Download folder and filename format are currently hardcoded
(no Settings UI yet - see ROADMAP P1).

### Persistence

Removed entirely for Workspace state: no `useEffect` autosave, no
`loadProject`/`buildDefaultProject` fallback-from-storage logic. The
app always boots with exactly one fresh `Workspace` (`name: "New
Tab"`). Prompt Library persistence (`PromptStore.ts`) is completely
untouched and still works exactly as before - it was never part of the
`ProjectStorage` deletion.

### Verification (live, real Electron app, real ChatGPT account)

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- **Layout**: a real screenshot of the running app matches the
  approved spec almost exactly - top Workspace Tabs, left Prompt
  Library only, center ChatGPT Browser, right panel with exactly
  Image/Prompt/Generate/Status and no Result section.
- **Tab renaming**: selecting "Portrait" renamed the tab from "New Tab"
  to "Portrait" immediately, confirmed live. Opening a second tab and
  selecting "Portrait" again produced "Portrait (2)", confirmed live -
  both PASS.
- **Independent WebViews**: webview CDP-target count tracked Workspace
  activation exactly (1 at boot - the initial Workspace is active
  immediately, unlike the old nullable `selectedJobId` - growing to 2
  once a second tab became active). A screenshot after generating in
  the first "Portrait" tab and switching to "Portrait (2)" shows the
  second tab's own fresh, untouched ChatGPT conversation, completely
  unaffected by the first tab's completed generation.
- **Full generate + auto-download**: ran the complete pipeline
  (upload -> prompt insert -> send -> wait -> download -> verify) on a
  real Workspace; reached status "Saved" (the new status label,
  matching the approved vocabulary); the file
  `★_Portrait_001.png` was independently confirmed to exist on disk
  (1,852,164 bytes) via a direct filesystem check, not just trusting
  the pipeline's own logs.
- **Persistence rules**: killed and relaunched the app after having had
  two named/generated Workspace tabs open - confirmed it booted back to
  exactly one fresh "New Tab" (Workspace state did NOT survive, as
  required) while the Prompt Library (`Portrait`/`Anime`/`Landscape`/
  etc.) was still fully present (Prompt Library DID survive, as
  required). Both confirmed via the live DOM, not assumed.
- `git diff --stat electron/main.ts`: confirmed clean of the temporary
  `--remote-debugging-port` switch used for this session's live
  verification (checked the diff text directly for the string, not
  just the file's presence in the diff, since this file also has real,
  intentional changes this session).

### Remaining known issues / next steps

- **Step 5 (styling) not done yet** - components were deliberately kept
  on their old `job-*` CSS class names during this structural rewrite
  to minimize risk; see ROADMAP "Next up - Step 5" for the concrete
  list.
- Settings (Download Folder, Filename format persistence) has no UI
  yet - values are correct and functional but hardcoded. See ROADMAP
  P1.
- A stale `gpt-image-studio-project` `localStorage` key from before
  this session still exists in this dev profile - confirmed inert (no
  code reads it anymore), not cleaned up, harmless.
- Everything else carried over from prior sessions (download-step
  flakiness, no webview idle-eviction) is unaffected by this rewrite -
  see ROADMAP for current status.

### Step 5 (same session): simplify styling

Renamed every `job-*` CSS class to `workspace-*` across
`WorkspaceTabs.tsx`/`.css` and `WorkspacePanel.tsx`/`.css`
(`workspace-tabs`, `workspace-tab`, `workspace-tab-delete`,
`workspace-tab-add`, `workspace-panel`, `workspace-panel-header`,
`workspace-status-badge`, `workspace-panel-section(-title)`,
`workspace-upload-dropzone`/`-input`/`-preview`,
`workspace-generate-button`) - purely a rename, no rule changes, except
merging the old CSS's two separate `.job{}` blocks (one had layout
properties, one had a duplicate selector with `display:flex` - clearly
meant to be one block) into a single `.workspace-tab{}`. Grepped the
whole `src/` tree afterward for any leftover `job-`/`"job"`/`'job'`
string - zero matches.

**Verified live:** `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`,
`npx tsc && npx vite build` all clean. A real screenshot after the
rename is visually identical to the one taken right after Steps 1-4
(same layout, spacing, colors - confirms the rename didn't silently
drop any styling). A functional smoke test against the *new* class
names specifically (not just visual comparison) confirmed they're
correctly wired: selecting "Anime" renamed the tab to "Anime", adding a
tab brought the count to 2, the status badge read "Waiting" - all via
`.workspace-panel-section select` / `.workspace-tab` /
`.workspace-tab-add` / `.workspace-status-badge` selectors. `git diff
--stat electron/main.ts` confirmed empty (temporary debug switch fully
reverted).

Both V1.0 milestones (Steps 1-4, and Step 5) are now committed.

---

## Session 8 (2026-08-03): V1.0 release verification gate

Full live verification pass before the first stable V1.0 release, per
instruction: no code changes, real Electron app, real ChatGPT account,
evidence for every checklist item, only personally-reproduced issues
recorded. No source files were touched this session - only the
temporary `--remote-debugging-port` switch (added and removed, as
every prior session).

### 1. Prompt Library

Reset both `localStorage` keys for a clean run. Discovered (not a bug,
pre-existing `PromptStore.ts` behavior, unrelated to any recent
change): a cleared library re-seeds two legacy entries ("Portrait",
"Anime") from `src/data/prompts.json`'s migration path, which briefly
produced duplicate-titled entries when the test then created new
"Portrait"/"Anime" prompts on top - cleaned up by removing the
legacy-seeded pair (content-empty negative prompt) before continuing.
Not a defect: the app has never enforced unique Prompt titles, and this
was purely a test-setup wrinkle.

- **Create**: Portrait, Anime, Landscape, TempToDelete - all 4
  appeared immediately. PASS.
- **Edit**: appended "EDITED-MARKER" to Landscape's negative prompt,
  reopened the modal, confirmed the field showed the edited value.
  PASS.
- **Delete**: removed TempToDelete, confirmed gone from the list.
  PASS.
- **Restart persistence**: killed and relaunched the app. Prompt
  Library still showed exactly `Portrait`/`Anime`/`Landscape`
  (TempToDelete stayed deleted), and Landscape's `negativePrompt`
  still contained "EDITED-MARKER" - read directly from
  `localStorage`, not assumed. PASS.

### 2. Workspace Tabs

- New tab default title: `"New Tab"`. PASS.
- Selecting "Portrait" renamed the tab to "Portrait" immediately.
  PASS.
- Opened a 2nd tab, selected "Portrait" again → `"Portrait (2)"`.
  Opened a 3rd tab, selected "Portrait" again → `"Portrait (3)"`.
  PASS, and visually confirmed via a real screenshot (3 tabs reading
  exactly `Portrait` / `Portrait (2)` / `Portrait (3)`, matching the
  spec's example verbatim).

### 3. Independent ChatGPT Workspaces

Renamed tab 2 to "Anime" and tab 3 to "Landscape" (re-selecting a
different Prompt on an already-named tab - confirmed this re-renames
correctly too, not just first-selection). Generated in all three.
CDP target list afterward showed 3 distinct webview targets with 3
distinct, non-overlapping conversation URLs:

```
Landscape  -> https://chatgpt.com/c/6a700b09-...
Anime      -> https://chatgpt.com/c/6a700ae3-...
Portrait   -> https://chatgpt.com/c/6a700ad9-...
```

No mirroring between tabs - PASS. (Portrait's generation itself hit a
real bug at the download step - see "4. Generation" and "Known
Issues" below; its webview and conversation URL were still correctly
independent of the other two, which is what this section verifies.)

### 4. Generation

Ran the full pipeline (upload real file via `DOM.setFileInputFiles` →
Generate → wait for terminal status) on all three tabs:

- **Anime**: `Saved`. PASS.
- **Landscape**: `Saved`. PASS.
- **Portrait**: `Error` - reproduced twice in a row (initial run and a
  deliberate retry). Diagnosed precisely, not guessed: connected
  directly to Portrait's own webview target and inspected the open
  dialog at the point of failure - `alt="upload.png"`, `aspect-ratio:
  1/1`, matching the tiny 1x1 test PNG that was uploaded, not a
  generated result. `buildOpenImageViewerScript()` had clicked the
  Workspace's own uploaded-image element instead of the actual
  generated image, because both are served from the same
  `/backend-api/estuary/content` URL pattern and the script picks
  "the last matching element in document order" with no way to
  distinguish which one is the real result. The pipeline's own
  regression logging (`[Generate] Download button not found: download
  button not found`) already correctly reflects this failure -
  nothing about the *reporting* is wrong, the *selector* picked the
  wrong image. Recorded in ROADMAP Known Issues, not fixed (out of
  scope for a verification pass; also, per the very first V1.0
  session's instruction, the download/image-detection code was
  explicitly off-limits then, and fixing it now wasn't asked for in
  this release-gate task).
- No other regression found in upload / prompt insertion / send for
  any of the three tabs - all three reached "image generation
  detected" and had their prompt correctly inserted and sent
  (confirmed via the `[Generate]` log sequence, consistent with this
  session's live account activity).

### 5. Automatic Saving

- First Anime generation → `★_Anime_001.png` (2,784,230 bytes).
- First Landscape generation → `★_Landscape_001.png` (2,349,979
  bytes).
- **Second** Anime generation (deliberately re-ran to test the
  increment case the release checklist specifically asked about) →
  `★_Anime_002.png` (2,889,135 bytes) - `001` was correctly not
  overwritten, `002` was correctly the next number. All three
  confirmed via a direct `ls` of the downloads folder, not from
  application logs. Exactly matches the specified format
  (`★_{PromptTitle}_{NNN}.png`) with no deviation - nothing to
  document as "different from expected."
- Portrait never reached this step this run (blocked upstream by the
  Known Issue above), so its own increment behavior specifically was
  not re-verified this session - it was verified in Session 7
  (`★_Portrait_001.png`, confirmed on disk then) and the increment
  mechanism itself is shared code, already proven correct via the
  Anime case above.

### Known issues recorded (personally reproduced only - see ROADMAP
"Known issues" for the full writeup)

1. Download step can open the uploaded image's viewer instead of the
   generated result's, when both are present in a conversation's DOM
   in a particular order - reproduced twice, root-caused precisely,
   not fixed this session.
2. Workspace state (open tabs) reset unexpectedly once during this
   session's extended CDP-driven testing, with no corresponding error
   in the dev log - Prompt Library was unaffected (correct, since it's
   independent of Workspace state). Not confirmed to reproduce under
   normal interactive use; recorded rather than ignored.

Nothing else was found - upload, prompt insertion, tab independence,
naming/dedup, and Prompt Library CRUD/persistence all worked exactly
as specified on every attempt.

### Final verification

- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean (no source changed this session, so this just
  reconfirms the prior commit's state).
- `git status --porcelain` after reverting the temporary debug switch:
  completely empty - zero diff, confirming this was a pure
  verification pass with no incidental code changes.

---

## Session 9 (2026-08-03): Applied Version 1.0 light theme polish

Pure visual redesign - dark theme replaced with a light theme matching
the approved palette (`#F5F5F5` app background, `#FFFFFF` panels,
`#E5E5E5` borders, `#222222`/`#666666` text, `#2563EB`/`#3B82F6`
primary button, `#DC2626` danger). No component logic, props, class
names, or DOM structure changed - only CSS rule content, plus one text
change (`Toolbar.tsx`: "GPT Image Studio Pro" -> "GPT Image Studio").

**Files touched:** `src/index.css` (simplified to light-only root
defaults; removed the unused Vite-scaffold `a`/`h1`/generic-`button`
demo rules after confirming via grep that every real button in the app
is covered by a more specific class/descendant selector, so nothing
was left unstyled), `Toolbar.css`/`.tsx`, `Workspace.css`,
`WorkspaceTabs.css` (inactive tabs blend into the tab-bar background,
active tab is white with a blue bottom-border indicator - "modern
browser tab" feel), `WorkspacePanel.css` (status badges got semantic
light-theme colors: blue/green/red-tinted backgrounds for
running/done/error), `Prompt.css` (Prompt Library + modal - Save is
the only filled-blue button, Delete is an outlined danger button,
Cancel is neutral; added a `.15s` fade-in on the modal overlay per
"fast fade transitions only"), `Browser.css` (minimized to a thin
white header so the embedded ChatGPT page blends in rather than
sitting inside a visibly separate dark container). `Workspace.css`'s
3-column grid now uses a `1px` gap over an `#E5E5E5` background instead
of explicit borders on each panel, to keep dividers hairline-thin per
"avoid heavy borders."

**Verified live (real Electron app, screenshots, not assumed):**
- Full-window screenshot: white top bar reading "GPT Image Studio"
  (no "Pro"), tab bar with the active tab shown white-with-blue-
  underline against a light-gray inactive-tab background, white Prompt
  Library sidebar, ChatGPT's own (already-white) page blending directly
  into the layout with only a thin gray header line above it, and a
  white right panel where Generate is the single blue element in the
  entire screenshot - every other control (Settings, Upload dropzone,
  New Prompt, tab close buttons) is neutral gray/white as specified.
- Prompt modal screenshot: white rounded card, light borders on the
  Title/Prompt/Negative Prompt fields, Save (filled blue) / Delete
  (white with red border/text) / Cancel (neutral gray) - matches the
  requested button hierarchy exactly.
- Functional smoke test after the restyle: selecting "Anime" from the
  Prompt dropdown still renamed the Workspace tab to "Anime"
  immediately (same mechanism as before, now just repainted) - PASS.
  Modal close-via-Cancel - PASS.
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- `git diff --stat electron/main.ts`: empty - the temporary
  `--remote-debugging-port` switch used for this session's screenshots
  was fully reverted before this state, confirmed via diff.

No functionality was touched - Prompt Library logic, Workspace logic,
the upload pipeline, prompt insertion, the download pipeline, and the
independent-WebView architecture are all byte-for-byte unchanged from
the V1.0 release commit.

Not committed yet, per instruction - holding for explicit go-ahead.

### Follow-up (same session): "too flat" - card-style redesign

The first light-theme pass above was judged too flat once seen live.
Second iteration, still pure CSS, still no logic/DOM/class-name
changes: every major area (Prompt Library, ChatGPT Browser, Workspace
panel) now reads as its own distinct card - `#FFFFFF` background,
`2px solid #C9CDD3` border, `8px` border-radius, `16px` gap between
cards over an `#F3F4F6` app background (replacing the previous `1px`
hairline-gap trick, which was the main source of the "flat" feel).
Internal section dividers (header/list/footer in the Prompt Library,
header/body in the Workspace panel and the Browser) now use a distinct
`#B8BDC5` line, one shade darker than the panel border, so the
hierarchy reads: app background < panel border < internal divider in
visual weight. Workspace tabs changed from a bottom-underline to the
requested top-border indicator (inactive `#ECECEC`, selected white
with a `3px solid #2563EB` top border). Spacing increased throughout
(panel padding 20px->24px, panel gap 20px->24px) per "increase
whitespace between sections."

**Files touched (all CSS, plus reused the same `index.css` root
background token, updated to the new `#F3F4F6`):** `Workspace.css`,
`WorkspaceTabs.css`, `Browser.css`, `WorkspacePanel.css`, `Prompt.css`,
`Toolbar.css` (border color and button radius brought in line with the
same palette for consistency, not explicitly requested but a one-line
change per file to avoid the toolbar looking like a leftover from the
old pass).

**Verified live (real Electron app, screenshots):**
- Full-window screenshot: three clearly separate white cards visible
  against the light-gray app background, each with a visible border
  and rounded corners - Prompt Library (left), ChatGPT Browser
  (center), Workspace panel (right). "New Tab" shown selected: white
  background, 3px blue top border, sitting against light-gray
  (`#ECECEC`) inactive-tab styling. Divider lines visible under the
  "PROMPT LIBRARY" header and under the "Workspace / Waiting" header.
  This reads as a desktop application with real panel separation, not
  a flat webpage - confirmed by direct visual comparison against the
  previous iteration's screenshot.
- Modal screenshot (with a card behind it, dimmed): modal itself now
  has the same `2px` border treatment as the panels, rounded corners,
  and a visible blue focus ring on the focused Title field - Save
  (blue) / Delete (red-outlined) / Cancel (neutral) hierarchy
  unchanged and still correct.
- Functional smoke test re-run after this second pass: selecting a
  Prompt still renames the Workspace tab immediately (tested "Anime")
  - PASS.
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`, `npx tsc && npx vite
  build`: all clean.
- `git diff --stat electron/main.ts`: empty after reverting the
  temporary debug switch again.

Still not committed - both iterations of the theme work are sitting as
one combined, currently-uncommitted change, holding for explicit
go-ahead as before.

## Session 10 (2026-08-03): V1.0 final polish - per-Workspace generation state, status dots, Ready lifecycle

Architecture confirmed final ("independent WebView per Workspace" is
now the official V1.0 architecture) - this session is UX/state polish
only, no architecture changes. Four fixes, all scoped exactly to the
Workspace layer:

**1. Independent Generate button state.** Root cause: `Workspace.tsx`
held a single global `const [running, setRunning] = useState(false)`
that gated every Workspace's Generate button - Workspace A starting a
generation disabled B and C's buttons too, even though each Workspace
already owned its own `status` field. Removed the global flag entirely
and switched every gate (the `onGenerate` reentrancy guard, and
`WorkspacePanel`'s Generate button `disabled`) to read
`workspace.status === "running"` - the field that was already correct
and already isolated per Workspace, just not being used for this. No
new state was introduced (`isGenerating`/`isDownloading` collapse into
the existing `status` enum, as before).

**2. Workspace initial title.** `createWorkspace()` in
`types/Workspace.ts` now starts a new tab as `"New Workspace"` instead
of `"New Tab"`. Selecting a Prompt still renames it exactly as before
(`WorkspaceService.setWorkspacePrompt`, with " (2)", " (3)", ...
de-dup against sibling tabs) - the tab title remains the Workspace's
only title, nothing new introduced.

**3. Workspace status indicator.** Added an 8px colored dot
(`.workspace-tab-status`) to each tab in `WorkspaceTabs.tsx`/`.css`:
gray = idle (never generated), blue = generating, green =
completed/ready, red = error. `status` alone can't distinguish "never
generated" from "ready again after a prior success" (both sit at
`"waiting"`), so the dot color is derived from `status` plus whether
`completedAt` has ever been set (`statusDotClass()` helper) rather than
adding a new field. No emoji, plain CSS circles.

**4. Ready as the resting state.** `generate.ts`'s `runGenerate` used
to leave a Workspace parked at `status: "done"` indefinitely after a
successful download. It now waits 1.5s after marking `"done"` (so the
completed/green confirmation is still visible), then resets to
`status: "waiting"` and clears `uploadedImagePath` (the consumed
upload) while leaving `prompt`/`selectedPromptId` untouched, since the
normal flow is picking a Prompt once and generating several images
against it. The status dot stays green through this reset (driven by
`completedAt`, not `status`), so "Ready" reads as a *successful* rest
state, not a reset-to-blank one. `WorkspacePanel`'s `STATUS_LABEL` for
`"waiting"` was relabeled from "Waiting" to "Ready" to match.

Explicitly NOT touched: Prompt Library, Prompt persistence, the upload
pipeline, prompt insertion, the download pipeline, the WebView/
BrowserPool architecture - byte-for-byte unchanged.

**Verified live (real Electron app + real ChatGPT generations, CDP
DOM queries and filesystem checks - not logs):**
- Fresh launch: single tab reads "New Workspace", gray dot, Generate
  disabled, badge "Ready" - confirmed via screenshot and DOM query.
- Created three Workspaces, assigned the Portrait/Anime/Landscape
  Prompt Library templates - tabs renamed to "Portrait"/"Anime"/
  "Landscape" respectively, no dedup collisions (distinct names),
  confirmed via screenshot.
- Clicked Generate on Portrait: immediately confirmed via DOM query -
  Portrait's own dot turned blue (running), its own Generate button
  disabled with badge "Generating...", while Anime's dot stayed gray
  and its Generate button stayed enabled with badge "Ready" - proves
  the busy state belongs to the Workspace, not the app.
- Started Anime generating, then - while Anime was still running -
  switched to Landscape and started it generating too: DOM query
  confirmed **both** Anime and Landscape dots were blue
  simultaneously, while Portrait (already finished by then) stayed
  green - true concurrent independence between three Workspaces, not
  just before/after independence.
- Filesystem check of the real Downloads folder confirmed genuine new
  files landed for each: `★_Portrait_001.png` (1.9MB),
  `★_Anime_004.png` (2.7MB), `★_Landscape_003.png` (2.9MB), all
  non-zero and timestamped at the moment each generation actually
  completed - not just trusting the pipeline's own success logs.
- After both concurrent generations finished, re-checked all three
  Workspaces via DOM query: all three show a green dot, badge "Ready",
  Generate re-enabled, and the selected Prompt still assigned - none
  left stuck on "Saved"/"Completed", confirming the Task 5 reset.
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`: both clean.
- `git diff --stat electron/main.ts`: empty - the temporary
  `--remote-debugging-port` switch used for this session's CDP checks
  was fully reverted before this entry was written.

## Session 11 (2026-08-03): Version 1.0 Settings system

Built the Settings dialog exactly to spec: a workspace-configuration
window, not a general preferences panel - every section directly
serves the image generation workflow, nothing else. Four sections:
Download Folder, Prompt Library Backup, Filename Format (documented as
read-only for this session; superseded by Session 12 below the same
day), and read-only Application Information.

**Main process (`electron/main.ts`):** added a small standalone
`settings.json` in `app.getPath("userData")` - separate from the
Prompt Library's own `localStorage` store, since the main process (not
the renderer) owns the download-redirect logic and needs this value
directly. `generatedImagesDir` became a mutable `let`, seeded from
persisted settings with the old hardcoded
`Downloads/GPT Image Studio` as fallback. New IPC handlers:
`settings:getDownloadFolder`, `settings:browseDownloadFolder` (native
folder picker + auto-create + persist), `settings:openDownloadFolder`
(`shell.openPath`), `settings:getAppInfo` (app/Electron/Node versions +
`git rev-parse --short HEAD`, `null` if unavailable), and
`promptLibrary:export`/`promptLibrary:import` (native Save/Open
dialogs around a plain JSON read/write).

**Prompt Library Backup (`src/store/Promptstore.ts`):** added
`exportPayload()` (Title/Prompt/Negative Prompt only - no id/
timestamps) and `importPayload(items, strategy)` where `strategy` is
`"replace" | "keep" | "rename"`, applied uniformly to every title that
collides with an existing one; non-colliding incoming prompts are
always added regardless of strategy - a user's prompts are never lost
by importing. Added `isValidExportPayload()` so an unrelated or
hand-edited JSON file is rejected outright instead of partially
imported, mirroring the existing `isValidPromptItem` localStorage
guard.

**Verified live:**
- Download Folder: confirmed via direct filesystem check that a real
  Browse selection persists to `settings.json`, survives a full app
  kill+relaunch (Settings dialog still showed the custom folder after
  restart), and that real generated images actually landed in the new
  folder (not the old default) - proving `generatedImagesDir` itself,
  not just the displayed value, was redirected.
- Open Folder: confirmed via Win32 window enumeration that a real
  Explorer window opened at the exact configured folder.
- Prompt Library export/import *logic*: since the native Save/Open
  file dialogs never rendered a visible OS window under CDP-only
  automation in this sandboxed session (confirmed via full-system
  window enumeration - nothing appeared, unlike the folder-picker and
  `shell.openPath`, which did work when triggered by a real user),
  `PromptStore.exportPayload()`/`importPayload()`/`isValidExportPayload()`
  were instead exercised directly against the live singleton (via a
  dynamic `import()` of the running module, confirmed to be the same
  instance already backing the UI) using disposable `ZZTEST_*` titles,
  then cleaned up so the real library was left byte-for-byte unchanged.
  All three duplicate strategies behaved exactly as documented: "Keep"
  left the original's content untouched, "Replace" updated it in place
  (same id), "Rename" added a deduped second entry without touching the
  original.
- The user then manually clicked through the real Export -> delete a
  Prompt -> Import flow themselves in the running app and confirmed it
  worked end-to-end (their own exported `prompt-library.json`, with the
  correct Title/Prompt/Negative Prompt shape, was found on disk).
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`: both clean.

## Session 12 (2026-08-03): Simplified filename system

Replaced the fixed, hardcoded `★_{PromptTitle}_{NNN}.png` scheme (and
the read-only "Filename Format" info block from Session 11) with a
much simpler, user-configurable one: **Prefix + Prompt Title**, where
only the Prefix is editable and the Prompt Title is always appended
automatically and is never editable. Numbering keeps the existing
always-numbered-from-`001` scheme (every file gets a number, not just
the first collision) since that's the option that keeps filename
ordering consistent on disk - this required no logic change, since
`buildAutoFilename` already worked this way.

**Main process (`electron/main.ts`):** added `filenamePrefix` to the
same `settings.json` persisted-settings object as the Download Folder
(default `"★_"`, matching the prior hardcoded value so existing users
see no change until they edit it). Extracted a `sanitizeFilenamePart()`
helper (strips illegal Windows filename characters, trims whitespace)
and applied it to **both** the Prefix and the Prompt Title at the
moment a filename is built - the raw, unsanitized Prefix is what's
persisted and shown while editing, so Settings reflects exactly what
the user typed; sanitization happens once, at save time, same as the
Prompt Title already worked. An empty title still falls back to
`"Untitled"`, which guarantees the filename can never be empty even if
the Prefix is also cleared to nothing. New IPC handlers:
`settings:getFilenamePrefix`, `settings:setFilenamePrefix`.

**Settings dialog:** the old read-only "Filename Format" section was
replaced with a "Filename" section containing a single `Prefix` text
input and a live `Preview` (e.g. `★_Portrait_001.png`) that updates on
every keystroke using a small preview-only sanitizer mirroring the
main process's real one.

**Toolbar:** added a dedicated `📂 Open Folder` button directly on the
main toolbar, beside a relabeled `⚙ Settings` button - both now open
directly from the toolbar without going through the Settings dialog
first for the folder-open case.

**Verified live (real Electron app, real ChatGPT generations,
filesystem checks - not logs):**
- Changed the Prefix from `★_` to `IMG_` in Settings: the Preview
  updated instantly to `IMG_Portrait_001.png`, confirmed persisted to
  `settings.json`, and confirmed to survive a full app kill+relaunch
  (Settings still showed `IMG_` after restart).
- Selected the Portrait prompt and generated a real image: the actual
  downloaded file was `IMG_Portrait_001.png` (2.09MB) - the new prefix
  was genuinely used for the real save, not just shown in the preview.
- Generated a second image against the same prompt without changing
  anything: the workspace correctly showed "Ready"/Generate-enabled
  beforehand (Session 10's auto-reset), and the second file saved as
  `IMG_Portrait_002.png` (2.07MB) - confirmed both files exist
  independently on disk with different sizes/timestamps, proving the
  numbering incremented correctly and neither file was overwritten.
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`: both clean.
- `git diff --stat electron/main.ts`/`grep remote-debugging-port`:
  confirmed the temporary CDP debug switch used for this session's
  verification was fully reverted before this entry was written.

Not committed yet - Sessions 11 and 12 are both sitting as uncommitted
work pending explicit go-ahead.

Not committed yet, per instruction - holding for explicit go-ahead.

## Session 13 (2026-08-03): Work Type Management + Settings polish for a production workflow

Reframed Settings as a production tool's workspace configuration
window (per the user: "GPT Image Studio is a production tool designed
for professional image generation workflows") and added the one
missing piece requested this session: a fully user-manageable **Work
Type** system (e.g. a photo studio's 만삭/신생아/50일/백일/돌/주니어
job categories - the user's own real examples), replacing the idea of
a fixed category list entirely.

**New: `src/types/WorkType.ts` + `src/store/WorkTypeStore.ts`.** A
`WorkType` is `{ id, displayName, filenamePrefix, enabled }`, persisted
in its own `localStorage` key, same singleton-store pattern as
`PromptStore` (validated on load, never trusts stale data blindly).
Supports `create`/`update`/`remove`/`setEnabled`/`moveUp`/`moveDown` -
reordering is a simple neighbor-swap (no drag-and-drop dependency
needed for "keep it simple").

**Workspace-level Work Type selection.** `types/Workspace.ts` gained
`workTypeId?`/`workTypePrefix?`, following the exact same denormalized-
snapshot pattern already used for `selectedPromptId`/`prompt` - a
Workspace keeps using the Work Type prefix it had selected even if that
Work Type is later edited or deleted in Settings.
`WorkspaceService.setWorkspaceWorkType()` mirrors `setWorkspacePrompt()`.
`WorkspacePanel` renders every **enabled** Work Type as a compact chip
(`workspace-worktype-chip` - 26px tall, pill-shaped, muted gray/blue,
not a full-size button) in a new "Work Type" section between Prompt
and Generate; clicking the already-selected chip again deselects it -
"no Work Type selected" is a valid, documented state. Only one chip can
be active per Workspace, and each Workspace's selection is completely
independent (same isolation guarantee as Generate state/status from
Session 10).

**Filename system, revised formula.** The user redefined the rule as
**Prefix + (optional Work Type Prefix) + Prompt Title**, with the
default global Prefix changed from `"★_"` to bare `"★"` - the app now
always inserts exactly one `_` right after the (sanitized) global
Prefix itself; a Work Type's own prefix (e.g. `"만삭_"`) already
carries its own trailing separator as typed by the user, so it's
concatenated directly with no extra separator before the Prompt Title.
`electron/main.ts`'s `buildAutoFilename()` signature gained a
`workTypePrefix` parameter reflecting this; `PendingDownload` and the
`image:armDownload` IPC channel (both `preload.ts` and the renderer
call in `generate.ts`) now carry `workspace.workTypePrefix` through to
the save step. Numbering itself is unchanged (`buildAutoFilename` still
numbers every file from 001, sequentially, per the existing on-disk
scan). Settings' Filename section gained a **Reset** button
(`handlePrefixChange("★")`) and the live Preview formula was updated to
match (`{prefix}_Portrait_001.png`), with a short note explaining where
a Work Type prefix gets inserted.

**Settings reorganized to match the new section names/wording exactly:**
"Download Folder" -> "Download" (its in-dialog "Open Folder" button was
removed entirely - Toolbar's own `📂 Open Folder` button, added in
Session 12, is now the only place it lives, per this session's explicit
"Do NOT place Open Folder inside Settings"). "Prompt Library Backup" ->
"Prompt Library", buttons renamed "Export/Import Prompt Library" ->
"Backup Prompts"/"Restore Prompts" (same underlying export/import/
duplicate-resolution logic, unchanged). New "Work Type Management"
section (add/edit/reorder/enable-disable list + an inline add/edit
form, same show/hide-on-demand pattern as the Prompt Library's modal).
New **Credits** section at the very bottom - centered, small (11px)
muted text, no hyperlinks, `Version {app.getVersion()}` rather than a
second hardcoded literal so it can never silently drift from
Application Information's own version string above it (`package.json`
bumped `0.0.0` -> `1.0.0` to match, since this *is* the V1.0 release).

**Verified live (real Electron app, real ChatGPT generations,
filesystem checks - not logs):**
- Settings sections appear in the exact requested order and wording:
  Download / Prompt Library / Work Type Management / Filename /
  Application Information, with Credits below - confirmed via DOM
  query and screenshot. Download section has only "Browse..." (no
  Open Folder); Prompt Library has "Backup Prompts"/"Restore Prompts".
- Reset button: confirmed via IPC round-trip that clicking it persists
  bare `"★"`, overriding whatever was previously typed.
- Work Type CRUD, live: added "만삭"/"만삭_" - appeared immediately as
  a chip in the Workspace panel. Added a second, "신생아"/"신생아_" -
  confirmed order `["만삭","신생아"]`. Moved 신생아 up - confirmed
  order became `["신생아","만삭"]`. Edited 만삭 -> "만삭테스트" -
  confirmed the rename applied without moving its position. Disabled
  "만삭테스트" - confirmed its chip disappeared from the Workspace
  panel while "신생아"'s stayed. Deleted "만삭테스트" - confirmed it's
  gone from the list entirely.
- Workspace independence: selecting a chip toggles `active` on that
  chip only; clicking it again deselects - confirmed via DOM query.
- Real end-to-end filename generation, both documented cases: with
  "만삭" selected, Generate produced **`★_만삭_Portrait_001.png`** -
  the exact literal example from the spec, confirmed as a real,
  non-zero (1.9MB) file on disk. With no Work Type selected, Generate
  produced **`★_Portrait_001.png`** - the other documented example,
  also confirmed as a real file.
- Full-restart persistence: killed and relaunched the app; Download
  Folder, Filename Prefix, and the full Work Type list (names,
  prefixes, order, enabled state) were all still correct afterward -
  confirmed via DOM query and screenshot.
- `npx tsc --noEmit`, `npx eslint . --ext ts,tsx`: both clean.
- `grep remote-debugging-port electron/main.ts`: confirmed the
  temporary CDP debug switch used for this session's verification was
  fully reverted before this entry was written.

One process note: mid-session the running dev instance stopped
unexpectedly between two automated checks (not an intentional kill),
and separately the Work Type list was found to have changed between
two checks in a way this session's own scripts didn't cause - most
likely the user interactively using the live app in parallel with this
session's own CDP-driven testing (Settings and the Workspace chips are
ordinary UI, so both can legitimately drive the same running instance
at once). Neither affected the verification above, since each check
re-read live state rather than assuming a prior result still held.

## Session 14 (2026-08-03): Workspace Clear, two production fixes, filename prefix simplification

**Workspace Clear (new toolbar action).** Added an instant "Clear"
button next to Generate in `WorkspacePanel`, resetting only the active
Workspace back to a brand-new state (image, generated result, selected
Prompt, selected Work Type, status/progress/error, conversationUrl) and
re-pointing that Workspace's own webview at a fresh ChatGPT
conversation - never touching any other Workspace, the Prompt Library,
Work Type definitions, or Settings.
`WorkspaceService.clearWorkspace()` reuses `createWorkspace()`'s own
blank shape (`{...createWorkspace(), id: w.id, createdAt: w.createdAt}`)
rather than re-listing every field to reset, so there is exactly one
definition of "what a fresh Workspace looks like." A real bug was
caught and fixed during implementation: the first version awaited the
webview's `loadURL()` (a real page navigation) *before* resetting
Workspace state, which visibly delayed the "instant" reset by however
long that navigation took - fixed by resetting state synchronously
first and firing the navigation after, without awaiting it.
A small "✔ Workspace cleared" message shows for ~1s and disappears
automatically (verified live: visible through ~1.3s, gone by ~1.6s -
"approximately 1 second," not an exact deadline); it's tracked as local
UI state in `WorkspacePanel` (not Workspace data) and is force-hidden
whenever the *displayed* Workspace changes, since the component
instance is reused across tabs and never unmounts on switch.
**Verified live:** the state reset is instant (tab title, Prompt
selection, Work Type chip, status dot, Generate/Clear enabled state all
flip in the same DOM check, no waiting on anything network-related);
clearing one Workspace never touched a sibling Workspace's own Prompt/
title (confirmed with two tabs open); a full real cycle (upload select
Prompt select Work Type Generate) worked correctly on a Workspace
immediately after clearing it, including the resulting filename.
**Known open item:** one live check found the webview's own URL had
*not* changed to a fresh conversation a few seconds after clicking
Clear on a Workspace with an established real conversation and an
Error status, even though the fire-and-forget `loadURL()` call
resolved without throwing - not conclusively root-caused (the app
closed and reopened multiple times around the same testing window from
what looks like real concurrent use, which could just as easily explain
a single anomalous reading as a real bug). Flagging here rather than
silently assuming it's fine; worth a focused, uninterrupted repro
before trusting it fully.

**Issue 1 - filename numbering, corrected.** The numbered-from-001
scheme was replaced with the requested rule: no numeric suffix at all
the first time a name is saved (`★_만삭_노을감성.png`); only once that
exact name already exists does a plain integer get appended directly
to the base name, no separator, no zero-padding (`...2.png`,
`...3.png`, ...). `buildAutoFilename()` in `electron/main.ts` now tries
the bare name first and only enters the numbered-suffix loop starting
at `n = 2` if that first candidate already exists on disk. Still never
overwrites an existing file.

**Issue 2 - image preview race condition, root-caused and fixed.**
Symptoms (intermittent, upload-related: the uploaded image opening in
a full-screen preview, a false Error, the Work Type prefix
occasionally missing from the save) traced back to
`buildOpenImageViewerScript()` matching *any* `img[src*=
"/backend-api/estuary/content"]` in **document order** to decide which
image to click and download. Live DOM inspection (connecting directly
to the ChatGPT `<webview>`'s own CDP target, not the outer app page -
querying the outer page's `document` for webview-internal content is a
silent no-op, a mistake made and caught mid-investigation) confirmed
that URL pattern is not unique to generated images at all: a
Workspace's own uploaded photo uses the exact same pattern, and so -
surprisingly - does the sidebar's account icon. A first fix attempt
scoped the click to `[data-message-author-role="assistant"]`, following
an assumption already written into this codebase's comments; live
testing immediately falsified it - the current ChatGPT UI does not set
that attribute anywhere (`0` matches), so every real attempt failed
with "no assistant turn found." The actual working fix, confirmed
against real DOM structure: ChatGPT wraps every AI-generated image in a
container carrying a `imagegen-image` class fragment
(`[class*="imagegen-image"]`) - confirmed live that this container
appears only once real generation completes (not from the moment of
upload) and confirmed live that an uploaded image's own container never
matches it. `buildOpenImageViewerScript()` now finds the last such
container and clicks the generated image inside it - structurally
unable to click the uploaded image, not just unlikely to. Separately,
a new `buildEnsureNormalChatInterfaceScript()` runs right after the
upload-completed check and before prompt insertion: if a
`div[role="dialog"]` preview happens to already be open at that point,
it closes it (same button-matching/Escape-fallback approach as the
existing image-viewer-closer) and only proceeds once the composer is
confirmed active again - automation now structurally cannot continue
while a preview is covering the composer.

**Verified live - 20 consecutive real generations** (each with a real
uploaded test image, a rotating Prompt, and a rotating Work Type,
Cleared between each one): **20/20 ended in "Ready"**, 0 ended in
"Error", 0 timed out, and the original "no assistant turn found"
failure that caused the very first stress-test attempt (pre-fix) to
error on iteration 1 did not recur even once across all 20 post-fix
attempts. One iteration (18 of 20) showed an unexpected empty Work
Type/upload reading, and a different iteration (19) logged one real
transient "download did not complete: timed out" before still
recovering to "Ready" - both are most plausibly explained by the same
real concurrent live usage noted in Session 13 (the app was observed to
close and reopen mid-run more than once, outside anything this
session's own scripts did), not by the two fixes above; recorded
honestly rather than waved away. The Preview-race recovery path itself
was never actually exercised during these 20 runs (`0/20` - the
intermittent trigger simply didn't occur), so it's verified as
logically sound and live-tested for its "no preview open" no-op path,
but not yet observed successfully firing its "preview was open, close
it" branch for real.

**Filename Settings UI + prefix simplification (follow-up in the same
session).** The user identified that the auto-inserted separator
between the global Prefix and the rest (added when Settings was first
introduced) was producing doubled underscores in real use, since Work
Type prefixes the user had already configured with their own trailing
`_` (e.g. `만삭_`) now got an *extra* one from the app itself
(`★__만삭_...`, confirmed live in the user's own real output files).
Removed that automatic separator entirely: `buildAutoFilename()` now
does pure concatenation, `{Prefix}{Work Type Prefix?}{Prompt Title}` -
the user types every separator they want themselves, in the Prefix
and/or a Work Type's own Filename Prefix field. Settings' Filename
Preview and helper text were rewritten to match exactly (`★Portrait.png`
bare, `★만삭Portrait.png` with a Work Type, `★만삭Portrait2.png`/`3.png`
for duplicates) using the live-typed Prefix, not a hardcoded example.
**Verified live:** Preview and helper text confirmed via DOM query
matching this exact wording; a real generation with the "주니어"
Work Type (whose own configured prefix is `_주니어_`) produced
`★_주니어_Portrait.png` - a single underscore (the user's own), not the
previous double-underscore bug.

`npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean throughout this
session. `grep remote-debugging-port electron/main.ts`: confirmed
clean (the temporary CDP switch used for all of this session's live
verification was reverted before this entry was written) - note this
took two attempts, since the first attempted revert silently failed to
apply for an unclear reason and was only caught by re-grepping instead
of trusting the edit tool's own success report.

Not committed yet - none of this session's work (Clear, the two
production fixes, or the filename UI polish) has been committed or
pushed; holding for explicit go-ahead as usual.

## Session 15 (2026-08-03): Version 1.0 - feature complete, release candidate

Declared feature complete. Final project verification before the
release commit:

- `npx tsc --noEmit`: clean, zero errors.
- `npx eslint . --ext ts,tsx`: clean, zero errors.
- `npx vite build` (renderer + electron main/preload, deliberately
  *not* `npm run build`'s full `electron-builder` step - installers are
  explicitly out of scope for this pass): all three stages built
  clean - `dist/` (198.66 kB JS, 12.91 kB CSS), `dist-electron/main.js`
  (6.01 kB), `dist-electron/preload.mjs` (1.34 kB).
- Reverted the two tracked build artifacts (`dist-electron/main.js`,
  `preload.mjs`) back to their committed state afterward, per usual
  practice - a verification build isn't a source change.
- Also fixed a small leftover branding inconsistency caught during this
  pass: the actual Electron `BrowserWindow` title was still literally
  `"GPT Image Studio Pro"`, even though the in-app Toolbar text was
  already rebranded to `"GPT Image Studio"` in an earlier light-theme
  session - the OS-level window/taskbar title had never been updated
  along with it. Fixed in `electron/main.ts`.

**Documentation for the V1.0 release:**
- `ROADMAP.md`: header changed to "Version 1.0 - FEATURE COMPLETE",
  the top verified-feature list rewritten to reflect final reality
  (Workspace Clear, Work Type Management, the corrected filename
  system, the full Settings surface, and the 20/20 stress-test result
  from Session 14 replacing the older "2 of 3 tabs, one reproduced
  bug" line, which is now fixed). Added Steps 10-12 covering Session
  14's work (Clear, the two production fixes + 20x verification,
  filename prefix simplification). Known Issues updated: the
  "wrong image viewer" bug is removed from the list (fixed, root-caused
  and stress-tested in Session 14) and Session 14's new open item
  (Clear's webview navigation not conclusively verified) was added.
- `README.md`: was still the unedited default Vite/React/TypeScript
  scaffold text from project creation - never actually described this
  application. Rewritten from scratch: what GPT Image Studio is, the
  core workflow (Prompt Library -> Workspace tabs -> Work Type ->
  Generate -> auto-save), the Settings surface, run/build commands, and
  a pointer to ROADMAP.md/WORKLOG.md for full history - see the file
  itself for the exact wording.
- `WORKLOG.md`: this entry.

Not committing documentation-only or partial work from here - the next
step is one clean release commit covering everything currently
uncommitted (Sessions 14 and 15 together: Workspace Clear, the two
production fixes, the filename UI polish, and this session's doc
updates), then a push to `origin/main`, per explicit instruction.
Installers are explicitly deferred - not building or committing any
`release/` output this pass.

## Session 16 (2026-08-03): Reset Application Data, Credits & Copyright, First Launch Notice

Final V1.0 polish before the installer: a Maintenance/Reset action,
copyright/legal text in Settings, and a one-time internal-use notice on
first launch.

**Settings > Maintenance > Reset Application Data.** A new bottom
section with a single button. Clicking it shows an in-app confirmation
panel (not a native `window.confirm()` - the spec needed a distinct
Title, a specific Message, and custom Cancel/Reset button labels a
native dialog can't provide), reusing the same "swap out the whole
modal body" pattern already established for the Restore-duplicate-
conflict panel. Confirming calls the two stores' new `clear()` methods
(`PromptStore.clear()`, `WorkTypeStore.clear()` - both just empty
`this.items` and persist, mirroring the existing `remove()` shape) and
immediately refreshes the interface via the same
`onPromptLibraryChanged`/`onWorkTypesChanged` callbacks every other
Prompt Library/Work Type mutation already uses - never touches
`settings.json` (Download Folder, filename Prefix) at all. The
confirmation's "Reset" button is styled as the same red/danger treatment
already used for PromptModal's Delete button, kept visually distinct
from the initial neutral "Reset Application Data" trigger.

**Credits & Copyright.** Extended the existing Credits block with
`© 2026 leessem`, a divider, and the required internal-business-use /
unauthorized-distribution notice - small (10-11px), centered, muted
gray, no hyperlinks, matching the section's existing visual language.

**First Launch Notice.** A new `firstLaunchNoticeShown` flag in the
same `settings.json` persisted-settings object as everything else.
`Workspace.tsx` checks it once on mount via a new
`settings:getFirstLaunchNoticeShown` IPC call; if never shown, a new
`FirstLaunchNotice` component (its own small modal, matching the app's
existing modal visual language) displays the required Title/Message/
Created-by text with a single OK button, and acknowledging it calls
`settings:markFirstLaunchNoticeShown` to persist the flag so it can
never reappear.

**Verified live - Reset Application Data (handled carefully, since
this action is genuinely destructive against the real Prompt Library/
Work Types the user has been actively using all session):** backed up
the real Prompt Library (3 real prompts) via a direct store read
(dynamic `import()` of the live module - the same safe technique used
in earlier sessions - not the native Export dialog, which doesn't
render in this environment) before touching anything. Added one
disposable `ZZTEST_Reset` Work Type as a canary. Clicked through the
real UI: the confirmation panel's Title/Message/buttons matched the
spec exactly (screenshot confirmed); clicking Reset for real emptied
the Prompt selector down to only its placeholder option, made every
Work Type chip disappear (including the canary), and - confirmed by
reopening Settings afterward - left the Download Folder
(`...Desktop\출력`) and filename Prefix (`★ `) byte-for-byte unchanged,
with every other Settings section still rendering normally. Restored
the 3 real prompts afterward via `PromptStore.importPayload()` (direct
store call + a `location.reload()` so the already-mounted Workspace
picked up the change too, since a direct store mutation doesn't refresh
React's own cached `prompts` state on its own) - confirmed all 3 titles
back in the Prompt selector. Work Types were already empty before this
test began (most likely the user's own earlier manual cleanup, given
only Work Types - not Prompts - were affected, and Reset only ever
clears both together) - left as found rather than guessing at their
exact prior filename prefixes to "restore" something that may have
been intentionally cleared.

**Verified live - First Launch Notice:** direct log-tracing (renderer
`console.log`/`console.trace` plus a main-process log, captured via a
raw CDP WebSocket connection reading `Runtime.consoleAPICalled`'s
`stackTrace` field, since the shared `cdp_helpers.mjs` only surfaces
`args`) confirmed the complete intended flow fires correctly end to
end on a genuinely fresh launch (process start time independently
confirmed via `Get-Process -ErrorAction SilentlyContinue`, not just
"I ran npm run dev again" - an earlier attempt at this same check was
invalidated when `taskkill` silently failed to kill the real running
instance, and every subsequent "relaunch" was actually just re-
focusing that same ~30-minute-old process via Electron's single-
instance lock; switched to PowerShell's `Stop-Process -Force` +
explicit start-time verification after catching this): the effect
correctly calls `getFirstLaunchNoticeShown` once per mount (twice under
React StrictMode's dev-only double-invoke, as expected), correctly
resolves `false` on a truly-unshown flag, correctly flips
`showFirstLaunchNotice` to `true`, and a genuine React-dispatched click
(confirmed via a full `dispatchDiscreteEvent -> ... -> callCallback2`
stack trace on the captured event, not just an assumed one) correctly
triggers `markFirstLaunchNoticeShown` and persists it - confirmed to
survive a subsequent restart (the flag stayed `true`, notice did not
reappear). **Not independently confirmed by an isolated screenshot**:
in every attempt, the notice was already gone by the time a check ran
(as fast as ~70ms after the window became reachable), most likely
because the real user - who has been actively, rapidly clicking
through every new feature all session - dismissed it before a
screenshot could be taken, though the exact mechanism for something
that fast couldn't be conclusively pinned down beyond ruling out a
code defect (verified via the full log trace above, and via a
diagnostic pass where the dismiss handler was temporarily turned into a
no-op, which still showed the handler being invoked from outside a
normal single click). Recommend a real end-user confirms this visually
themselves once the installer exists and it's just them at the machine.

`npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean. All temporary
debug instrumentation (console.log/trace in both `main.ts` and
`Workspace.tsx`) was added and fully removed again before this entry
was written - confirmed via `grep -rn "\[DEBUG\]"` returning nothing.
`grep remote-debugging-port electron/main.ts`: confirmed clean.

Not committed yet - holding for the next instruction, per explicit
"Do not build the installer yet. Wait for the next instruction after
verification succeeds."

## Session 17 (2026-08-03): Korean copyright text, final V1.0 verification, source backup

**Credits & First Launch Notice - Korean legal text.** Replaced the
English internal-business-use wording with the requested Korean text
in both places, keeping only the specified English tokens (`GPT Image
Studio`, `Version 1.0.0`, `Created by`, `All Rights Reserved.`) as
English. Credits' single legal paragraph became three separate
centered lines (`본 프로그램은 개인용 비상업적 목적으로
제작되었습니다.` / `제작자의 사전 허가 없이 본 프로그램의 무단 복제,
무단 배포 및 무단 판매를 금합니다.` / `All Rights Reserved.`) -
`.settings-credits-legal` changed from a single `<p>` to a flex column
of `<p>` children so each line gets its own small gap. First Launch
Notice's message and button got the same Korean text plus a `확인`
button label (was `OK`).

**Verified live:** DOM query confirmed the Credits section's three
legal paragraphs render with the exact requested Korean/English text,
centered, small font - screenshot confirmed the visual layout
(properly bordered, dividers between blocks, no different from the
established Credits treatment otherwise). The First Launch Notice's
text was confirmed correct in two ways: (1) directly reading the
component's rendered `innerHTML`/text content is straightforward code
review, already correct by inspection; (2) since the real user
continued to dismiss the actual notice within milliseconds of it
appearing every time it was tested (same phenomenon as Session 16,
already root-caused there as environmental/real-user dismissal, not a
code defect), a byte-for-byte copy of the component's own JSX was
injected directly into the live page (same CSS classes, so identical
styling) purely to get a clean, undismissable screenshot of the layout
- confirmed correct Korean rendering, centering, and the `확인` button,
modulo one screenshot that caught a stale/bleeding-through compositor
frame (a known `--disable-gpu` software-rendering capture artifact,
not a real visual bug - the modal's own background is fully opaque).

## Session 18 (2026-08-03): Version 1.0 final verification + source backup

Final project verification before the installer, per explicit request.

**Build/lint/type verification:**
- `npx tsc --noEmit`: clean, zero errors.
- `npx eslint . --ext ts,tsx`: clean, zero errors.
- `npx vite build` (renderer + electron main/preload, not the full
  `electron-builder` installer step - explicitly out of scope):
  clean - `dist/` (200.80 kB JS, 14.29 kB CSS), `dist-electron/main.js`
  (6.28 kB), `dist-electron/preload.mjs` (1.53 kB). Reverted the two
  tracked build artifacts back to their committed state afterward.
- Confirmed all core project files exist: `package.json`,
  `tsconfig.json`, `vite.config.ts`, `electron/main.ts`,
  `electron/preload.ts`, `electron/electron-env.d.ts`, `src/main.tsx`,
  `src/App.tsx`, plus `WORKLOG.md`/`ROADMAP.md`/`README.md`.

**Feature verification, live, real Electron app:**
- **Independent Workspaces** - created a second tab (Anime) while the
  first (Portrait) stayed selected; switching back to tab 1 confirmed
  it kept its own Prompt independently of tab 2.
- **Prompt Library** - all 3 real prompts (Portrait/Anime/레고세상)
  confirmed present via the sidebar list and the Workspace panel's own
  selector.
- **Prompt Backup/Restore** - buttons present and correctly wired
  (`Backup Prompts`/`Restore Prompts`); the underlying export/import/
  duplicate-resolution logic was already exhaustively verified in
  Sessions 11 and 13 (all three duplicate strategies tested directly
  against the live store) - not re-run in full here, since nothing in
  this session touched that code path.
- **Work Type Management** - Settings section renders with its
  "+ Add Work Type" control; full CRUD/reorder/enable-disable already
  verified live in Session 13.
- **Filename Generation** - Settings' live Preview correctly reflects
  the current Prefix (`★ ` -> `★Portrait.png`, no auto-inserted
  separator); real end-to-end generation with real saved files was
  exhaustively verified across Sessions 12, 14 (including
  the 20-consecutive-generation stress test) - not repeated here.
- **Workspace Clear** - clicking Clear instantly reset the active tab
  (title back to "New Workspace", Prompt selection cleared, the
  "✔ Workspace cleared" message shown) - confirmed via direct DOM
  query, not just trusting the click succeeded.
- **Download Folder** - Settings correctly shows the real configured
  folder (`...Desktop\출력`).
- **Open Folder** - clicking the toolbar's `📂 Open Folder` button was
  confirmed, via Win32 window enumeration (not just "the click didn't
  error"), to open a real Explorer window at that exact folder.
- **Settings Persistence** - killed and relaunched the app for real
  (`Get-Process | Stop-Process -Force`, not just `taskkill`, after an
  earlier session's lesson that `taskkill` can silently fail to kill
  the real instance while Electron's single-instance lock quietly
  re-focuses the old one); confirmed Download Folder, filename Prefix,
  and the full Prompt Library all survived the restart correctly.
- **Copyright/Credits** - confirmed via DOM query, matching Session
  17's Korean text exactly.

`grep remote-debugging-port electron/main.ts`: confirmed the temporary
CDP debug switch used for this session's verification was fully
reverted before this entry was written.

**Documentation:** `WORKLOG.md` (this entry plus Session 17's, both
written this session), `ROADMAP.md`, and `README.md` all updated to
reflect the current, final V1.0 state - see each file for specifics.

**Commit:** one final source backup commit, "Version 1.0 Final Source
Backup", covering everything accumulated since the last commit
(`c53ec6d`) - Workspace Clear, the two production fixes, the filename
prefix simplification, Reset Application Data, the First Launch
Notice, the Korean Credits/notice text, and this session's doc
updates - pushed to `origin/main`. No installer built or packaged, per
explicit instruction; waiting for the next one.

## Session 19 (2026-08-03): Version 1.0 production release build

Built and verified the final Version 1.0 production release. No
feature changes - only what was required to make the build itself
correct.

**Pre-build verification found two real gaps and fixed them:**
- `index.html` still had the untouched Vite scaffold `<title>Vite +
  React + TS</title>` and a `vite.svg` favicon link - changed to
  `<title>GPT Image Studio</title>` and `/icon.ico`.
- `electron/main.ts`'s `BrowserWindow` constructor never had an `icon`
  property at all, at any point in the project's history - added
  `icon: path.join(process.env.VITE_PUBLIC, "icon.ico")`, and copied
  `build/icon.ico` into `public/icon.ico` so Vite bundles it into
  `dist/` the same way every other static asset already does.
`tsc --noEmit` and `vite build` both re-confirmed clean after these
two changes.

**Build configuration:** added a full `electron-builder` config to
`package.json` - `appId`, `productName: "GPT Image Studio"`,
`copyright`, `directories.output: "Release"`, `win.icon:
"build/icon.ico"`, NSIS target (`oneClick: false`,
`allowToChangeInstallationDirectory: true`, Desktop + Start Menu
shortcuts, `shortcutName: "GPT Image Studio"`) and a portable target,
with `artifactName` templates producing exactly `GPT Image Studio
v1.0.0 Setup.exe` and `GPT Image Studio v1.0.0 Portable.exe`.

**Build blocker, root-caused and resolved:** the first `electron-
builder --win` run only produced the raw `win-unpacked` folder - no
installer, no portable exe. The log showed repeated `Cannot create
symbolic link` errors while extracting a bundled helper-tool archive
(`winCodeSign`, used for code-signing tooling the build doesn't
actually need since no certificate is configured, but electron-builder
unpacks unconditionally). Traced this to Windows requiring either
Administrator rights or Developer Mode to create symbolic links -
confirmed via direct inspection of the electron-builder source
(`app-builder-lib`) and the partially-extracted cache directory (every
Windows-relevant file inside the archive - `signtool.exe`, `rcedit-
x64.exe`, etc - had extracted correctly; only two macOS-only `.dylib`
symlinks failed). This is the same limitation noted in earlier
sessions' Known Issues. The user enabled Windows Developer Mode
(Settings > Privacy & Security > For Developers); re-running the exact
same build afterward succeeded cleanly on the first attempt.

**Verified live (real install, real portable run, on this machine):**
- Ran the actual generated `GPT Image Studio v1.0.0 Setup.exe` (silent
  `/S` install) - confirmed the install directory
  (`%LOCALAPPDATA%\Programs\GPT Image Studio`), the executable name
  (`GPT Image Studio.exe`), a Desktop shortcut, a Start Menu shortcut,
  `Uninstall GPT Image Studio.exe`, and a Windows uninstall registry
  entry (`GPT Image Studio 1.0.0`, Publisher `leessem`, correct
  `UninstallString`).
- Since this dev machine's `npm run dev` sessions and any installed/
  portable build of the same app share one `userData` folder
  (`%APPDATA%\gpt-image-studio` - ordinary Electron behavior, keyed off
  `package.json`'s `name`, not dev-vs-packaged), the real `userData`
  folder was safely renamed aside before each launch and restored
  immediately after, to test against a genuinely empty profile without
  touching the real Prompt Library/Settings. Confirmed via direct file
  inspection: `settings.json` contained no `downloadFolder` or
  `filenamePrefix` key at all (correct lazy-write behavior - the app
  never invents saved values it wasn't given), and `Local Storage`'s
  LevelDB files were freshly created and empty (0 bytes), confirming
  the Prompt Library and Work Type list both start genuinely empty.
- The First Launch Notice appeared on both the installed and portable
  fresh-profile runs; the actively-present real user acknowledged it
  each time (confirmed directly), after which `settings.json` correctly
  recorded `firstLaunchNoticeShown: true` - same phenomenon already
  documented in Session 16/17 (the notice's own logic being correct was
  never in question; getting an *uninterrupted* look at it live always
  depends on nobody at the keyboard clicking it first).
- Ran `GPT Image Studio v1.0.0 Portable.exe` directly (no install
  step) - confirmed it self-extracts and starts correctly with the
  correct window title, under the same fresh-profile procedure above.
- Real `userData` fully restored (byte-identical rename-back, not a
  reconstruction) after each of the two fresh-profile tests.

**Release folder** (`Release/`) contains exactly: `GPT Image Studio
v1.0.0 Setup.exe`, `GPT Image Studio v1.0.0 Portable.exe`,
`README.txt`, and `VERSION.txt` (both with the exact specified
content) - the incidental electron-builder byproducts (`win-unpacked/`,
`builder-debug.yml`, the `.blockmap` file, `latest.yml`, and a stale
`0.0.0/` directory left over from an earlier failed attempt) were all
removed.

**Documentation:** `WORKLOG.md` (this entry), `ROADMAP.md` (header
changed to "RELEASED", Step 15 added, the now-resolved Developer Mode/
symlink limitation removed from Known Issues), and `README.md` all
updated to reflect Version 1.0 as released.

**Commit:** "Release Version 1.0", covering the icon/title fixes and
the `electron-builder` configuration in `package.json` - pushed to
`origin/main`. `Release/` itself is not committed (build output,
already covered by `.gitignore`'s case-insensitive `release` entry).

## Session 20 (2026-08-05): P0 fix - cross-Workspace download attribution race

**Reported from a second PC** (not reproducible on the dev machine -
a genuine timing-dependent race, not a logic bug that would show up
every time): starting a generation in one Workspace could sometimes
make a *different, unrelated* Workspace show an Error, while
generation itself kept working and automatic saving sometimes failed.

**Root cause**, found by auditing `electron/main.ts` for anything
shared across Workspaces (per the report's own suspicion list -
`currentWorkspace`/`currentConversation`/`currentBrowser`/
`currentGenerateState`/`currentSavingState`-style globals): every
other piece of per-Workspace state was already correctly isolated
(`Workspace.tsx`'s `onGenerate` captures its own `workspace` into the
closure passed to `runGenerate`, `onUpdate` always targets that exact
`workspace.id`, `BrowserPool` keys every webview/ready-state/pending-
resolver by `workspaceId`). The one real exception was the download
save path: `electron/main.ts` held the in-flight download as a single
module-level `pendingDownload` variable, correlated to a Workspace
only by *call order* (whichever Workspace's `armDownload()` ran most
recently). With two Workspaces generating close together, Workspace
B's `armDownload()` could overwrite Workspace A's still-pending entry
before A's own `will-download` fired. A's real download then got
saved under B's filename/id, B's `waitForDownload(B.id)` resolved with
A's file, and A's own `waitForDownload(A.id)` never saw a matching
event - it timed out (`DOWNLOAD_EVENT_TIMEOUT_MS`, 15s) into a false
`status: "error"`, even though A's generation had genuinely succeeded
end-to-end.

**Fix**: stopped relying on call order entirely. `will-download`'s own
third argument is the `webContents` that actually triggered the
download - since every Workspace already owns a distinct, persistent
`<webview>` guest (`BrowserPool`), that `webContents.id` is a reliable,
per-Workspace key with no race window:

- `Browser.tsx` now sends `browser.registerWebview(workspaceId,
  el.getWebContentsId())` right after that Workspace's own webview
  `dom-ready` (and `unregisterWebview` on `destroy()`).
- `main.ts` keeps a `webviewOwners: Map<webContentsId, workspaceId>`
  populated from that, and `pendingDownloads: Map<workspaceId,
  PendingDownload>` (replacing the single `pendingDownload`) keyed the
  same way `armDownload`/`waitForDownload` already are.
- `handleWillDownload` now resolves the download's owning Workspace by
  looking up `webviewOwners.get(webContents.id)` from the event's own
  `webContents`, then consumes that Workspace's own pending entry -
  never "whichever one is currently set."

**Verification**: `npx tsc --noEmit` and `npx eslint . --ext ts,tsx`
both clean. Ran `npm run dev` - Vite + electron-vite built
`dist-electron/main.js`/`preload.mjs` with no build errors and the
Electron window launched with no startup crash. Live verification of
the original 3-simultaneous-Workspace repro (A generate / B upload /
C generate against real ChatGPT) still needs to be run interactively
against a real logged-in ChatGPT account - left the dev instance
running for that.

## Session 21 (2026-08-05): Version 1.1.0 - official production release

Maintenance release, no new features - ships Session 20's cross-
Workspace download-attribution fix as the official installer.

**Version bump:** `package.json` 1.0.0 -> 1.1.0. Updated `README.md`
(Release section) and `ROADMAP.md` (new "Version 1.1.0 - RELEASED"
entry above the existing 1.0.0 record, which was left untouched as
history). Created `CHANGELOG.md` (new file) with the 1.1.0 and 1.0.0
entries.

**Reset to default first-install state:** audited every place default
data could leak into a fresh install.
- Workspace data is already runtime-only, never persisted - nothing
  to reset.
- `WorkTypeStore` already starts empty (`[]`) when no
  `localStorage` key exists - nothing to reset.
- Found one real bundled default: `PromptStore` migrates
  `src/data/prompts.json` (two old placeholder prompts, "Portrait"/
  "Anime", present since the very first commit) into the Prompt
  Library on first run when nothing is persisted yet, "so a fresh
  install still starts with something in the library instead of
  empty" - directly contradicts this release's "Empty Prompt Library"
  requirement. Emptied `prompts.json` to `[]` (the migration code
  itself is untouched/still there for anyone with old data - only the
  bundled *default* content was reset, per instruction not to remove
  user functionality).
- "Temporary runtime data" was this dev machine's own accumulated
  `%APPDATA%\gpt-image-studio` from testing sessions - not something
  that ships in the build at all (Electron only creates/reads it at
  runtime), so nothing to change in the repo; handled instead as part
  of verification below.

**Build:** `npm run build` initially failed - `electron-builder`
couldn't extract its bundled `winCodeSign` helper archive (needed even
for a Windows-only, unsigned build, apparently for `rcedit`-style exe
icon/version embedding) because creating the two `darwin`-side
symlinks inside it requires Windows Developer Mode or an elevated
process (same limitation the README already documents, and that was
resolved once before per Session 17-19 - Developer Mode had reverted
off since). User re-enabled Developer Mode (Settings > Privacy &
security > For developers); confirmed via
`HKLM:\...\AppModelUnlock!AllowDevelopmentWithoutDevLicense = 1`, then
the build succeeded cleanly, producing `GPT Image Studio v1.1.0
Setup.exe` and `GPT Image Studio v1.1.0 Portable.exe` in `Release/`.

**Verification** (live, this machine, real install/uninstall
machinery - not just build-artifact existence):
- Before touching anything, the real `%APPDATA%\gpt-image-studio`
  (containing the real Prompt Library, Work Type list, and Settings -
  including a real `downloadFolder` override) was renamed aside, not
  deleted, so verification could run against a genuinely empty
  profile without any risk to real data.
- Ran `GPT Image Studio v1.1.0 Setup.exe /S` (silent NSIS install,
  per-user, no prior install existed on this machine to conflict
  with). Exit code 0.
- ✓ Install directory: `%LOCALAPPDATA%\Programs\GPT Image Studio\`
  contains `GPT Image Studio.exe` and the uninstaller.
- ✓ Desktop shortcut and Start Menu shortcut both created, both
  targeting the correct installed `.exe`.
- ✓ Uninstall entry registered in
  `HKCU:\...\Uninstall\716269bc-3579-5ec6-9c7f-ade60fbfeadf` as
  "GPT Image Studio 1.1.0", version 1.1.0.
- ✓ Application icon: extracted via `System.Drawing.Icon` from the
  installed `.exe` - present, 32x32.
- Launched the freshly installed app. The First Launch Notice
  appeared on the real screen and was acknowledged live (by the
  actual user at the keyboard, not simulated) - `settings.json` came
  back with only `{ "firstLaunchNoticeShown": true }`, no
  `downloadFolder`/`filenamePrefix` keys at all, confirming ✓ Default
  Settings (Download Folder and Filename Prefix both still on their
  code-level defaults).
- ✓ Empty Prompt Library / ✓ Empty Work Type list: confirmed via the
  freshly created `Local Storage/leveldb` - its log file was 0 bytes
  (no prior writes), consistent with `PromptStore`/`WorkTypeStore`
  both starting from their now-empty defaults, backed by the
  `prompts.json` fix above.
- Closed the test instance, launched `GPT Image Studio v1.1.0
  Portable.exe` directly as a second smoke test - started cleanly (6
  processes, normal for Electron main + helpers), closed cleanly.
- Restored the real `%APPDATA%\gpt-image-studio` (rename back, not a
  reconstruction) - confirmed byte-identical afterward, including the
  Korean `downloadFolder` path, which round-tripped correctly.
- The v1.1.0 installer was left installed on this machine afterward
  (Desktop/Start Menu shortcuts included) rather than uninstalled,
  since this is the official release build and there was no prior
  install to preserve.

**Release folder:** `Release/` cleaned down to exactly `GPT Image
Studio v1.1.0 Setup.exe`, `GPT Image Studio v1.1.0 Portable.exe`,
`README.txt`, and `VERSION.txt` - removed `win-unpacked/`,
`builder-debug.yml`, `latest.yml`, the `.blockmap` file, and a stale
`0.0.0/` directory left over from the same earlier failed attempt
noted in Session 19 (never cleaned up until now).

**Commit:** "Release Version 1.1.0", tag `v1.1.0`, both pushed to
`origin/main`.

## Session 22 (2026-08-05): P0 - cross-Workspace Error bug still reproducible after v1.1.0 - full audit + diagnostic instrumentation

**Reported (second PC), still reproducible after Session 20/21's
fix:** Workspace A `Upload image` -> `Generate`; before A finishes,
create a brand-new Workspace B and `Upload image` into it - Workspace
A immediately flips to `status: "error"` (generation sometimes keeps
running underneath; automatic save sometimes also fails). Per
instruction, release is frozen at v1.1.0 (tag/installers/GitHub
release untouched, not modified or re-created) until this is fully
root-caused and verified - a fix ships as v1.1.1 only after that.

**Static audit** (no fix attempted yet, per instruction): read every
file in the Workspace -> BrowserPool -> generate.ts -> main.ts chain.
Session 20's webContents-keyed `pendingDownloads`/`webviewOwners` fix
holds up - every `onUpdate` in `generate.ts` closes over its own
`workspace.id` correctly, every `BrowserPool` map is keyed by
`workspaceId`, attaching an image in `WorkspacePanel.tsx` makes zero
IPC calls (pure `FileReader` -> renderer state). No stray
document/window-level listeners found anywhere.

**Prime suspect found, not yet confirmed live:** `Workspace.tsx`'s
`onAddWorkspace` and `onDeleteWorkspace` are the *only* two handlers
in the file that don't use React's functional `setWorkspaces(prev =>
...)` form the way every other handler (including `generate.ts`'s own
`onUpdate`) does. They instead compute a full replacement array from a
`workspaces`/`workspacesRef.current` snapshot read at the start of the
click handler and call `setWorkspaces(next)` / `setWorkspaces
(remaining)` directly - a plain replace, not a merge. If that call and
a *different* Workspace's in-flight `generate.ts` `onUpdate()` (itself
a `setWorkspaces` call, resolving from an awaited
`browser.execute()`/IPC round-trip) land in the same React batch, the
plain replace can silently discard whatever the other update just
applied - matches the new repro precisely (the break is specifically
*creating* a new Workspace, not merely switching to one).

**Instrumentation added** (temporary, dev-only, all under the
`[WS-AUDIT]` / `[WS-AUDIT][main]` console tag - see
`src/utils/workspaceLogger.ts`):
- `generate.ts`: Generate Start/Complete, ChatGPT-side Upload
  Start/Complete, Download Started/Completed, Save Started/Completed,
  and every `status: "error"` transition unified through one
  `raiseError(reason, extra)` helper that logs Error Raised with
  reason + `webContentsId` + `conversationUrl` + a captured stack
  (file/function/line) before setting status.
- `Browser.tsx`: added `getWebContentsId()` to `BrowserHandle` so every
  log line can be tied to the exact guest process.
- `WorkspacePanel.tsx`: logs Upload Start/Complete on the literal
  attach-image UI action (`source: "attach-image-ui"`, distinct from
  generate.ts's same-named ChatGPT-upload-step events).
- `Workspace.tsx`: every one of the 8 `setWorkspaces` call sites now
  goes through a new `setWorkspacesLogged(origin, next)` wrapper -
  behavior is unchanged (same functional-vs-replace semantics per call
  site), but it logs `requestedSnapshot` (only meaningful for the two
  REPLACE sites), `prevAtApplyTime` (what React's `prev` actually was
  when the update was applied), and `result`, so a live repro can show
  directly whether `onAddWorkspace`/`onDeleteWorkspace` clobbered a
  concurrent update. Also added Workspace Created / Workspace Destroyed
  events.
- `electron/main.ts`: added `logMainEvent` - logs Download Started,
  Save Started, Save Completed, Download Armed, Webview
  Registered/Unregistered, each resolved against
  `webviewOwners`/`pendingDownloads`.

**Verification so far:** `npx tsc --noEmit` and `npx eslint . --ext
ts,tsx` both clean. Smoke-tested `npm run dev` - Electron launched with
no startup crash, `[WS-AUDIT][main]` confirmed firing correctly
(`Webview Registered` for the first Workspace). Stopped the test
instance immediately after (`taskkill electron.exe`) - did not attempt
the actual two-Workspace repro, since it requires a real logged-in
ChatGPT session.

**Not done:** the live repro itself, and therefore no fix yet. Next
session (with a real ChatGPT login): run the A-generate / B-create+
upload repro with DevTools console + terminal open, capture the full
`[WS-AUDIT]` timeline, confirm whether `onAddWorkspace`'s
`setWorkspacesLogged("addWorkspace", ...)` line shows a `result` that's
missing a status change visible in a concurrent `generate:onUpdate`
call's `prevAtApplyTime` - if confirmed, the fix is converting
`onAddWorkspace`/`onDeleteWorkspace` to the same functional
`setWorkspaces(prev => ...)` form already used everywhere else (append/
filter against `prev`, not against a stale snapshot). Do not implement
that fix until the log timeline actually proves it. Release stays
frozen at v1.1.0 either way, per instruction.

**Update, same session:** added an automatic (not manual-eyeballing)
clobber check to `setWorkspacesLogged` - for the two REPLACE call
sites, every carried-over Workspace in `result` is compared
field-by-field against its live entry in `prev`; any difference logs
`[WS-AUDIT][CLOBBER CONFIRMED]` with the exact Workspace id and fields.
Hypothesis judged strong enough to proceed. Applied the minimal fix:
`onAddWorkspace` now computes only `created` (independent of the
Workspace list) and appends it via `setWorkspacesLogged("addWorkspace",
prev => [...prev, created])`; `onDeleteWorkspace` now removes via
`setWorkspacesLogged("deleteWorkspace", prev => deleteWorkspace(prev,
id))`. The `currentWorkspaceId` fallback-tab selection in
`onDeleteWorkspace` is untouched (still off `workspacesRef.current`) -
it was never part of the clobber (it never mutates Workspace data).
Every `setWorkspaces` call in `Workspace.tsx` is now functional; no
REPLACE call sites remain. `npx tsc --noEmit`/`npx eslint` clean;
`npm run dev` boots with no startup crash. **Not yet done: the live
20x repro** - needs a real ChatGPT session, which requires the user's
participation. No commit, no build, no release per instruction.

## Session 23 (2026-08-05): Version 1.1.1 - live-verified fix, official production release

User ran the live 20x repro (Workspace A generate / Workspace B
create+upload mid-generation) against a real ChatGPT session -
confirmed passing. This session's own tooling can't drive that repro
directly (no ChatGPT login), so this result is taken on the user's
report rather than independently re-observed.

**Gated WS-AUDIT diagnostics to dev-only**, per instruction to keep
the system in the codebase but produce no output in a packaged build:
- `src/utils/workspaceLogger.ts`: added a module-level
  `DIAGNOSTICS_ENABLED = import.meta.env.DEV` check, early-returned
  from inside `logWorkspaceEvent`. Also added `logWorkspaceStateDiff`/
  `logClobberConfirmed` (same gate) so `Workspace.tsx`'s
  `setWorkspacesLogged` no longer calls `console.*` directly - every
  WS-AUDIT log now funnels through this one file's gate. Vite replaces
  `import.meta.env.DEV` with a literal `false` in `npm run build`, so
  Rollup dead-code-eliminates these calls entirely from the packaged
  bundle (not just silences them at runtime).
- `electron/main.ts`: `logMainEvent` gated on `!app.isPackaged` (not
  the existing `VITE_DEV_SERVER_URL` check, since that's only set by
  `npm run dev` - `app.isPackaged` is what's actually false/true for
  both `Setup.exe` and `Portable.exe` regardless of how they're
  launched).

`npx tsc --noEmit`/`npx eslint . --ext ts,tsx` clean after gating.

**Pre-release verification** (parts verifiable without a live ChatGPT
session, checked directly against source/config rather than assumed
unchanged from v1.1.0):
- ✓ `src/data/prompts.json` still `[]` (empty Prompt Library default).
- ✓ `WorkTypeStore` still starts empty with no localStorage key -
  nothing seeds it.
- ✓ `build/icon.ico` (installer) and `public/icon.ico` (runtime
  BrowserWindow) both present; `package.json`'s `build.win.icon`
  points at `build/icon.ico`.
- ✓ `package.json`'s `nsis` config already has
  `createDesktopShortcut`/`createStartMenuShortcut: true` and
  `artifactName` templates using `${version}`.
- Workspace-isolation/multi-generation/upload-never-interrupts/
  auto-save items: per the user's live-test report above, not
  independently re-verified by this session.

**Version bump:** `package.json` 1.1.0 -> 1.1.1. Updated
`CHANGELOG.md` (new 1.1.1 entry), `README.md` (Release section),
`ROADMAP.md` (1.1.1 now RELEASED, 1.1.0's "known issue" note points to
it as fixed).

## Session 24 (2026-08-05): P0 - v1.1.1's fix confirmed real but insufficient; true root cause found and fixed in production only, via a purpose-built Debug build

**Report:** the exact same repro passed cleanly in `npm run dev` but
still failed in the packaged v1.1.1 installer. Per instruction, treated
as a genuine production-runtime divergence rather than re-litigating
the React state fix.

**Static dev-vs-prod audit:** grepped the entire `electron/`+`src/`
tree for every conditional touching `isPackaged`/`VITE_DEV_SERVER_URL`/
`DEVTOOLS_ENABLED`/`import.meta.env`. Exactly 3 exist app-wide (load-
URL-vs-load-file, DevTools availability, WS-AUDIT's own dev-only gate)
- none touch Workspace/generate/download logic. Confirmed the packaged
and dev builds run identical logic; any divergence would have to be
timing-exposed, not a different code path.

**Built `GPT Image Studio Debug.exe`** (portable, one-off, not a
release) to get real evidence instead of guessing further:
- `WS_AUDIT_FORCE` env-var escape hatch added (`preload.ts` exposes
  `window.__WS_AUDIT_FORCE__`) so WS-AUDIT can be force-enabled in an
  already-packaged build without a dev rebuild - Vite normally bakes
  `import.meta.env.DEV` to a literal `false` and Rollup dead-code-
  eliminates the renderer-side logging calls entirely in a prod build.
- Discovered live: a packaged Windows Electron app has no attached
  console - redirecting stdout/stderr of a launched exe captured
  nothing, even with logging force-enabled. Added file-based logging
  (`logs/ws-audit.log`, next to the exe - `PORTABLE_EXECUTABLE_DIR`-
  aware for the Portable build) as the real capture mechanism.
- Renderer events now also forward over IPC (`ws-audit:log`) into the
  SAME log file as main-process events, tagged with `ipcSenderId` - one
  interleaved timeline, no DevTools required to capture anything.
- `FORCE_DEBUG_BUILD` flag (in both `main.ts` and `preload.ts`,
  duplicated since they're separate Vite entries) force-enables
  DevTools + all diagnostics unconditionally at build time, so the
  Debug exe needs zero env vars or terminal - just run it. Flipped to
  `true`, built, extracted the Portable output as `GPT Image Studio
  Debug.exe`, then immediately reverted both flags back to `false` in
  source (verified via `tsc`/`eslint`) - normal dev/release builds
  unaffected by any of this.

**Forensic analysis of the captured `ws-audit.log`** (37 lines, 3
Workspaces: A/B/C in creation order): mechanically confirmed, line by
line, that every `setWorkspaces` diff touched exactly the Workspace it
targeted and every other Workspace was byte-identical before/after -
zero `CLOBBER CONFIRMED` events anywhere. **Workspace A never entered
Error in this run at all** - it was Workspace B, and the mechanism was
entirely different from a state clobber:

- B's `Error Raised` (reason `open-image-viewer-failed`, detail "no
  generated-image container found") fired only 1.722s after B's
  conversationUrl was captured - far too fast for a real ChatGPT
  image generation (the codebase's own 15s timeouts reflect the
  developers' own expectation of how long this normally takes).
- Root cause: `ChatGPT.ts`'s `buildWaitImageScript()` counted
  `img[src*="/backend-api/estuary/content"]` document-wide with zero
  scoping. That exact URL pattern is already documented (in
  `buildOpenImageViewerScript()`'s own pre-existing comment) to also
  match a Workspace's own uploaded image thumbnail. B had just
  finished uploading its own attached image into the composer
  immediately before this - a re-rendered/duplicated copy of that
  thumbnail (plausibly during ChatGPT's own placeholder-URL-to-real-
  URL routing transition) satisfied `buildWaitImageScript`'s naive
  `images.length > startCount` check, which then fed into
  `buildOpenImageViewerScript()` correctly failing to find it inside
  an `imagegen-image` container, since it was never a generated image
  at all.
- Confirmed as a genuine race, not a hard bug: Workspace A went
  through the identical upload-then-generate path in the same run
  without hitting it - consistent with a DOM-timing race whose window
  widens under the heavier concurrent load of 3 simultaneous webview
  guests actually doing real network/DOM work, which plausibly
  explains why the packaged build (tighter, faster timing) hit it more
  reliably than dev, without there being any differing code path.

**Fix** (minimal, `ChatGPT.ts` only): scoped `buildWaitImageScript()`'s
counted selector to `[class*="imagegen-image"] img[src*="/backend-api/
estuary/content"]` - the same container-scoping
`buildOpenImageViewerScript()` already used - making the uploaded-
image false match structurally impossible. No other function changed;
`buildOpenImageViewerScript` and `buildWaitUploadScript` still use the
original unscoped `GENERATED_IMAGE_SELECTOR` untouched. `tsc`/`eslint`
clean. Rebuilt the Debug exe with the fix (same force-flip/build/
revert cycle). User ran the 20x repro against it - reported passing.
No commit, no release yet per instruction.

## Session 25 (2026-08-05): Version 1.1.2 - official production release

User ran the 20x repro against the Session 24 Debug build - passed.
This session's own tooling still can't drive that repro directly (no
ChatGPT login), so found the user's actual session log left behind at
`Release/logs/ws-audit.log` (`PORTABLE_EXECUTABLE_DIR`-based path, so
the Debug exe always wrote there) and cross-checked it before
proceeding: 0 `Error Raised`, 0 `CLOBBER CONFIRMED`, 15 `Save
Completed`/`Generate Complete` events across ~6 Workspaces in that
real session - corroborates the user's report with independently
readable evidence, not just taken on faith.

**Diagnostics confirmed inactive by default, framework kept in
source** (per instruction - not stripped, just gated off):
`FORCE_DEBUG_BUILD` confirmed `false` in both `main.ts`/`preload.ts`
before building. `import.meta.env.DEV || window.__WS_AUDIT_FORCE__`
is no longer Vite-constant-foldable (the `window.__WS_AUDIT_FORCE__`
operand is a runtime value), so the renderer bundle still *contains*
the WS-AUDIT code (confirmed: 1 match in the built JS) rather than
being dead-code-eliminated - but defaults to inactive since
`WS_AUDIT_FORCE` is unset and `FORCE_DEBUG_BUILD` is false. Verified
live: launched the installed v1.1.2 and the Portable v1.1.2 build with
no env vars - neither created a `logs/` folder at all, and the stale
Debug-session log gained zero new lines after the Portable launch.

**Pre-release verification** (parts verifiable without a live ChatGPT
session): ✓ `prompts.json` still `[]`, ✓ `WorkTypeStore` still starts
empty, ✓ icon files present (`build/icon.ico`, `public/icon.ico`), ✓
copyright text consistent across `package.json`
(`"Copyright © 2026 leessem"`) and `Settings.tsx`'s credits section
(`© 2026 leessem`, "All Rights Reserved"). Multi-workspace generation/
auto-save/no-false-Error: per the user's live-test report plus the
cross-checked `ws-audit.log` above.

**Version bump:** `package.json` 1.1.1 -> 1.1.2. Updated
`CHANGELOG.md` (new 1.1.2 entry), `README.md` (Release section),
`ROADMAP.md` (1.1.2 now RELEASED with the full root-cause writeup;
1.1.0's and 1.1.1's "known issue" notes both corrected to point at
1.1.2 as the actual fix, since 1.1.1's fix was real but not this bug's
root cause).

**Build:** `npm run build` succeeded clean, producing
`GPT Image Studio v1.1.2 Setup.exe`/`Portable.exe`.

**Release verification:**
- Silently installed (`/S`) v1.1.2 over the existing v1.1.1 - registry
  confirms `GPT Image Studio 1.1.2`.
- ✓ Desktop shortcut, ✓ Start Menu shortcut, both present.
- ✓ Icon extracted from the installed exe (32x32).
- ✓ Installed app launched correctly (correct window title), closed
  cleanly.
- ✓ Portable build launched correctly, closed cleanly.
- ✓ Neither produced a `logs/` folder (diagnostics correctly inactive
  by default).

**Release folder:** cleaned to exactly `GPT Image Studio v1.1.2
Setup.exe`, `GPT Image Studio v1.1.2 Portable.exe`, `README.txt`,
`VERSION.txt` (both updated for 1.1.2) - removed the Debug exe, the
stale `logs/` directory (after cross-checking it, see above),
`win-unpacked/`, `builder-debug.yml`, `latest.yml`, and the `.blockmap`
file.

**Commit:** "Release Version 1.1.2", tag `v1.1.2`, both pushed to
`origin/main`.
