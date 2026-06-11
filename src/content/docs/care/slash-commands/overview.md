---
title: Slash Commands
description: Every in-chat /command in the MAESTRO CARE TUI.
sidebar:
  order: 1
---

In the chat surface, anything that **isn't** a `/command` is sent to MAGE as a task
description. Slash commands are the non-chat affordances — open screens, manage the
session, switch modes.

:::tip
Type `/help` in the TUI for the live list filtered to your current mode, and `/tour`
for a 5-step walkthrough.
:::

## Core

| Command | What it does |
| --- | --- |
| `/help` | Show the command help. |
| `/tour` | 5-step guided walkthrough. |
| `/mode [ad-hoc\|production]` | Switch or show the current [chat mode](/care/getting-started/overview/). |
| `/settings` | Open the Settings screen. |
| `/new` | Start a fresh chat (resets Ad-Hoc history). |
| `/clear` | Clear the transcript. |
| `/quit` | Exit MAESTRO CARE. |

## Chains & library

| Command | What it does |
| --- | --- |
| `/artifacts` | Browse chains generated in this chat. |
| `/library` | Open the saved-agents library. |
| `/run <chain_id>` | Open a saved chain for execution. |
| `/revise [<id>] <change>` | Edit a chain in natural language (MAGE edit mode → saves a new version). |
| `/marketplace "<query>"` | Search shared `agent_skill` listings. |
| `/memory ...` | Browse the Memory store. |
| `/evolution [<run_id>]` | Open the evolution dashboard / a run. |

## Session & transcript

| Command | What it does |
| --- | --- |
| `/resume [latest\|<file>]` | Rehydrate a saved session. |
| `/sessions` | List / manage saved sessions. |
| `/history [N]` | List recent prompts + saved chains. |
| `/edit [N\|list]` | Re-edit a past user prompt (1-based turn). |
| `/multi` | Open a multi-line task composer. |
| `/branch [name\|list\|switch <id>\|delete <id>]` | Transcript checkpoints. |
| `/blocks [copy\|save N [path]]` | List or act on code blocks. |
| `/export <md\|mdx\|json\|html> [path]` | Save the transcript to disk. |
| `/remember <text>` | Save a note into long-term context. |

## Diagnostics & UI

| Command | What it does |
| --- | --- |
| `/status` | Session status summary. |
| `/cost` | Open the cost dashboard. |
| `/runs` | Open the runs screen. |
| `/logs` / `/log [level] [module]` | Open / tail the app log. |
| `/profile` | Open the profile screen. |
| `/sandbox` | Sandbox trust settings. |
| `/subagents [clear]` | Render captured CARL step events as a tree. |
| `/theme [name]` | List or switch the UI theme. |
| `/imgpreview [status\|<path>]` | Terminal-graphics support / image sequence. |
| `/voice [status\|transcribe <path>]` | Whisper transcription. |

See [Production commands](/care/slash-commands/production/) for the
dataset / evolution / publish commands available in Production mode.
