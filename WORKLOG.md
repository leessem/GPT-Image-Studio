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
