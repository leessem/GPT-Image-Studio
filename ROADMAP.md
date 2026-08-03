# ROADMAP

## Current State: Version 1.0 (2026-08-03)

GPT Image Studio Pro is a dedicated ChatGPT Image Generation Studio, not
a ChatGPT/Project manager. Every feature must make image generation
faster - if it doesn't, it doesn't belong here.

**The Workspace IS the tab.** There is no separate Job, Project, or
Queue concept. Each top tab is one independent Workspace, owning
exactly:

- one persistent `<webview>` (own ChatGPT conversation)
- one uploaded image
- one selected Prompt
- its own generation status

Workspace state is **runtime-only and never persisted** - closing the
app discards every open Workspace. Only the **Prompt Library**
survives a restart (Settings/download-folder/filename-format
persistence is planned but not yet built - see P1 below).

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

### P1 - Settings (not yet built)

The spec requires two persisted settings: Download Folder and Filename
format. Today these are **hardcoded** in `electron/main.ts`
(`Downloads/GPT Image Studio`, `★_{PromptTitle}_{NNN}.png`) - fully
functional, just not user-editable or stored anywhere. Building an
actual Settings screen (own localStorage-backed store, UI, wiring into
the download path) is future work; the Settings button in the Toolbar
is intentionally still disabled ("Coming soon") until then.

### Known open issues (carried over, unaffected by the V1.0 rewrite)

- Download step is occasionally flaky (seen once: "download button not
  found" on an otherwise-correct run) - not investigated further,
  low-frequency.
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
