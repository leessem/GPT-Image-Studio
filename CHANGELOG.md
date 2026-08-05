# CHANGELOG

All notable changes to GPT Image Studio are documented in this file.

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
