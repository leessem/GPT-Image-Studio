# GPT-Image-Studio

This is an Electron + React + TypeScript desktop application.

The purpose of this application is to automate ChatGPT image generation workflows.

The application embeds ChatGPT inside an Electron BrowserView and automatically submits prompts, waits for image generation to complete, and processes multiple jobs sequentially.

----------------------------------------------------
Current Features
----------------------------------------------------

- Embedded ChatGPT browser
- Prompt queue
- Sequential job execution
- Image generation waiting
- Stop queue
- Local project save/load
- Drag & Drop image panel
- Toolbar
- Job management

----------------------------------------------------
Current Refactoring Goal
----------------------------------------------------

The original application was designed around a single Job list.

Old structure

Job[]

The application is currently being refactored into a multi-project architecture.

New structure

Project
 ├── Tabs
 │      └── Jobs[]

Each tab represents an independent job queue.

----------------------------------------------------
Important Design Rules
----------------------------------------------------

Every Project contains multiple Tabs.

Only one Tab is active.

Only the active Tab is executed.

The queue always works on

Project
 -> Current Tab
 -> Jobs

Never execute jobs from inactive tabs.

----------------------------------------------------
Coding Rules
----------------------------------------------------

Always keep the project compiling.

Never output partial code.

Always modify complete files.

If multiple files must change together, modify them together.

Read the existing implementation before changing it.

Reuse existing code whenever possible.

Do not rewrite working code without reason.

----------------------------------------------------
Workflow
----------------------------------------------------

For every implementation step

1. Read related files
2. Modify files
3. Verify build
4. Explain changes briefly
5. Suggest git commit

----------------------------------------------------
Goal

The goal is to build a stable desktop application that can manage multiple prompt collections and automatically generate AI images through ChatGPT.



Developer Preferences

- I prefer complete source files.
- Keep explanations short.
- Focus on implementation.
- Minimize unnecessary refactoring.
- Preserve the existing coding style.
- Never ask me to paste files that already exist in the repository.
- Read the repository directly.
- When finished with a step, recommend a Git commit message.