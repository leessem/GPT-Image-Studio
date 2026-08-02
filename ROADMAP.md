# ROADMAP

## NEXT SESSION - highest priority (2026-08-03 EOD)

Session ended mid-diagnosis. These two are the first things to pick up
tomorrow, in order - see WORKLOG "Session wrap-up: live upload-pipeline
investigation" for the exact state things were left in.

### P0-1: Independent Job WebViews with shared login

**Current issue:** Tabs still mirror the same ChatGPT conversation.
Jobs are not truly isolated, despite today's shared-partition/
conversationUrl correction landing and passing its (simulated)
verification.

**Target:**
- One WebView per Job.
- One shared persistent partition.
- One shared ChatGPT login.
- Independent conversations.

**Lead to check first:** stopping a background `npm run dev` does not
reliably kill the spawned `electron.exe` - five stray instances had
accumulated during today's testing before this was caught. Confirm
exactly one `electron.exe` process is running before doing any
Job-isolation testing; multiple live instances contending for the same
partition/localStorage could fully explain this symptom on its own.

### P0-2: Image upload automation

**Current issue:** the uploaded image is not actually attached inside
ChatGPT. Generate enters Error immediately for any Job with an
uploaded image (a Job with no image runs the full pipeline
successfully, confirmed today).

**Target pipeline:**
1. Upload image
2. Wait for upload confirmation
3. Insert prompt
4. Send
5. Generate
6. Download

**State left for tomorrow:** the pipeline is now instrumented with a
numbered step log (1-10) and rich failure diagnostics (selector,
DOM snapshot, reason) in `ChatGPT.ts`/`QueueRunner.ts`. A live CDP-driven
run today confirmed the failure is at Step 4/10 ("image injected") but
the exact `reason` string was not captured with full detail before the
session ended - re-run and read the real reason before changing
anything. Leading but **unconfirmed** hypothesis: `fetch(dataUrl)`
inside the injected script may be blocked by ChatGPT's page CSP.

## Architecture Change - 2026-08-02: Job-first

The application is pivoting from a "Prompt Library-first" workflow to a
**Job-first** architecture:

- **Job** is now the primary object. A Job represents one independent
  ChatGPT session and owns everything that session needs: an uploaded
  reference image, a selected prompt (copied from the Prompt Library),
  its own generation status, and its own generated result image.
- **Prompt Library** is demoted to a reusable template collection - a
  place to author/curate reusable prompt text, not the object the rest
  of the app is built around.
- Per-job workflow: **Create Job -> Upload Image -> Select Prompt ->
  Generate -> Auto Save -> Show Status**, each step scoped to that one
  Job, not the whole tab's queue.
- The browser-automation engine (`QueueRunner.ts` / `ChatGPT.ts`) is
  **not** being redesigned - "Generate" on a single Job runs the exact
  same unmodified automation, just scoped to a one-job queue instead of
  the whole tab. The tab-wide "Start Queue" bulk action is kept
  alongside it, unchanged.
- Known limitation carried into this change: the automation engine has
  no logic to attach an uploaded image into ChatGPT's composer - only
  the text prompt is submitted, exactly as before. A Job's "uploaded
  image" is UI/data-level only (local record, shown in the Job's
  detail view) until the automation engine is later extended to
  actually attach it - that extension is out of scope here.

## P0 - Core Queue Automation (critical) - done, baseline before this change

- [x] Wire Toolbar / JobTabs to `Project` state
- [x] Implement `ImageDrop` capture/display of generated images
      (superseded by Job-first: removed as a standalone global gallery,
      per-job result display took its place)
- [x] Wire native `.gisp` Open to Toolbar (Save/SaveAs already existed)
- [x] Real download-based image capture (click image -> viewer -> Download
      button -> Electron `will-download`), not reading image bytes out
      of the DOM
- [x] Fix prompt automation going silent on Start Queue (unchecked
      script result + send-button click/React-state race)
- [x] Language-independent download button selector (data-testid ->
      aria-label -> role -> SVG icon -> text; was previously
      English-text-only and broke on the Korean UI)
- [x] Fix `will-download` never firing (webview's partitioned session
      wasn't being listened to)
- [x] Close the image viewer (and confirm textarea regains focus)
      before advancing to the next queue item
- [x] Verify-and-retry message send using observable state (textarea
      empties / user message count / assistant message starts / send
      button generating-state transition) instead of fixed delays
- [x] Handle the multi-image "series" case where Save/Download becomes
      a menu instead of a direct button
- [x] Verify the downloaded file exists on disk (not just trusting the
      download-completed event) and store the path in `job.imagePath`
- [x] Full queue completes 3+ prompts end-to-end with zero manual
      interaction - verified across 3 consecutive full runs

## P0.5 - Prompt Library (superseded by Job-first, kept as infrastructure)

- [x] Redesign Prompt Library to show titles only, selecting one loads
      it into a read-only editor
- [x] Move prompt data into `PromptStore` as the single source of
      truth (UI never owns prompt content)
- [x] Full Prompt Library CRUD (Create/Edit/Delete/Save) with its own
      `localStorage` persistence, auto-reload on startup, 100+ prompt
      scale verified, display order preserved
- [x] Disable all automatic DevTools opening (Electron window +
      ChatGPT `<webview>`), gated behind a single `DEVTOOLS_ENABLED`
      flag for manual-only opening

## P1 - Job-first redesign (done)

- [x] Extend `Job` with `uploadedImagePath` and `selectedPromptId`
      (additive fields, `QueueRunner`/`ChatGPT.ts` untouched - verified
      zero diff on both files)
- [x] New `JobList` - primary navigation, titles/status only, replaces
      the old inline job-editing list embedded in the Prompt panel
- [x] New `JobDetail` - per-Job session view: upload image, select
      prompt from the Library (dropdown), Generate, status, result
      image
- [x] Per-Job "Generate" that runs only that Job through the existing
      `runQueue`/`QueueRunner` (scoped project adapter in
      `Workspace.onGenerateJob`, no changes inside the queue runner
      itself)
- [x] Prompt Library UI simplified down to template management only
      (Library + Editor, no more embedded Job queue list)
- [x] Removed the standalone global `ImageDrop` gallery (superseded by
      per-Job result display) and its unused drag/drop-upload state -
      deleted `ImageDrop.tsx`/`ImageDrop.css` entirely
- [x] Verified: `tsc`/`npm run lint` (`--max-warnings 0`)/`vite build`
      all clean; the scoped one-job adapter tested against the real
      `JobService` module (Node + esbuild bundle, no browser needed)
      confirms only the targeted job changes status/imagePath while
      sibling jobs and job order are untouched; `npm run dev` starts
      with no console errors
- [x] Known gap from the first pass, now closed - see "P0 fixes"
      below: independent per-Job webviews, and the uploaded image is
      actually submitted into ChatGPT.

## P0 fixes - 2026-08-03: two issues blocking the Job-first architecture

Found after P1 shipped: all Jobs shared one ChatGPT webview/session,
and a Job's uploaded image never reached ChatGPT. UI layout was
explicitly out of scope - fixed only these two.

- [x] ~~Independent ChatGPT Sessions per Job via one `<webview>`/
      partition per Job~~ - **this was wrong, corrected same day, see
      below.** A separate partition per Job means a separate browser
      profile - separate cookies/login per Job, not the "one login,
      many conversations" the requirement actually meant.
- [x] **Independent ChatGPT Sessions per Job, corrected** - back to a
      single `<webview>` on one shared partition (`persist:gpt-image-
      studio`) - one login, shared cookies/localStorage/session across
      every Job, exactly as before P0-1 ever existed. A Job's
      independence now comes from its own ChatGPT **conversation URL**
      (`Job.conversationUrl`), captured once after its first
      successful send and reused on every later run. `QueueRunner`'s
      "Activate Job" step navigates the one shared webview to
      `job.conversationUrl ?? CHATGPT_HOME_URL` (fresh new chat) before
      doing anything else, then waits for the composer to be ready
      (new, necessary - the shared webview now actually changes
      conversations, so the composer isn't guaranteed to exist the
      instant navigation resolves). Switching the selected Job in the
      UI navigates the same shared webview the same way. See WORKLOG
      "P0-1 correction" for full detail.
- [ ] **Image Upload Integration - implemented but confirmed BROKEN by
      a live run today.** The per-Job pipeline was built as: activate
      Job -> upload its image into ChatGPT (skipped if none) -> wait
      for the upload to complete -> insert prompt -> click send ->
      wait for image -> download -> verify on disk -> mark done. New
      `buildUploadImageScript`/`buildWaitUploadScript` in `ChatGPT.ts`
      simulate a drag-and-drop of the exact uploaded image (same data:
      URL as the Job's own preview) into the composer - there's no CDP
      access from `executeJavaScript`, so a file input's `.files`
      can't be set directly. **A real CDP-driven run confirmed every
      Job with an uploaded image fails at the image-injection step and
      goes straight to Error** - see "NEXT SESSION" at the top of this
      file and WORKLOG for full detail. Not done: confirming the exact
      failure reason, and fixing it.
- [ ] **Not yet verified live**: the upload-detection heuristic
      (`buildWaitUploadScript`) and the new composer-ready heuristic
      (`buildWaitComposerReadyScript`) were never checked against
      chatgpt.com's real DOM the way the download-button selectors
      were - likely need adjustment once exercised for real. Login
      persistence and per-Job conversation switching were spot-checked
      today (login persisted from an earlier session, no re-prompt) but
      full Job-isolation was NOT confirmed - see P0-1 above.

## P2 - Reliability & Persistence (still pending, unaffected by this change)

- [ ] Stress-test with a larger job count (5-10+) and/or a longer
      unattended run
- [ ] Unify the two persistence paths (localStorage autosave vs native
      `.gisp` save/open) - currently coexist unreconciled
- [ ] Implement the Settings feature (Toolbar button currently
      disabled, no feature behind it)
- [ ] Get `electron-builder` installer packaging working (currently
      fails on this machine - needs Windows Developer Mode or admin
      rights)
- [ ] Investigate whether any DevTools-adjacent cursor artifact remains
      now that automatic opening is disabled (previously suspected
      cause is gone; re-check before spending more time on it)

## P3 - Cleanup & Polish (nice-to-have)

- [ ] Prompt Library UI redesign (visual polish, now that it is a
      dedicated template-management screen)
- [ ] Set a real app icon (electron-builder currently falls back to
      the default Electron icon)
- [ ] Fill in `description`/`author` in `package.json` (electron-builder
      warns both are missing)
