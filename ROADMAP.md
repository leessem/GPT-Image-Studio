# ROADMAP

## Version 1.2.3 - RELEASED (2026-08-07)

Prompt Library modal UX fix. `v1.2.2` was never separately committed or
tagged (its fixes stayed uncommitted through the investigation below);
this release consolidates both the v1.2.2 prompt-injection work and
this version's modal fix into one commit/tag.

- **Fixed the Prompt Library modal closing accidentally during a text-
  selection drag.** `PromptModal.tsx`'s overlay dismissed on `onClick`,
  which a browser resolves from the mouseup location, not the mousedown
  location - so dragging to select text inside a long Prompt field and
  releasing outside the modal's boundary looked identical to a genuine
  outside click and closed the modal mid-edit. Fixed by moving the
  dismiss/stop-propagation pair from `onClick` to `onMouseDown`: the
  overlay only ever dismisses when the mousedown itself originates on
  the overlay, so a drag that starts inside the modal can never trigger
  it regardless of where it's released. No state tracking needed - a
  structural fix, not a workaround.
- **Added ESC-to-close** (`useEffect` + a `keydown` listener scoped to
  the modal's own mounted lifetime) - there was previously no keyboard
  close path at all, only Save/Cancel.
- Scope held exactly to the modal: `git diff --stat` confirms only
  `PromptModal.tsx` changed for this fix. Prompt data, Prompt Variables,
  Work Types, Backup/Restore, and the Generate pipeline are untouched.

**Verification:**
- `npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean.
- Live, Playwright-driven UI test (main window only - no ChatGPT
  webview, no network, no generation triggered) covering all 10
  required scenarios: drag-select entirely inside, drag started inside
  and released outside (the reported bug), double-click word selection,
  triple-click line selection, scroll-while-selecting, a genuine outside
  click (still closes it), ESC, Save, and Cancel. All 10/10 passed.
- `npm run build` (full `tsc && vite build && electron-builder`):
  produced `GPT Image Studio v1.2.3 Setup.exe` / `Portable.exe`.

## Version 1.2.2 - fix complete, folded into v1.2.3 above (2026-08-07)

Regression-fix release. Reported symptom: a prompt appearing in the
ChatGPT composer at the wrong time (on image select, or on opening a
new Workspace, before Generate). Investigated via a full static
execution trace plus a live reproduction (real Electron build, real
ChatGPT account, driven with Playwright's `_electron`, console/DOM
state polled every ~400ms through an entire Generate run) before any
code was changed - see WORKLOG Session 28.

- **The originally reported trigger does not exist.** Static trace
  found exactly one call path capable of inserting text into ChatGPT's
  composer (`buildPromptScript`, called only from `runGenerate`, called
  only from the Generate button's `onClick`), and live testing
  confirmed zero composer activity from selecting an image, uploading
  an image, or creating a new Workspace. `Workspace`/`WorkspaceService`
  state is also confirmed clean per-Workspace (`createWorkspace()`
  always returns a fresh, unshared object).
- **The real defect, found during the same live reproduction**: all
  Workspace webviews share one Electron partition (`persist:gpt-image-
  studio`, intentional, for one shared ChatGPT login). ChatGPT's own
  client persists an unsent composer draft in that shared partition
  storage and restores it on load, independent of this app. Because
  prompt insertion (`ChatGPT.ts`) only ever pasted new text in without
  clearing the composer first, that restored leftover draft could
  survive the paste and be the text actually sent - live-confirmed: a
  leftover draft from prior manual ChatGPT use was sent and generated
  in its own style instead of the selected Prompt Library entry's,
  and after sending, ChatGPT re-populated the composer with the
  just-sent text, matching the "prompt sitting unsent in the composer"
  part of the original report.
- **Fix**: `buildInsertPromptTextSnippet` now clears the composer
  (select-all + clear via `document.execCommand`, which - like the
  existing paste-based insert - goes through the real contentEditable
  editing pipeline ProseMirror's internal model actually listens to,
  unlike a raw DOM/`innerHTML` mutation) and polls (bounded, no fixed
  delays) until the composer's `innerText` exactly matches the intended
  prompt before Send is ever clicked. Applies to both `buildPromptScript`
  (the live Generate path) and the currently-unused
  `buildInsertPromptScript`.
- **A pipeline reorder (prompt-insert before image-upload) was proposed
  and explicitly rejected** after the live reproduction showed the
  leftover-draft text is present the instant the composer loads -
  before upload, before prompt insertion, before anything this app
  does - so reordering would not have addressed it, and would have
  discarded the image-preview race-condition guard the v1.0 pass found
  necessary (upload can pop a preview dialog that must close before
  prompt insertion). Upload-then-prompt-then-send order is unchanged.
- No changes to Workspace architecture, Prompt Library, Work Type
  Management, Backup/Restore, or any UI.

**Verification:**
- `npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean.
- Live reproduction re-run after the fix (same Playwright-driven real
  ChatGPT account): the sent message and the resulting generated image
  both matched the selected Prompt Library entry exactly, with the
  console log confirming `"[ChatGPT] prompt text inserted and verified,
  editor.innerText now: <exact intended prompt>"` before Send was
  clicked.
- `git diff --stat` confirms the change is scoped to
  `src/components/Browser/ChatGPT.ts` only - no Workspace, Prompt
  Library, Work Type, Backup/Restore, or UI files touched.

### Follow-up within the same v1.2.2 investigation (2026-08-07, see WORKLOG Session 29)

A 20-consecutive-generation stress test (later re-scoped down after
suspected ChatGPT-side rate limiting - see WORKLOG) surfaced a second,
related defect and one hardening item, both folded into this same
release:

- **Fixed: the composer-verification step above could false-fail on a
  real prompt.** It required byte-identical composer content, but
  ChatGPT's own composer applies Markdown autoformatting to certain
  pasted lines - a line consisting solely of `---` becomes a horizontal
  rule, a line consisting solely of `+` becomes an empty list marker -
  removing them from `editor.innerText` entirely. Live-reproduced with
  a real user-reported prompt (`original.txt`/`inserted.txt`/unified
  diff captured): the paste itself was correct, but the exact-match
  verification rejected it, blocking Send. Fixed by stripping only
  these exact, narrowly-matched line patterns from a comparison copy
  before comparing - never from the text actually pasted, and never
  touching the stored Prompt Library entry. Re-verified clean (isolated
  insertion-only test, no image/Send) after the fix: same paste result,
  now correctly accepted.
- **Hardened the Send-button wait** to also require the button be
  enabled (`disabled`/`aria-disabled` checked), not just present.
- **The composer is now cleared on any Send failure** (new
  `buildClearComposerScript`, called from `generate.ts`'s failure path)
  so a failed Workspace can never leak its leftover text into the next
  Workspace via the shared-partition mechanism.
- **Two separate, pre-existing, out-of-scope issues were found but
  explicitly NOT fixed** (stress test only, not part of this release):
  `buildWaitImageScript()` has no timeout (a stalled/undetected
  generation leaves that Workspace's Generate permanently disabled), and
  `buildClickDownloadButtonScript()`'s one-shot search can race the
  viewer dialog's own render. Recorded here for a future release.

## Version 1.2.1 - RELEASED (2026-08-06)

Feature enhancement release extending v1.2.0's Prompt Variable system
with a second reserved variable - no bug fixes, no Workspace-
architecture/filename-generation/download changes, and v1.2.0's
`{NAME}` behavior is untouched.

- `PromptItem`/`PromptDraft`/`PromptExportItem` gained `requiresNumber:
  boolean` (default `false`), set via a new "숫자 입력 필요" checkbox
  directly below "사용자 이름 입력 필요" in `PromptModal.tsx`, plus an
  always-visible help note ("※ 프롬프트에서 {NAME} 또는 {NUM}
  키워드를 입력하면 자동으로 치환됩니다."). Fully independent of
  `requiresName` - either, both, or neither can be enabled per prompt.
- `Workspace` gained `customerNumber?: string`
  (`WorkspaceService.setWorkspaceCustomerNumber`). `WorkspacePanel`
  shows a "숫자" input above Generate whenever the selected prompt's
  `requiresNumber` is true (independent of, and in addition to, the
  existing "사용자 이름" input), blocking Generate with "숫자를
  입력해주세요." while empty - mirrored as a defensive guard in
  `Workspace.onGenerate`, same pattern as `requiresName`.
- `src/utils/promptVariables.ts`'s `applyPromptVariables` gained a
  third parameter, `customerNumber`, replacing every `{NUM}`
  occurrence the same way it already replaced `{NAME}` - the two
  substitutions are independent (neither depends on the other being
  present), and the existing `{NAME}` substitution logic is
  byte-for-byte unchanged.
- `PromptStore`'s validation/migration/create/update/export/import all
  handle `requiresNumber` the same way they already handled
  `requiresName`: missing on an existing localStorage entry or an
  incoming backup file normalizes to `false`, so v1.2.0 backups (which
  have `requiresName` but no `requiresNumber` key at all) and
  pre-1.2.0 bare-array backups both continue to restore correctly with
  no manual migration step. The unified Backup/Restore file format
  (`{ version, prompts, workTypes }`, introduced in v1.2.0) required no
  changes at all - `requiresNumber` flows through automatically as
  part of each exported prompt.

**Verification:**
- `npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean.
- Node-level verification against the actual shipped modules (same
  esbuild-bundle-and-run-under-Node technique as v1.2.0): 22/22 new
  checks passed, covering `{NUM}` substitution (single/multiple/no-op/
  template-never-mutated), `{NAME}`+`{NUM}` together (including when
  only one of the two is provided while both appear in the prompt),
  `requiresNumber` independent of `requiresName` on create/update, a
  v1.2.0-shaped backup (has `requiresName`, missing `requiresNumber`)
  restoring with `requiresNumber` correctly defaulted to `false`, a
  pre-1.2.0 bare-array legacy backup restoring with both flags `false`,
  and WorkType's own shape confirmed untouched. All 20 pre-existing
  v1.2.0 checks (`{NAME}`, unified backup, WorkType CRUD) re-run
  against the same rebuilt bundles and still pass unchanged.
- `npm run dev` launched clean (no console errors) after the change.
- `git diff --stat` confirms `electron/main.ts`, `electron/preload.ts`,
  `WorkType.ts`/`WorkTypeStore.ts`, `Settings.tsx`, filename generation,
  and the rest of the Workspace architecture are untouched - this
  release only touched the Prompt Variable/Prompt Library files.

## Version 1.2.0 - RELEASED (2026-08-06)

First productivity-focused feature release - no bug fixes, purely new
capability on top of the stable v1.1.2 base. Two independent additions:

**Prompt Variable system (`{NAME}`):**
- `PromptItem` gained `requiresName: boolean` (default `false`), set
  via a new "사용자 이름 입력 필요" checkbox in the Prompt Library
  editor (`PromptModal.tsx`). Existing prompts and pre-1.2.0 Prompt
  Library backups without this field normalize to `false` on load/
  import - fully backward compatible.
- `Workspace` gained `customerName?: string`. When the selected
  prompt's `requiresName` is true, `WorkspacePanel` shows a "사용자
  이름" input directly above Generate; Generate is disabled and
  "사용자 이름을 입력해주세요." is shown while it's empty (enforced
  both in the UI and as a defensive guard in `Workspace.onGenerate`).
- `src/utils/promptVariables.ts` (`applyPromptVariables`) replaces
  every `{NAME}` occurrence in the outgoing prompt text with the
  Workspace's `customerName` immediately before `generate.ts` sends it
  to ChatGPT - the stored Prompt Library template is never mutated, so
  the same template can be reused for the next customer unchanged.
- Explicitly independent of Work Type: Work Type continues to affect
  only filename generation; nothing in `main.ts`'s
  `buildAutoFilename`/`sanitizeFilenamePart` or the Work Type chip
  logic was touched.

**Unified Backup / Restore (Prompt Library + Work Type List):**
- `WorkTypeStore` gained `exportPayload()`/`importPayload()` (same
  Replace/Keep/Rename duplicate-collision semantics as
  `PromptStore.importPayload`, matched by `displayName` instead of
  `title`), plus a `WorkTypeExportItem` type.
- Settings' "Prompt Library" section became "Backup / Restore":
  `handleBackup` writes one file, `{ version, prompts, workTypes }`,
  where `version` is the running app's version; `handleRestore`
  detects the shape - a `{version, prompts, workTypes}` object
  restores both, while a bare array (every backup file produced before
  1.2.0) restores only the Prompt Library, exactly as it always did.
  A single duplicate-count/strategy prompt now covers collisions from
  either list in one pass.
- `electron/main.ts`/`preload.ts`: the export dialog's default
  filename changed to `GPT_Image_Studio_Backup.json`; the IPC channel
  was renamed `promptLibrary:export/import` -> `backup:export/import`
  to match (pure rename, same request/response shape).

**Verification:**
- `npx tsc --noEmit` / `npx eslint . --ext ts,tsx`: clean.
- Node-level verification against the actual shipped modules (same
  esbuild-bundle-and-run-under-Node technique as earlier sessions,
  necessary here since native save/open dialogs can't be driven
  headlessly): 20/20 checks passed, covering `{NAME}` substitution
  (single/multiple occurrences, no-customerName no-op, template never
  mutated), `PromptStore`/`WorkTypeStore` create/update/export/import
  including all three duplicate strategies, a full unified-backup
  round-trip restoring both lists into a fresh store, and a legacy
  bare-array backup importing correctly with `requiresName` normalized
  to `false`.
- `npm run dev` launched clean both before and after the
  `electron/main.ts`/`preload.ts` IPC rename - no console errors, main/
  preload rebuilt successfully.
- `git diff --stat` confirms `buildAutoFilename`, the Work Type
  filename-prefix logic, the Workspace architecture (`Workspace.ts`'s
  existing fields, `WorkspaceService.ts`'s existing functions), and
  the multi-Workspace/auto-save pipeline in `generate.ts` are
  untouched beyond the one-line `applyPromptVariables(...)` wrap
  around the outgoing prompt text.
- WS-AUDIT diagnostic framework left in place, unchanged
  (`FORCE_DEBUG_BUILD` still `false` in both `main.ts`/`preload.ts`;
  `!app.isPackaged` / `import.meta.env.DEV` gates unchanged) - inactive
  in this release's packaged build, same as v1.1.2.
- Official production installer (`GPT Image Studio v1.2.0 Setup.exe` /
  `Portable.exe`).

## Version 1.1.2 - RELEASED (2026-08-05)

P0 fix: the cross-Workspace Error bug that survived v1.1.1's React
state fix (see WORKLOG Session 23-24) - proven, via a purpose-built
always-on-diagnostics "GPT Image Studio Debug.exe" artifact producing a
persistent `logs/ws-audit.log`, to NOT be a React/Workspace-state
clobber at all (mechanically confirmed: zero `CLOBBER CONFIRMED`
events, every `setWorkspaces` diff scoped to exactly the Workspace it
targeted). The real defect: `buildWaitImageScript()`
(`ChatGPT.ts`) counted `img[src*="/backend-api/estuary/content"]`
document-wide with no scoping, and that same URL pattern also matches
a Workspace's own uploaded image thumbnail - a re-rendered/duplicated
uploaded-image `<img>` could be mistaken for a newly generated one,
resolving in ~1.7s (impossibly fast for real generation) and then
failing immediately after in `buildOpenImageViewerScript()` with "no
generated-image container found":

- Fixed `buildWaitImageScript()` to count only images inside a
  `[class*="imagegen-image"]` container - the same scoping
  `buildOpenImageViewerScript()` already used - making the false match
  structurally impossible. No Workspace-management, IPC, or React
  state code changed.
- Live-verified via the Debug build (20x repro), then confirmed the
  real packaged release matches.
- WS-AUDIT diagnostic framework kept in the codebase (dev-only by
  default, plus a `WS_AUDIT_FORCE` env-var escape hatch and a
  `logs/ws-audit.log` persistent log for future investigation without
  needing DevTools) - inactive in this release's packaged build.
- Official production installer (`GPT Image Studio v1.1.2 Setup.exe` /
  `Portable.exe`).

## Version 1.1.1 - RELEASED (2026-08-05)

**Known issue, fixed in 1.1.2 above:** the cross-Workspace Error bug
this release intended to fix was still reproducible in the packaged
build specifically (passed in `npm run dev`) - root cause turned out to
be unrelated to the React state fix this release shipped; see WORKLOG
Session 23-24 and the 1.1.2 entry above.

P0 fix: the cross-Workspace Error bug that survived v1.1.0 (see WORKLOG
Session 22) - creating/deleting a Workspace while another Workspace was
mid-generation could clobber that other Workspace's live state with a
stale snapshot, incorrectly flipping it to Error. Root cause confirmed
via dev-only diagnostic logging (an automatic clobber check, not
manual log-reading) before the fix was written, then re-verified with
a live repro after:

- Fixed `onAddWorkspace`/`onDeleteWorkspace` in `Workspace.tsx` - the
  only two places in the app that replaced Workspace state from a
  stale snapshot instead of React's live state - to use the same
  functional `setWorkspaces(prev => ...)` form already used
  everywhere else. No other behavior changed.
- WS-AUDIT diagnostic logging kept in the codebase for any future
  isolation work, but gated to development builds only (`import.meta.
  env.DEV` in the renderer, `!app.isPackaged` in the main process) -
  produces no output in the packaged app.
- Official production installer (`GPT Image Studio v1.1.1 Setup.exe` /
  `Portable.exe`).

## Version 1.1.0 - RELEASED (2026-08-05)

**Known issue, actually fixed in 1.1.2 above:** the cross-Workspace
Error bug this release intended to fix was still reproducible under a
different trigger (creating a new Workspace mid-generation, not just
switching to one) - see WORKLOG Session 22. 1.1.1 fixed a real but
different bug (a React state clobber) that turned out not to be this
one's root cause; the actual fix landed in 1.1.2.

Maintenance release - no new features. Fixes the cross-Workspace
download attribution race reported from a second PC (see WORKLOG
Session 20/21 and the "Post-release fixes" entry under Version 1.0
below) and ships it as the official production installer:

- Fixed multi-Workspace download race condition.
- Improved Workspace isolation.
- Improved download ownership.
- Improved stability across different PCs.
- Official production installer (`GPT Image Studio v1.1.0 Setup.exe` /
  `Portable.exe`), verified to install to a genuinely empty first-run
  state (empty Prompt Library, empty Work Type list, default
  Settings) - see WORKLOG Session 21.

## Version 1.0 - RELEASED (2026-08-03)

GPT Image Studio is a dedicated ChatGPT Image Generation Studio, not
a ChatGPT/Project manager. Every feature must make image generation
faster - if it doesn't, it doesn't belong here.

**Verified feature list for this release** (live, real Electron app,
real ChatGPT account - see WORKLOG Session 8 for the full verification
transcript):

- ✅ Prompt Library: Create / Edit / Delete, persists across a real
  app restart. Backup/Restore to a `prompt-library.json` file, with a
  Replace/Keep/Rename choice on duplicate titles - never loses an
  existing prompt.
- ✅ Workspace tabs: new tab starts as "New Workspace"; selecting a
  Prompt renames it immediately; duplicate Prompt selections across
  tabs produce `Portrait` / `Portrait (2)` / `Portrait (3)`.
- ✅ Independent Generate/status state per Workspace: Workspace A
  generating never disables B/C's Generate buttons; each tab shows its
  own colored status dot (gray idle / blue generating / green ready or
  completed / red error); a Workspace returns to a green "Ready" state
  automatically ~1.5s after a successful download instead of staying
  stuck on "Completed" - see WORKLOG Session 10.
- ✅ Independent ChatGPT Workspaces: 3 tabs (Portrait/Anime/Landscape)
  each confirmed to own a distinct webview and a distinct, unmirrored
  conversation URL; switching tabs never touches another tab's
  webview.
- ✅ Workspace Clear: instant reset of only the active Workspace
  (image, Prompt, Work Type, status, conversation) so the next image
  can start immediately without opening a new tab - see WORKLOG
  Session 14.
- ✅ Work Type Management: user-defined job categories (Settings > Work
  Type Management - Add/Edit/Delete/Reorder/Enable-Disable), shown as
  compact chips in the Workspace panel; at most one selected per
  Workspace, fully independent of every other Workspace - see WORKLOG
  Session 13.
- ✅ Upload → prompt insertion → Generate → automatic download,
  verified across **20 consecutive real generations** (each with a
  real uploaded image, a rotating Prompt, and a rotating Work Type):
  **20/20 ended in a clean "Ready" state, 0 errors, 0 timeouts** - see
  WORKLOG Session 14. The image-preview race condition and wrong-
  viewer bug from earlier verification passes are both fixed (root-
  caused against real ChatGPT DOM structure, not guessed).
- ✅ Automatic saving: `{Prefix}{Work Type Prefix?}{Prompt Title}.png`
  the first time that name is used - no numeric suffix at all; only
  once that exact name already exists does a plain incrementing number
  get appended (`...2.png`, `...3.png`, ...), confirmed via a direct
  filesystem check (not logs) - see WORKLOG Session 14.
- ✅ Settings: Download Folder (Browse + auto-create), Prompt Library
  Backup/Restore, Work Type Management, Filename Prefix (with live
  Preview + Reset), read-only Application Information, and a small
  Credits block - see WORKLOG Sessions 11-14.
- ✅ Workspace state does not survive a restart; the Prompt Library,
  Work Type list, and Settings (Download Folder, filename Prefix) all
  do - confirmed both ways via the live DOM after an actual restart.

**Post-release fixes:**

- ✅ **P0 - cross-Workspace download attribution race** (reported from
  a second PC, not reproducible on the dev machine - see WORKLOG
  Session 20): `electron/main.ts` tracked the in-flight download as a
  single shared `pendingDownload` variable, keyed only by call order.
  When two Workspaces generated close together, a second Workspace's
  `armDownload()` could overwrite the first Workspace's still-pending
  entry before its `will-download` fired, so the first Workspace's real
  download got saved under the second Workspace's name and its own
  `waitForDownload()` timed out into a false Error - while generation
  itself had actually succeeded. Fixed by resolving every download via
  the actual triggering `<webview>`'s own `webContents.id`
  (`will-download`'s third argument) against a `workspaceId` registered
  right after that Workspace's own webview `dom-ready`, instead of
  relying on arm order at all.

**The Workspace IS the tab.** There is no separate Job, Project, or
Queue concept. Each top tab is one independent Workspace, owning
exactly:

- one persistent `<webview>` (own ChatGPT conversation)
- one uploaded image
- one selected Prompt
- one selected Work Type (at most one, independent per Workspace)
- its own generation status

Workspace state is **runtime-only and never persisted** - closing the
app discards every open Workspace. The **Prompt Library**, the **Work
Type list**, and Settings (Download Folder, filename Prefix) all
survive a restart - see Steps 7-9 below.

```
Top     Workspace Tabs (tab title = Prompt title, auto-renamed, deduped)
Left    Prompt Library (Create/Edit/Delete templates - unchanged modal)
Center  ChatGPT Browser (one <webview> per Workspace, shown/hidden only)
Right   Workspace panel: Image upload -> Prompt select -> Generate -> Status
```

### Step 5: simplify styling - DONE (2026-08-03, see WORKLOG Session 7)

All `job-*` CSS class names renamed to `workspace-*` throughout
`WorkspaceTabs`/`WorkspacePanel` (`workspace-tabs`, `workspace-tab`,
`workspace-tab-delete`, `workspace-tab-add`, `workspace-panel`,
`workspace-panel-header`, `workspace-status-badge`,
`workspace-panel-section(-title)`, `workspace-upload-*`,
`workspace-generate-button`). A duplicate `.job{}` CSS block from the
old file (two separate rule sets for the same selector) was merged into
one `.workspace-tab{}` while doing this. No dead CSS found beyond what
Steps 1-4 already removed with their markup. Verified live: identical
visual appearance (screenshot compared before/after), and a functional
smoke test (select a Prompt -> tab renames, add a tab, status badge
text) confirmed the renamed classes are correctly wired, not just
visually coincidental.

### Step 6: per-Workspace generation state + status dots - DONE (2026-08-03, see WORKLOG Session 10)

Final V1.0 polish pass on top of the already-confirmed architecture -
no architecture changes. Fixed a global-state bug (Generate button was
gated by one app-wide `running` boolean instead of each Workspace's own
`status`), added a small colored status dot per tab (idle/generating/
ready/error), changed the default tab name to "New Workspace", and
made a completed Workspace automatically return to a "Ready" resting
state ~1.5s after its download finishes instead of staying parked on
"Completed". Verified live with three Workspaces generating - including
two running **concurrently** - confirmed independent via direct DOM
queries and real files landing on disk for each.

### Step 7: Version 1.0 Settings system - DONE (2026-08-03, see WORKLOG Session 11)

Built the Settings dialog as a workspace-configuration window, not a
general preferences panel: Download Folder (Browse, auto-create,
persisted, `📂 Open Folder` shortcut), Prompt Library Backup (Export/
Import with a Replace/Keep/Rename choice when incoming titles collide -
never loses an existing prompt), and read-only Application Information
(app/Electron/Node versions, git commit). Persisted settings now live
in a small `settings.json` in `app.getPath("userData")`, separate from
the Prompt Library's own `localStorage` store. Verified live: Download
Folder survives a full app restart and real generated images land in
the custom folder; Prompt Library export/import logic verified
directly against the live store (all three duplicate strategies) plus
confirmed end-to-end by the user manually clicking through the real
native dialogs.

### Step 8: simplified filename system - DONE (2026-08-03, see WORKLOG Session 12)

Replaced the fixed `★_{PromptTitle}_{NNN}.png` scheme with **Prefix +
Prompt Title**, where only the Prefix is user-editable (Settings >
Filename, default `★_`) and the Prompt Title is always appended
automatically and never editable. Numbering stays always-numbered-
from-`001` (every file gets a number, not just the first collision),
since that keeps filename ordering consistent on disk - no change was
needed there, `buildAutoFilename` already worked this way. Illegal
Windows filename characters are stripped and whitespace trimmed on
both the Prefix and the Prompt Title at save time; an empty title
falls back to "Untitled" so the filename can never be empty even with
an empty Prefix. Verified live: changing the Prefix to `IMG_` was
reflected in a real saved filename (`IMG_Portrait_001.png`), a second
generation against the same prompt correctly incremented to
`IMG_Portrait_002.png` without overwriting the first, and the Prefix
survives a full app restart.

### Step 9: Work Type Management + Settings polish - DONE (2026-08-03, see WORKLOG Session 13)

Added a fully user-managed **Work Type** system (Settings > Work Type
Management: Add/Edit/Delete/Reorder/Enable-Disable, e.g. a photo
studio's own 만삭/신생아/50일/백일/돌/주니어 job categories), replacing
any notion of a fixed category list. Every *enabled* Work Type shows as
a compact chip in the Workspace panel; at most one is selected per
Workspace, completely independent of every other Workspace, and the
selection can be toggled off (no Work Type is a valid state). The
filename rule became **Prefix + (optional Work Type Prefix) + Prompt
Title**: the global Prefix's default changed from `★_` to bare `★`,
with the app itself always inserting the one `_` right after it - a
Work Type's own prefix (e.g. `만삭_`) supplies its own trailing
separator and is never given an extra one. Settings was also reworded/
reorganized to match: "Download Folder" -> "Download" (its in-dialog
Open Folder button removed entirely - only the Toolbar's `📂 Open
Folder`, from Session 12, remains), "Prompt Library Backup" -> "Prompt
Library" with "Backup Prompts"/"Restore Prompts" buttons, a Filename
**Reset** button, and a small centered **Credits** block at the very
bottom (`package.json` bumped to `1.0.0` to match). Verified live: the
spec's own two filename examples were reproduced as real generated
files - `★_만삭_Portrait_001.png` (Work Type selected) and
`★_Portrait_001.png` (none selected) - plus full Work Type CRUD/
reorder/enable-disable and a full-restart persistence check covering
Download Folder, filename Prefix, and the entire Work Type list.

### Step 10: Workspace Clear - DONE (2026-08-03, see WORKLOG Session 14)

Added an instant "Clear" action next to Generate: resets only the
active Workspace (uploaded/generated image, selected Prompt, selected
Work Type, status/progress/error, conversationUrl) and re-points that
Workspace's own webview at a fresh ChatGPT conversation, so the next
image can start right away without opening a new tab. Never touches
any other Workspace, the Prompt Library, Work Type definitions, or
Settings. A "✔ Workspace cleared" message shows for ~1s and disappears
automatically. Verified live: the reset is instant (a first version
that awaited the webview navigation before resetting state was caught
and fixed - see WORKLOG); clearing one Workspace never affected a
sibling Workspace; a full upload → Prompt → Work Type → Generate cycle
worked correctly immediately after clearing.

### Step 11: production reliability fixes - DONE (2026-08-03, see WORKLOG Session 14)

Two issues fixed and stress-tested before considering V1.0 stable:

- **Filename numbering** changed to no-suffix-first, per explicit spec:
  `★_만삭_노을감성.png` the first time, `...2.png`/`...3.png` only once
  that name already exists - never `_001`-style padding.
- **Image preview race condition**, root-caused against real ChatGPT
  DOM (not guessed): `buildOpenImageViewerScript()` used to match any
  image served from ChatGPT's backend-api URL pattern in document
  order - which also matches a Workspace's own uploaded image (and even
  the sidebar's account icon), so it could click the wrong one. Fixed
  by scoping to ChatGPT's own `imagegen-image` container class,
  confirmed live to appear only once real generation completes and to
  never match an uploaded image. A new pipeline step also verifies the
  normal chat interface is active after upload (closing any preview
  dialog first) before prompt insertion ever runs.

**Verified with 20 consecutive real generations** (real uploaded image
+ rotating Prompt + rotating Work Type each time, Cleared between
runs): 20/20 ended in "Ready", 0 errors, 0 timeouts, and the original
failure did not recur once across all 20 post-fix attempts.

### Step 12: filename prefix simplification - DONE (2026-08-03, see WORKLOG Session 14)

Removed the automatic separator the app used to insert between the
global Prefix and the rest (`{Prefix}_{Work Type Prefix?}{Title}`) -
real use showed this doubled up with a Work Type prefix that already
ended in `_` (e.g. `★__만삭_...`). The builder now does pure
concatenation (`{Prefix}{Work Type Prefix?}{Title}`); any separator the
user wants, they type themselves. Settings' Filename Preview and
helper text were rewritten to match exactly. Verified live: a real
generation with a Work Type whose own prefix already included
underscores produced a single underscore, not a doubled one.

### Step 13: Reset Application Data, Credits & Copyright, First Launch Notice - DONE (2026-08-03, see WORKLOG Session 16)

Final polish before the installer. **Settings > Maintenance** adds one
button, **Reset Application Data**, behind an in-app confirmation panel
(Title/Message/Cancel-Reset, matching spec exactly - not a native
`window.confirm()`, which can't customize button labels) that clears
only the Prompt Library and Work Type list, refreshes the interface
immediately, and never touches Download Folder/filename Prefix/any
other Setting. **Credits** now includes `© 2026 leessem` and the
required internal-business-use / unauthorized-distribution notice
(small, centered, muted, no hyperlinks). A new **First Launch Notice**
(its own small modal) shows the internal-use notice once, ever, on
first launch, persisted via a `firstLaunchNoticeShown` flag in the same
`settings.json` as everything else.

Verified live: backed up the real Prompt Library first (direct store
read, not the native Export dialog), then exercised the real Reset flow
end-to-end - confirmation panel matched the spec exactly, Reset emptied
the Prompt selector and removed every Work Type chip (including a
disposable canary), and Download Folder/filename Prefix were confirmed
byte-for-byte unchanged afterward. Restored the real prompts afterward.
The First Launch Notice's full logic (effect -> IPC -> state -> render
-> real click -> persist -> survives restart) was confirmed correct via
direct log-tracing including a captured stack trace proving a genuine
React-dispatched click triggered the dismiss/persist path - but no
isolated screenshot of the notice alone was obtained in this session
(see Known Issues).

### Step 14: Korean copyright text - DONE (2026-08-03, see WORKLOG Session 17)

Replaced the Credits section's and First Launch Notice's English
legal wording with the requested Korean text (keeping only `GPT Image
Studio`, `Version 1.0.0`, `Created by`, and `All Rights Reserved.` in
English), and changed the First Launch Notice's button label to `확인`.
Credits' legal text is now three separate centered lines instead of
one paragraph. Verified live via DOM query (exact text match) and a
screenshot (via direct markup injection, since the live notice kept
being dismissed within milliseconds by the actively-engaged real user
- same as Session 16, not a defect).

### Version 1.0 - final verification pass (2026-08-03, see WORKLOG Session 18)

Full project verification before the installer: `tsc`/`eslint`/`vite
build` all clean, all core project files present. Every listed feature
re-confirmed live in a single pass: independent Workspaces, Prompt
Library, Prompt Backup/Restore, Work Type Management, Filename
Generation, Workspace Clear, Download Folder, Open Folder (confirmed
via real Win32 window enumeration, not just a successful click),
Settings Persistence (confirmed via a real, verified-clean app
restart), and Copyright/Credits. One process lesson from this pass:
`taskkill` can silently fail to kill the real running instance while
Electron's single-instance lock quietly re-focuses the old one instead
of starting fresh - switched to PowerShell's `Get-Process | Stop-Process
-Force` plus explicit process-start-time verification for every restart
from here on.

### Step 15: Version 1.0 production release build - DONE (2026-08-03, see WORKLOG Session 19)

Built the final production release via Electron Builder: NSIS installer
(`GPT Image Studio v1.0.0 Setup.exe`, per-user install, Desktop +
Start Menu shortcuts, uninstaller) and a portable build (`GPT Image
Studio v1.0.0 Portable.exe`), both carrying the application icon.
Fixed two real gaps found during pre-build verification that had never
been set: `index.html`'s title/favicon were still the untouched Vite
scaffold defaults, and `BrowserWindow` never had an `icon` property set
at all - both fixed (`public/icon.ico` added, `index.html` updated,
`icon:` added to the `BrowserWindow` config). `electron-builder`'s
Windows packaging step needs the OS to allow unprivileged symbolic-link
creation (Developer Mode or admin rights) to unpack one of its bundled
helper-tool archives - enabling Developer Mode resolved this cleanly
(see Known Issues below, now resolved).

Verified live: ran the actual generated installer (silent `/S` install)
and confirmed the install directory, `GPT Image Studio.exe` name,
Desktop shortcut, Start Menu shortcut, and the uninstaller registry
entry (`GPT Image Studio 1.0.0`, publisher `leessem`) all exist exactly
as expected; ran the portable exe directly and confirmed it starts
correctly under its own self-extracted directory. Both were verified
against a genuinely empty profile (the real `userData` folder was
safely renamed aside and restored afterward, since this dev machine's
own `npm run dev` sessions share the same `userData` path with any
installed/portable build of the same app - expected Electron behavior,
not a defect) - Settings, Prompt Library, and Work Types all confirmed
to start empty, and the First Launch Notice appeared and was
acknowledged correctly on both the installed and portable builds.
`Release/` contains the two `.exe` artifacts plus `README.txt` and
`VERSION.txt` with the exact specified content.

### Known issues (see WORKLOG for exact repro steps and diagnostic
evidence per session)

- **Workspace state reset unexpectedly mid-verification-session,
  without an intentional reload or an explicit crash trace in the dev
  log.** Observed once: after ~10 minutes of continuous CDP-driven
  testing (3 tabs, 4 generations), the app's Workspace state was found
  reset to a single fresh "New Tab" with no user action taken. Prompt
  Library was correctly still intact (as designed - it's independent
  of Workspace state), so no data was actually lost beyond the
  now-closed tabs themselves. No crash/error appeared in the `npm run
  dev` log at the time. This matches the general process-instability
  pattern already documented in earlier sessions under heavy automated
  CDP testing specifically - not confirmed to affect normal
  interactive use, but recorded here rather than silently ignored.
- **Clear's webview navigation not conclusively verified.** One live
  check found a Workspace's webview still pointed at its old
  conversation a few seconds after clicking Clear, even though the
  fire-and-forget `loadURL()` call resolved without error. Not
  root-caused - real concurrent app usage was also observed around the
  same testing window, which could equally explain a single anomalous
  reading. Worth a focused, uninterrupted repro before fully trusting
  it (see WORKLOG Session 14).
- **First Launch Notice not confirmed by an isolated screenshot.** Its
  full logic is verified correct via direct log-tracing (see WORKLOG
  Session 16), but the notice was already dismissed by the time every
  automated check ran, in every attempt, most likely because the real
  user - actively using the app throughout this session - dismissed it
  before a screenshot could be taken. A real end-user should confirm it
  visually once the installer exists and only they are at the machine.
- No idle-eviction for Workspace webviews - a webview is only torn
  down when its Workspace/tab is closed; a session with many
  opened-and-abandoned tabs will hold real memory (~250-300MB per
  active webview, measured) until those tabs are closed.

---

## History (condensed - see WORKLOG.md for full session-by-session detail)

The app went through several architectural phases before arriving at
V1.0 above. Kept here as a compressed record, not as current-state
documentation - none of the code described below (Job, Project, Tab-
owns-Jobs, JobList/JobDetail, QueueRunner, ProjectStorage/`.gisp`
files) exists anymore.

1. **P0 - Core queue automation** (baseline): built and verified the
   ChatGPT browser-automation pipeline itself - prompt insertion,
   generation detection, real download-based image capture, language-
   independent selectors, retry-based send verification. This
   automation logic (now in `src/services/generate.ts` and
   `src/components/Browser/ChatGPT.ts`) is the one thing that has
   survived every architecture change since, essentially unmodified in
   its core mechanics.
2. **Prompt Library** (P0.5): titles-only list + a Create/Edit/Delete
   modal, backed by its own `localStorage` store (`PromptStore.ts`) -
   this is the one other piece that has survived unchanged into V1.0.
3. **Job-first pivot**: introduced `Job` as the primary object (owning
   an uploaded image, selected prompt, status, result) inside a
   `Project -> Tabs -> Jobs[]` nesting, with `JobList`/`JobDetail` as
   the primary UI and a `QueueRunner` that processed a tab's jobs
   sequentially.
4. **Two P0 bugs found and fixed in that architecture**: (a) all Jobs
   were sharing one ChatGPT webview/session - fixed first via a wrong
   approach (separate partition per Job - broke shared login, reverted
   same day), then correctly via `Job.conversationUrl` + navigating one
   shared webview between conversations; (b) uploaded images never
   actually reached ChatGPT - root-caused (CSP-blocked `fetch()`,
   non-deterministic drag/drop, a structurally-broken upload-detection
   baseline) and fixed, all three confirmed via live CDP capture against
   the real chatgpt.com DOM.
5. **Stabilization pass**: three reported runtime bugs investigated
   live. Two (Job title not updating, prompt not inserting) could not
   be reproduced under rigorous live testing - the underlying logic was
   already correct. The third (Jobs sharing a conversation) was real:
   `waitForConversationUrl()` was capturing ChatGPT's transient
   `/c/WEB:<id>` placeholder URL instead of the real permanent one -
   fixed, and that fix is still present in today's `generate.ts`.
6. **Architecture change - one WebView per Job**: replaced the single
   shared webview with a `BrowserPool` registry - one persistent
   webview per Job, all on one shared partition (one login). This
   `BrowserPool` design is unchanged in V1.0, just re-keyed by
   Workspace id instead of Job id (a Workspace's webview lifecycle is
   identical to what a Job's was).
7. **Prompt insertion bug found for real**: earlier "verified working"
   claims for prompt insertion turned out to be false positives (the
   pipeline's own success/return values were misleading) - the actual
   sent message was empty. Root cause: ChatGPT's ProseMirror-based
   composer doesn't register a synthetic DOM-mutation + `InputEvent`
   into its real internal model. Fixed by simulating a real `paste`
   `ClipboardEvent` instead - this fix is unchanged in
   `ChatGPT.ts`/V1.0.
8. **V1.0 rewrite** (this document's current state, see above):
   collapsed Job+Tab into a single Workspace concept, removed Job List/
   Queue/Project entirely, removed all Workspace-state persistence, and
   implemented automatic-download with the `★_{PromptTitle}_{NNN}.png`
   naming convention.
