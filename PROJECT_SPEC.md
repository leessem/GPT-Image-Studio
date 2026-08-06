# GPT Image Studio
## Project Specification

Current Stable Version: v1.2.1

This document is the authoritative technical specification for GPT Image Studio.

It defines the application architecture, development rules, release policy, data structures, and future roadmap.

Any future development should follow this specification unless intentionally revised.




========================================================
GPT Image Studio Project Specification
Part 1 - Project Overview
========================================================

Project Name

GPT Image Studio

Current Version

v1.2.1

--------------------------------------------------------
Project Purpose
--------------------------------------------------------

GPT Image Studio is a Windows desktop application designed
to automate ChatGPT image-generation workflows for a photo
studio.

The application embeds the ChatGPT website inside an
Electron WebView and automates repetitive tasks such as
uploading images, inserting prompts, generating images,
and downloading the generated results.

This application DOES NOT use the OpenAI API.

It automates the ChatGPT Web interface.

--------------------------------------------------------
Development Environment
--------------------------------------------------------

Frontend
- React
- TypeScript
- Vite

Desktop
- Electron

Packaging
- electron-builder

Platform
- Windows

Version Control
- Git
- GitHub

Distribution
- Setup Installer
- Portable Build

--------------------------------------------------------
Primary Workflow
--------------------------------------------------------

User uploads an image

↓

Selects a Prompt

↓

Clicks Generate

↓

ChatGPT generates an image

↓

Program automatically downloads it

↓

Automatically saves it with the proper filename

The goal is to minimize repetitive work inside a photo
studio.

--------------------------------------------------------
Application Architecture
--------------------------------------------------------

The application is Workspace-based.

Each Workspace is completely independent.

Each Workspace owns:

- Its own ChatGPT WebView
- Its own Prompt selection
- Its own generation state
- Its own upload state
- Its own download state

Multiple Workspaces can work simultaneously.

--------------------------------------------------------
Workspace
--------------------------------------------------------

Each Workspace supports:

- Upload Image
- Generate
- Automatic Download

All Workspaces operate independently.

Example:

Workspace A
Generating...

Workspace B
Uploading...

Workspace C
Waiting...

No Workspace should interfere with another.

--------------------------------------------------------
WebView
--------------------------------------------------------

ChatGPT runs inside Electron WebView.

The program DOES NOT call the OpenAI API.

Automation is performed using DOM interaction.

Automated operations include:

- Upload Image
- Insert Prompt
- Click Generate
- Detect Generated Image
- Download Image

--------------------------------------------------------
Automatic Save
--------------------------------------------------------

When image generation completes,

the application automatically saves the generated image
into the user-selected Download Folder.

Filename generation is automatic.

Duplicate filenames are automatically avoided.

--------------------------------------------------------
Work Type
--------------------------------------------------------

Work Type exists ONLY for filename generation.

Examples

★ Maternity

★ Newborn

★ 50 Days

★ 100 Days

Work Type NEVER modifies the prompt.

It ONLY affects generated filenames.

--------------------------------------------------------
Prompt Library
--------------------------------------------------------

Prompt Library stores reusable prompts.

Functions:

- Create
- Edit
- Delete
- Import
- Export

Prompt Library is independent from Workspaces.

Each Workspace simply selects a prompt.

--------------------------------------------------------
Prompt Variables
--------------------------------------------------------

Currently supported variables:

{NAME}

{NUM}

These variables are replaced ONLY immediately before
sending the prompt to ChatGPT.

Example

Stored Prompt

Create premium typography

{Name}

{NUM}

User Input

Name

Minjun

Number

100

Prompt sent to ChatGPT

Create premium typography

Minjun

100

The stored prompt template is NEVER modified.

Replacement only occurs during Generate.

========================================================
End of Part 1
========================================================


========================================================
GPT Image Studio Project Specification
Part 2 - Features & Data Structure
========================================================

--------------------------------------------------------
Prompt Variable System
--------------------------------------------------------

Version

Introduced in v1.2.0

Extended in v1.2.1

Purpose

Remove the need to edit prompts whenever customer
information changes.

--------------------------------------------------------
Supported Variables
--------------------------------------------------------

Current variables

{NAME}

{NUM}

Variables are replaced ONLY immediately before sending
the prompt to ChatGPT.

The stored prompt is NEVER modified.

--------------------------------------------------------
Prompt Library
--------------------------------------------------------

Each Prompt contains

Title

Prompt Content

Requires Name (Boolean)

Requires Number (Boolean)

Example

Title

Baby Typography

Requires Name

true

Requires Number

true

Prompt

Create an elegant typography image.

Name

{NAME}

Number

{NUM}

--------------------------------------------------------
Workspace Input
--------------------------------------------------------

When a Prompt is selected

If

Requires Name == true

Display

Customer Name

[____________]

If

Requires Number == true

Display

Number

[____________]

If both are enabled

Display both inputs.

Each Workspace stores its own values independently.

--------------------------------------------------------
Validation
--------------------------------------------------------

If Name is required

and empty

Generate is blocked.

Display

사용자 이름을 입력해주세요.

If Number is required

and empty

Generate is blocked.

Display

숫자를 입력해주세요.

--------------------------------------------------------
Prompt Library Backup
--------------------------------------------------------

Backup includes

Prompt Library

Work Type List

One unified backup file.

File name

GPT_Image_Studio_Backup.json

--------------------------------------------------------
Backup Format
--------------------------------------------------------

Example

{

"version":"1.2.1",

"prompts":[
...
],

"workTypes":[
...
]

}

--------------------------------------------------------
Backward Compatibility
--------------------------------------------------------

Old Prompt-only backup files

continue to restore correctly.

If

version

does not exist

assume legacy format.

If

workTypes

does not exist

restore Prompt Library only.

--------------------------------------------------------
Work Type
--------------------------------------------------------

Purpose

Filename generation ONLY.

Work Type NEVER modifies prompts.

Examples

★ Maternity

★ Newborn

★ 50 Days

★ 100 Days

Filename Example

★Maternity_BabyPortrait_001.png

--------------------------------------------------------
Automatic Filename Generation
--------------------------------------------------------

Filename automatically includes

Work Type

Prompt Name

Sequence Number

Duplicate filenames are automatically avoided.

--------------------------------------------------------
Download Folder
--------------------------------------------------------

User selects a Download Folder.

All generated images are automatically saved there.

Download Folder is NOT included in Backup.

Reason

Each computer may use different drives or folders.

--------------------------------------------------------
Settings
--------------------------------------------------------

Settings are stored locally.

Settings include

Download Folder

Prompt Library

Work Type

Prompt Variable configuration

Workspace configuration

User-specific settings remain local.

--------------------------------------------------------
Import / Export Policy
--------------------------------------------------------

Import

Merge or Replace existing data.

Export

Exports unified backup file.

Compatible with previous backup versions.

--------------------------------------------------------
Prompt Library Design Rules
--------------------------------------------------------

Prompt templates should contain only variables.

Examples

{Name}

{NUM}

Do NOT store customer-specific information.

Customer information should always be entered from
Workspace input fields.

========================================================
End of Part 2
========================================================


========================================================
GPT Image Studio Project Specification
Part 3 - Architecture, Release Policy & Development Rules
========================================================

--------------------------------------------------------
Application Architecture
--------------------------------------------------------

GPT Image Studio is built around independent Workspaces.

Each Workspace owns its own state.

Each Workspace contains:

- ChatGPT WebView
- Prompt Selection
- Upload State
- Generate State
- Download State
- Customer Name
- Customer Number

No Workspace should ever modify another Workspace.

All state updates must remain Workspace-scoped.

--------------------------------------------------------
Electron Architecture
--------------------------------------------------------

Electron Main Process

Responsible for:

- Application lifecycle
- Download handling
- Window creation
- IPC communication
- Automatic file saving

Electron Renderer

Responsible for:

- React UI
- Prompt Library
- Workspace UI
- User interactions

Electron WebView

Responsible for:

- Running ChatGPT
- Uploading images
- Typing prompts
- Clicking Generate
- Detecting generated images

--------------------------------------------------------
Workspace Rules
--------------------------------------------------------

Each Workspace is independent.

Each Workspace has:

Own Prompt

Own Name

Own Number

Own Generate State

Own Download State

Own WebView

Never share Workspace state.

Never use global state for generation.

--------------------------------------------------------
Prompt Processing Pipeline
--------------------------------------------------------

Image Upload

↓

Prompt Selected

↓

Replace Prompt Variables

{NAME}

{NUM}

↓

Inject Prompt into ChatGPT

↓

Click Generate

↓

Wait for generated image

↓

Open generated image

↓

Download image

↓

Automatic Save

--------------------------------------------------------
Automatic Download
--------------------------------------------------------

Downloads are handled by Electron Main Process.

Renderer should only initiate requests.

Renderer should never own download state.

Downloaded images are automatically renamed.

--------------------------------------------------------
Automatic Save
--------------------------------------------------------

Filename consists of

Work Type

+

Prompt Name

+

Sequence Number

Duplicate filenames are automatically avoided.

--------------------------------------------------------
Prompt Variables
--------------------------------------------------------

Supported

{NAME}

{NUM}

Prompt variables are replaced only once:

Immediately before prompt submission.

Stored Prompt Templates must NEVER be modified.

--------------------------------------------------------
Backup Policy
--------------------------------------------------------

Backup file

GPT_Image_Studio_Backup.json

Contains

Prompt Library

Work Type List

Does NOT contain

Download Folder

Window Position

Workspace State

Temporary Data

--------------------------------------------------------
Backward Compatibility
--------------------------------------------------------

Every new feature must preserve compatibility.

Old backup files must continue working.

Missing fields should automatically use defaults.

--------------------------------------------------------
Installer Policy
--------------------------------------------------------

Every release produces

Setup Installer

Portable Version

Release folder contains ONLY

Setup.exe

Portable.exe

README.txt

VERSION.txt

GPT_Image_Studio_Backup.json (Sample)

Debug files must never be included.

--------------------------------------------------------
Git Policy
--------------------------------------------------------

Every release must

Commit

Push

Create Git Tag

Push Tag

Repository must remain clean after release.

--------------------------------------------------------
Version Policy
--------------------------------------------------------

Patch Versions

Example

1.2.1

Bug fixes

Small features

Minor Versions

Example

1.3.0

UI improvements

Workflow improvements

Major Versions

Example

2.0.0

Architecture changes

Large feature additions

--------------------------------------------------------
Coding Rules
--------------------------------------------------------

Before implementing new features

Never modify stable code unless required.

Prefer extending existing systems.

Avoid rewriting working code.

Implement the smallest possible change.

Always preserve backward compatibility.

Run

tsc

eslint

before release.

--------------------------------------------------------
Release Checklist
--------------------------------------------------------

Every release must verify

✓ Build succeeds

✓ Installer works

✓ Portable works

✓ Prompt Library works

✓ Work Type works

✓ Backup works

✓ Restore works

✓ Multi-Workspace works

✓ Automatic Save works

✓ Filename generation works

✓ Prompt Variables work

✓ GitHub Push succeeds

✓ Git Tag created

--------------------------------------------------------
Copyright
--------------------------------------------------------

This application is a personal,

non-commercial utility.

Unauthorized redistribution,

resale,

or commercial distribution

is prohibited.

The application uses the ChatGPT website.

It is NOT affiliated with,

endorsed by,

or produced by OpenAI.

--------------------------------------------------------
Future Roadmap
--------------------------------------------------------

Planned Version 1.3.x

- Collapsible GPT Viewer
- Collapsible Prompt Library
- Workspace Status Indicators
- Improved Workspace usability

Possible Version 1.4.x

- Additional workflow improvements
- Productivity enhancements
- Quality-of-life features

Possible Version 2.0

- Major UI redesign
- Advanced Workspace management
- Performance optimization
- Plugin-ready architecture

========================================================
End of Project Specification
========================================================