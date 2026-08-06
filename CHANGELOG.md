# CHANGELOG

All notable changes to GPT Image Studio are documented in this file.

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
