# CHANGELOG

All notable changes to GPT Image Studio are documented in this file.

## Version 1.3.2 (2026-08-16)

**Fixed TXT Attachment Mode reliability (Debug Window position, retry
timing, forced-generation instruction).**

- Moved the Debug Mode floating panel from the bottom-right to the
  bottom-left corner - it was overlapping the Workspace panel's own
  Generate/Clear buttons on some window sizes, making them unclickable
  while Debug Mode was on.
- Fixed a real bug in `buildTxtPromptScript`'s Send-button wait: when
  the Send button was found but stayed disabled past its 5-second
  window, the run failed immediately with no retry. A pasted document
  attachment can take longer than an image upload to finish settling
  server-side before Send re-enables - this now retries (same bounded
  5-attempt budget already used for the "not accepted" case) instead
  of failing the whole run on one slow attempt.
- Fixed the real root cause of TXT mode's inconsistent behavior
  (sometimes generating normally, sometimes only getting a text reply,
  confirmed by live user testing): ChatGPT does not reliably treat a
  document/file attachment's content as an image-generation
  instruction on its own. Every TXT-mode Prompt's text now
  automatically gets a fixed instruction line prepended before it's
  attached, telling ChatGPT explicitly to treat it as a prompt and
  generate an image. This line is shown as a locked, non-editable
  banner above the Prompt field in the Prompt Library editor whenever
  "TXT 첨부 방식" is checked - it cannot be edited or removed per-
  Prompt, and the exact same constant is what generate.ts actually
  sends, so the editor preview always matches real behavior.
- Removed v1.3.1's separate TXT-mode follow-up "trigger" message
  entirely, per live user testing: now that the forced instruction
  above makes the attachment message itself reliably generate on its
  own, the extra trigger message could race with that generation and
  occasionally produce an unwanted duplicate 2nd image. TXT mode now
  sends one message (image + forced-instruction-prefixed text) and
  waits for its generation, the same shape as the normal path.
- No changes to the normal (non-TXT) Generate path, Custom Image
  Revision, {NAME}/{NUM}/{COLOR} substitution, Work Type, or Backup/
  Restore.

## Version 1.3.1 (2026-08-16)

**Added {COLOR} Prompt Variable and per-Prompt TXT Attachment Mode.**

- Added a third reserved Prompt Variable, {COLOR}, alongside {NAME}/
  {NUM}: a Prompt Library entry can check "색상 입력 필요" to show a
  "색상" input on the Workspace panel, substituted into every {COLOR}
  occurrence right before Generate - same mechanism, same independence
  from the other two, as {NAME}/{NUM}. Each Workspace holds its own
  COLOR value.
- Added a per-Prompt "TXT 첨부 방식" checkbox. When ON, Generate sends
  that Prompt via ChatGPT's own native "paste long text as a document
  attachment" behavior instead of the normal inline-paste path -
  confirmed live via a real captured ChatGPT DOM snapshot that pasting
  sufficiently long text makes ChatGPT itself (not this app) convert it
  into a file/document attachment tile. This app never builds a .txt
  file itself and never alters the Prompt's content, spacing, line
  breaks, or Markdown in any way - only the delivery mechanism changes,
  and a Prompt with TXT mode OFF is generated exactly as before.
  Implemented as a fully separate script (`buildTxtPromptScript`); the
  normal path (`buildPromptScript`, used by both Generate and the
  v1.3.0 custom-revision pipeline) is untouched.
- Prompt Library's variable-substitution help text now also mentions
  {COLOR} and explains TXT 첨부 방식.
- `requiresColor`/`txtAttachmentMode` are preserved by Backup/Restore
  and are backward-compatible with Prompt Library backups exported
  before this version (missing values default to `false`).
- No changes to {NAME}/{NUM} substitution, Work Type, Backup/Restore
  of existing fields, image upload, the 1st-pass Generate pipeline
  when TXT mode is off, or the v1.3.0 custom-revision pipeline.

## Version 1.3.0 (2026-08-16)

**Added Custom Image Revision.** A Workspace with a completed result
image now shows a "커스텀 수정" button - clicking it opens a multi-line
instruction box, and "수정 생성" runs a 2nd-pass edit of that same
result image instead of re-running the full Prompt Library prompt.

- Generated images can be revised with a short custom instruction
  (e.g. "배경만 조금 더 밝게 해줘") instead of resending the original,
  often much longer, Prompt Library prompt.
- The 2nd-pass edit re-attaches the Workspace's own existing result
  image as its input, on the same Workspace conversation, and sends
  only the new instruction - implemented as its own pipeline
  (`src/services/revise.ts`), reusing the same ChatGPT.ts automation
  scripts as Generate but never routed through `runGenerate` itself,
  so the verified v1.2.5 1st-pass flow (Upload -> Prompt insertion ->
  Verification -> Send -> Generation detection -> Image viewer ->
  Download -> Workspace Ready) is unchanged.
- The original result image is never overwritten. Revised images are
  saved alongside it using a `+` / `++` / `+++` filename suffix
  (e.g. `★_50일_아기_001.png` -> `★_50일_아기_001+.png` ->
  `★_50일_아기_001++.png`), appended directly before the file
  extension - existing Prefix / Work Type Prefix / Prompt Title /
  numeric-suffix filename generation is untouched.
- A failed revision leaves the Workspace's existing result and file
  untouched, surfaces through the same status-badge error state
  Generate already uses, and never carries its typed instruction into
  another Workspace or generation.
- No changes to Prompt Library, {NAME}/{NUM} substitution, Work Type,
  Backup/Restore, image upload, or the 1st-pass Generate pipeline.

## Version 1.2.5 (2026-08-08)

Prompt verification fix - found via a real Export Diagnostics ZIP from
a live failure.

- **Fixed: a Prompt Library template whose first line starts with an
  ordered-list marker (`"1. "`, `"2. "`, ...) could fail prompt
  verification and never send.** ChatGPT's own composer converts a
  line beginning with `N. ` at the very start of pasted text into a
  real ordered-list element - the `"1."` marker renders as CSS
  `::marker` content, which `editor.innerText` never includes, so the
  post-paste verification saw the marker silently stripped and
  reported a mismatch. Confirmed directly from a real
  `DebugLogs`/Export Diagnostics session: `original_prompt.txt` /
  `resolved_prompt.txt` both began `"1. 인물 사진:"`;
  `composer_readback.txt` showed just `"인물 사진:"`.
- Fixed the same way as the existing `"---"` / bare `"+"`/`"-"`/`"*"`
  Markdown-autoformat tolerance (Session 29): the verification's
  comparison copy now also strips a leading ordered-list marker from
  its first line only - never from the actual pasted text, never from
  the stored Prompt Library entry, never from any other line.
- Live-verified against the real, exact failing prompt text (extracted
  byte-for-byte from the failing session's own diagnostics export),
  run through the app's real `buildPromptScript` against a real
  ChatGPT conversation: verification passed and Send was accepted.
- No changes to Prompt Library data, Prompt Variables, Work Types,
  Backup/Restore, image upload, or the Send/Generate pipeline itself -
  scoped to one function's comparison-copy normalization.

## Version 1.2.4 (2026-08-08)

Debug Build release. Adds a permanent, Settings-toggleable "Debug Mode"
that records forensic detail for every Generate run and lets it be
exported as a single ZIP, then fixes a real bug in that exporter found
via live testing of this same release.

- **Added Debug Mode** (Settings toggle, off by default, works in dev
  and packaged builds alike). While on, every Generate attempt writes a
  self-contained session folder (`DebugLogs/<sessionId>/`) containing:
  pipeline stage log with timings, the exact original/substituted
  prompt plus a diff against what the composer read back, before/after
  Workspace JSON snapshots, before/after screenshots of the ChatGPT
  webview, the composer's own HTML/text, and a DOM-mutation observer
  log - "everything needed to diagnose a failure" without asking a user
  to gather files by hand.
- **Added a floating Debug Window** showing the live state of the
  in-progress run (stage, Workspace, Prompt, elapsed time, last error)
  plus an **Export Diagnostics** button that zips the most recent
  session folder to a location of the user's choosing.
- **Fixed: Export Diagnostics could silently produce a 0-byte ZIP and
  still report success.** The output write stream's own `error` event
  was never handled (only the archiver's was) - a failed write still
  emitted `close` right after, resolving the export as successful. Both
  streams' errors are now handled, a zero-length result is treated as a
  failure explicitly, and a failed export cleans up its own stray/
  locked file instead of leaving one behind.
- **Fixed: even after that, an export failure showed no real reason.**
  The actual error only ever went to the (invisible, in a packaged
  build) main-process console. The Debug Window now shows the real
  error message, error code, output path, and stack trace, and every
  failure is additionally written to `DebugLogs/export-error.txt`.
- **Fixed the real, underlying export bug this surfaced:** `archiver`'s
  CJS default export was being imported as `import * as archiverModule`
  and cast directly to a callable type - at runtime this compiles
  (Vite/esbuild's CJS interop) to a non-callable merged-namespace
  object, so every export attempt since the feature was written threw
  `TypeError: archiver is not a function` synchronously, previously
  swallowed by the outer `try/catch`. Fixed to use the module's actual
  `.default` export. Live-verified in the real packaged Debug build
  against a real session: produced a 6.96 MB ZIP containing all 14
  diagnostic files, opened cleanly.
- No changes to Prompt Library, Prompt Variables, Work Types, Backup/
  Restore, or the Generate/Image pipeline itself - Debug Mode is
  observational only, and every debug call site no-ops entirely with
  zero disk I/O when the setting is off.

## Version 1.2.3 (2026-08-07)

Prompt Library modal UX fix - production release. Consolidates this
version with the previously-uncommitted v1.2.2 prompt-injection work
below (v1.2.2 was never separately tagged/released - both land in this
one release).

- **Fixed: the Prompt Library modal could close accidentally mid-edit.**
  Dragging to select text inside a long Prompt or Negative Prompt field
  and releasing the mouse outside the modal's boundary closed the modal
  and discarded the in-progress edit. Root cause: the modal's outside-
  dismiss handler used the overlay's `onClick`, but a browser resolves
  a `click` event from wherever the mouse is released, not from where
  the drag started - so a selection drag that started inside the modal
  and ended outside was indistinguishable from a genuine outside click.
- Fixed by tracking `onMouseDown` origin instead of `onClick`: the
  overlay only dismisses when a mousedown itself originates on the
  overlay (a real outside click); a mousedown that starts inside the
  modal has its propagation stopped at the modal's own boundary and can
  never reach the overlay's handler, regardless of where the drag/mouse-
  up ends up. No selection-tracking, drag-state flags, or timers needed.
- **Added ESC-to-close** - the modal previously had no keyboard close
  path at all; Save and Cancel were the only ways to close it. ESC now
  closes it the same as Cancel.
- Verified (drag-select entirely inside, drag started inside and
  released outside, double-click word selection, triple-click line
  selection, scroll-while-selecting, genuine outside click, ESC, Save,
  Cancel): all pass. No changes to Prompt data, Prompt Variables, Work
  Types, Backup/Restore, or the Generate pipeline - only
  `PromptModal.tsx`.

## Version 1.2.2 (2026-08-07)

Regression fix release. A "prompt injection at the wrong time" report was
investigated end-to-end; the specific scenario reported (image select /
Workspace creation triggering injection) could not be reproduced and was
ruled out, but the investigation surfaced a real, related defect in the
same area, which is what this release fixes.

- **Fixed: a stale/leftover composer draft could be sent to ChatGPT
  instead of the selected Prompt.** All Workspace webviews intentionally
  share one Electron partition (`persist:gpt-image-studio`, for one
  shared ChatGPT login - see `Browser.tsx`). ChatGPT's own client
  persists an unsent composer draft in that shared storage and restores
  it whenever a chat view loads, independent of and before anything this
  app does. Prompt insertion only ever pasted the intended text in
  without first clearing the composer, so a leftover draft (from prior
  manual ChatGPT use in that same browser profile, or from ChatGPT
  re-populating the composer with the just-sent message afterward) could
  survive the paste untouched and be the text actually submitted -
  live-reproduced against a real ChatGPT account: the leftover draft's
  image style was generated instead of the selected Prompt Library
  entry's, confirmed by inspecting both the sent message and the
  resulting generated image.
- **Ruled out via live reproduction** (real Electron app, real ChatGPT
  account, step-by-step console/DOM tracing): Workspace state leakage
  between tabs, image-upload triggering injection, and Workspace
  creation triggering injection. None occur - Workspace isolation and
  the Generate-button-only injection gate were already correct and are
  unchanged by this release.
- `buildInsertPromptTextSnippet` (`ChatGPT.ts`) now clears the composer
  (select-all + clear, through the same native contentEditable editing
  pipeline ProseMirror already listens to for the paste-based insert)
  and polls until the composer's content exactly matches the intended
  prompt before Send is ever clicked - a state-based, delay-free
  verification step, consistent with the rest of the automation
  pipeline's existing poll-for-observable-state approach. Applies to
  both `buildPromptScript` (Generate) and the currently-unused
  `buildInsertPromptScript`.
- Upload-before-prompt pipeline order is unchanged (reversing it was
  considered and rejected - the leftover-draft defect is present before
  either step runs, and the existing order is required by the
  image-preview race-condition guard from the v1.0 verification pass).
- **Fixed a false-failure in that same verification**: it originally
  required byte-identical composer content, but ChatGPT's own composer
  applies Markdown autoformatting to certain pasted lines (a line
  consisting solely of `---` becomes a horizontal rule, a line
  consisting solely of `+` becomes an empty list marker), silently
  removing them from `editor.innerText` - expected editor behavior, not
  data loss, but enough to fail a byte-exact check and block Send
  entirely for any prompt containing such a line, live-reproduced with a
  real user-reported prompt. Verification now strips only these exact,
  narrowly-matched line patterns from a comparison copy before
  whitespace-normalized comparison - never from the pasted text itself,
  and never anywhere near the stored Prompt Library entry. Any other
  difference (wrong content, a leftover leaked draft) still fails
  verification exactly as before.
- Send button wait now also requires the button to be enabled
  (`disabled`/`aria-disabled` both checked), not just present, before
  clicking it - defense-in-depth alongside the verification fix above.
- If prompt insertion or Send fails for any reason, the composer is now
  explicitly cleared before the Workspace is marked Error, so a failed
  attempt's leftover text can never leak into the next Workspace via the
  shared-partition mechanism above.
- No changes to Workspace architecture, Prompt Library, Work Type,
  Backup/Restore, or any UI.

## Version 1.2.1 (2026-08-06)

Feature enhancement release extending the v1.2.0 Prompt Variable system.

- **Added `{NUM}` Prompt Variable**: a second reserved variable,
  independent of `{NAME}` - either, both, or neither can be used in a
  given prompt.
- **Added "숫자 입력 필요" option**: a second checkbox on each Prompt
  Library entry (default unchecked), directly below "사용자 이름 입력
  필요".
- **Workspace now supports Name and Number variables independently**:
  the Workspace panel shows a 사용자 이름 field, a 숫자 field, both, or
  neither, based on the selected prompt's own settings; each Workspace
  keeps its own independent values for both. Generate is blocked with
  "사용자 이름을 입력해주세요." / "숫자를 입력해주세요." while a
  required field is empty.
- **Prompt editor now includes variable usage help text**: "※
  프롬프트에서 {NAME} 또는 {NUM} 키워드를 입력하면 자동으로
  치환됩니다." is always visible in the Prompt Library editor.
- **Backup / Restore compatibility maintained**: the backup format
  extends automatically (`requiresNumber` included in exported
  prompts); existing v1.2.0 and pre-1.2.0 backup files still restore
  correctly, with `requiresNumber` defaulting to `false` when absent.

## Version 1.2.0 (2026-08-06)

First productivity-focused feature release.

- **Prompt Variable system using `{NAME}`**: any Prompt Library template
  can reference `{NAME}`, replaced with a per-Workspace customer name
  right before the prompt is sent to ChatGPT. The stored template
  itself is never modified - only the outgoing text is substituted.
- **Optional "사용자 이름 입력 필요" setting**: a new checkbox on each
  Prompt Library entry (default unchecked). Existing prompts are
  unaffected (default `false`) and old Prompt Library backups without
  this field still import correctly.
- **Dynamic customer-name substitution**: when a prompt requiring a
  name is selected, the Workspace panel shows a "사용자 이름" field
  above Generate; Generate is blocked with "사용자 이름을
  입력해주세요." while it's empty. Independent of Work Type, which
  still only affects filename generation.
- **Prompt + Work Type integrated Backup / Restore**: Settings' Backup
  / Restore now covers the Prompt Library and the Work Type List
  together, in one action.
- **Unified backup file**: exports to `GPT_Image_Studio_Backup.json`,
  containing `{ version, prompts, workTypes }`.
- **Legacy backup compatibility**: a pre-1.2.0 Prompt-Library-only
  backup file (a bare array, no `version`/`workTypes`) still imports
  correctly - only the Prompt Library is restored, exactly as before.

## Version 1.1.2 (2026-08-05)

- Fixed production-only Workspace image detection race condition.
- Fixed false image detection caused by uploaded image thumbnails.
- Improved production stability.
- Improved multi-workspace reliability.
- Finalized production release.

## Version 1.1.1 (2026-08-05)

- Fixed the cross-Workspace Error bug that survived v1.1.0's download-
  attribution fix: creating a new Workspace (or deleting one) while
  another Workspace was mid-generation could silently discard that
  other Workspace's in-progress state update, incorrectly flipping it
  to Error. Root cause: `onAddWorkspace`/`onDeleteWorkspace` were the
  only two places in the app that replaced Workspace state from a
  stale snapshot instead of updating against React's live state: fixed
  by converting both to the same functional update form already used
  everywhere else.
- Verified via a live repro (Workspace A generating, Workspace B
  created and uploaded into mid-generation) with dev-only diagnostic
  logging that proved the fix - no unrelated behavior changed.

## Version 1.1.0 (2026-08-05)

- Fixed multi-Workspace download race condition.
- Improved Workspace isolation.
- Improved download ownership.
- Improved stability across different PCs.
- Official production installer.

## Version 1.0.0 (2026-08-03)

- Initial official release. The Workspace IS the tab: independent
  ChatGPT session, Prompt, Work Type, upload, and generation status
  per Workspace. Prompt Library and Work Type Management with
  Backup/Restore, automatic filename-based saving, and a full
  Settings system. See ROADMAP.md and WORKLOG.md for full detail.
