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
