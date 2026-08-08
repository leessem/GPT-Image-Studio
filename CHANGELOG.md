# CHANGELOG

All notable changes to GPT Image Studio are documented in this file.

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
