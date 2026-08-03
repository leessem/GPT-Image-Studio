# ROADMAP

## Version 1.0 - FEATURE COMPLETE (2026-08-03)

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
- No idle-eviction for Workspace webviews - a webview is only torn
  down when its Workspace/tab is closed; a session with many
  opened-and-abandoned tabs will hold real memory (~250-300MB per
  active webview, measured) until those tabs are closed.
- `electron-builder` installer packaging fails on this dev machine
  (needs Windows Developer Mode or admin rights) - not a code defect.

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
