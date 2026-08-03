# GPT Image Studio

A dedicated ChatGPT Image Generation Studio for Windows - not a
ChatGPT/Project manager. It embeds ChatGPT directly in the app and
automates prompt insertion, generation, and downloading, so producing
a batch of AI images never requires leaving the app or touching
ChatGPT's own UI by hand.

Built for production photo/image workflows: upload a reference image,
pick a saved Prompt, optionally tag it with a Work Type (e.g. a photo
studio's own job categories), click Generate, and the result is
automatically downloaded and named - no manual save dialog, no manual
renaming.

## Core workflow

```
Prompt Library (left)   ->  reusable Prompt templates (Create/Edit/Delete)
Workspace tabs (top)    ->  each tab is one independent job:
                             its own ChatGPT conversation, uploaded
                             image, selected Prompt, selected Work Type,
                             and generation status
ChatGPT Browser (center)->  the live ChatGPT conversation for the
                             active Workspace tab
Workspace panel (right) ->  Image upload -> Prompt select -> Work Type
                             select -> Generate / Clear -> status
```

- **Workspace tabs** - each tab owns its own ChatGPT conversation, own
  uploaded image, own selected Prompt and Work Type, and its own
  Generate/status state, fully independent of every other tab (two
  tabs can generate at the same time). A tab is automatically renamed
  to match whichever Prompt is selected.
- **Clear** - resets only the active tab (image, Prompt, Work Type,
  status, conversation) back to a brand-new state instantly, so the
  next image can start without opening a new tab.
- **Prompt Library** - saved Title/Prompt/Negative Prompt templates,
  persisted locally, with Backup/Restore to a `prompt-library.json`
  file (never overwrites an existing prompt without asking).
- **Work Type Management** - user-defined job categories (Settings >
  Work Type Management), shown as compact chips on the Workspace
  panel; at most one selected per tab, and its own filename prefix is
  automatically folded into the saved filename.
- **Automatic saving** - every generated image downloads and renames
  itself automatically: `{Prefix}{Work Type Prefix?}{Prompt Title}.png`
  the first time that name is used, or `...2.png`, `...3.png`, ... if
  that name already exists. Never overwrites a file.
- **Settings** - Download Folder (with a dedicated toolbar Open Folder
  shortcut), Prompt Library Backup/Restore, Work Type Management, the
  filename Prefix (with a live Preview), read-only Application
  Information, Maintenance, and Credits.
- **Maintenance > Reset Application Data** - a single confirmed action
  that clears the Prompt Library and Work Type list back to empty (for
  starting over from scratch). It never touches the Download Folder,
  filename Prefix, or any other Setting, and always asks for
  confirmation first - there is no undo.

Workspace tabs and their state are **runtime-only** - closing the app
discards every open tab. The Prompt Library, Work Type list, and
Settings all persist across a restart.

On the very first launch after installing, a one-time notice (in
Korean - see License below) explains the terms of use; acknowledging
it (확인) is recorded so it never appears again.

See `ROADMAP.md` for the full verified feature list and `WORKLOG.md`
for the session-by-session history of how it was built and verified.

## Tech stack

Electron + React + TypeScript + Vite. ChatGPT runs inside a persistent
`<webview>` per Workspace tab, all sharing one login (one Electron
session partition).

## Development

```
npm install
npm run dev      # Vite + Electron, with hot reload
```

## Build

```
npx tsc --noEmit             # type-check only
npx eslint . --ext ts,tsx    # lint only
npx vite build                # renderer + electron main/preload bundle only
npm run build                 # the above, plus electron-builder installer packaging
```

`electron-builder`'s Windows packaging step needs Windows Developer
Mode or admin rights (it unpacks a bundled helper-tool archive that
requires creating symbolic links) - not required for local development
or for verifying the app itself works, only for producing the final
`.exe` installer/portable build.

## Release (Version 1.0.0)

`npm run build` produces, in `Release/`:
- `GPT Image Studio v1.0.0 Setup.exe` - NSIS installer (Desktop +
  Start Menu shortcuts, uninstaller)
- `GPT Image Studio v1.0.0 Portable.exe` - no install required

## License

© 2026 leessem. All Rights Reserved.

본 프로그램은 개인용 비상업적 목적으로 제작되었습니다. 제작자의 사전
허가 없이 본 프로그램의 무단 복제, 무단 배포 및 무단 판매를 금합니다.

(This software was created for personal, non-commercial use.
Unauthorized copying, redistribution, or sale without the author's
prior permission is prohibited.)
