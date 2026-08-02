# ROADMAP

## P0 - Core Queue Automation (critical)

- [x] Wire Toolbar / JobTabs to `Project` state
- [x] Implement `ImageDrop` capture/display of generated images
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

## P1 - Reliability & Persistence (important, not yet done)

- [ ] Stress-test with a larger job count (5-10+) and/or a longer
      unattended run
- [ ] Unify the two persistence paths (localStorage autosave vs native
      `.gisp` save/open) - currently coexist unreconciled
- [ ] Implement the Settings feature (Toolbar button currently
      disabled, no feature behind it)
- [ ] Get `electron-builder` installer packaging working (currently
      fails on this machine - needs Windows Developer Mode or admin
      rights to extract bundled macOS code-signing tools)
- [ ] Investigate the gray CDP-style cursor artifact (explicitly
      deferred as low priority; root cause suspected to be Chromium's
      own DevTools inspect-mode, reachable because `openDevTools()` is
      called unconditionally on both the main window and the webview)

## P2 - Cleanup & Polish (nice-to-have)

- [ ] Wire up or delete the unused prompt-template-library code
      (`src/store/Promptstore.ts`, `src/data/prompts.json`,
      `PromptItem` type) - currently dead code
- [ ] Remove the duplicate seed file (`src/data/defaultJobs.ts` vs the
      one actually used at `src/components/data/defaultJobs.ts`)
- [ ] Prompt Library UI redesign (explicitly deferred until the queue
      was reliable - now unblocked)
- [ ] Set a real app icon (electron-builder currently falls back to
      the default Electron icon)
- [ ] Fill in `description`/`author` in `package.json` (electron-builder
      warns both are missing)
