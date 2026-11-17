---
title: Slash Commands
description: Every /command registered in the Maestro TUI chat.
sidebar:
  order: 1
---

In the [TUI](/care/tui/overview/) chat, anything that **isn't** a `/command` is sent
to the chain generator as a task. Slash commands are the other actions: open screens,
manage the session, switch modes, work with the library and the agent hub.

The TUI registers 44 commands. All of them work in both modes; `/help` lists a
mode-specific selection (Production swaps the bare `/evolution` row for the dataset,
upload, forget and evolution sub-forms, see [Production commands](/care/slash-commands/production/)).
Type `/` for an autocomplete popup with a one-line description of each.

:::tip
`/help` prints the modes overview and the command list for your current mode. `/tour`
starts a 5-step walkthrough. `maestro help --commands` shows which slash commands
have a CLI counterpart.
:::

## Core

| Command | What it does |
| --- | --- |
| `/help` | Show the modes overview and the command list. |
| `/tour` | 5-step guided walkthrough (arguments are ignored). |
| `/mode [interactive\|production]` | Show or switch the [chat mode](/care/workflows/modes/). Also accepts `chat`, `agent`, `prod` and the legacy `ad-hoc`. |
| `/settings` | Open the Settings screen. |
| `/status` | Health report for the chain generator, Memory and Platform. |
| `/new` | Start a new Interactive conversation (drops context). |
| `/clear` | Clear the transcript. |
| `/quit` · `/exit` | Exit Maestro. |

## Chains and library

| Command | What it does |
| --- | --- |
| `/artifacts` | Browse chains generated in this chat. |
| `/library` | Open the saved chains library. |
| `/run <chain_id>` | Open a saved chain on the Inspection screen to run it. |
| `/revise <id> <change>` | AI-edit a saved chain: preview the diff, save as a new version on confirm. `/revise <change>` finds the chain from your words. |
| `/versions <id\|name> [diff <vA> <vB>]` | Version history with channel pointers; `diff` shows the JSON patch between two versions. |
| `/rollback <id\|name> [--channel stable] [--to <version-id>]` | Repoint a channel one version back, or to a given version. Nothing is deleted. |
| `/promote <id\|name> [--from latest] [--to stable] [--force]` | Gated release, see [Production commands](/care/slash-commands/production/). |
| `/marketplace [query]` | Open the `agent_skill` marketplace. |
| `/evolution` | Evolution primer, then the runs dashboard. |

## Agent hub

| Command | What it does |
| --- | --- |
| `/deploy <id\|name> [--channel stable] [--name x]` | Deploy a saved chain as an HTTP agent with its own Swagger page. |
| `/deployments [undeploy\|reload\|docs <name>]` | List hub agents, or undeploy, reload or open the docs of one. |
| `/metrics` | Per-agent usage and USD cost from the hub. Read-only. |

Details: [Deploying agents](/care/workflows/deploy/).

## Memory and context

| Command | What it does |
| --- | --- |
| `/memory [show\|forget <key>\|edit]` | Show `CARE.md` and long-term memory, delete one key, or open `CARE.md` in your editor. |
| `/remember <text>` | Save a note to long-term memory; the model merges it with stale facts. A message starting with `#` does the same. |

## Session and transcript

| Command | What it does |
| --- | --- |
| `/resume [latest\|<file>]` | List recent sessions, or rehydrate the newest or a given one. |
| `/sessions [latest\|<id>]` | List saved artifact sessions, or rehydrate one. |
| `/history [N]` | List recent prompts and saved chains. |
| `/edit [N\|list]` | Re-edit a past user prompt (1-based turn). |
| `/multi` | Open a multi-line task composer. |
| `/branch [name\|list\|switch <id>\|delete <id>]` | Save, list, switch or delete transcript checkpoints. |
| `/blocks [copy <N>\|save <N> <path>]` | List, copy or save fenced code blocks. |
| `/export <md\|mdx\|json\|html> [path]` | Save the transcript to disk. |

## Diagnostics and UI

| Command | What it does |
| --- | --- |
| `/cost` | Token and spend dashboard. |
| `/runs` | Local run history (`~/.cache/care/runs`). |
| `/logs` · `/log [level] [module]` | Open the log viewer, or tail the rolling app log in chat. |
| `/profile` | List credential profiles. |
| `/sandbox` | Audit and revoke trusted AgentSkills. |
| `/subagents [clear]` | Render captured chain step events as a tree. |
| `/theme [name]` | List or switch the UI theme. |
| `/imgpreview [status\|<path>]` | Detect terminal graphics support or build an image sequence. |
| `/voice [status\|transcribe <path>]` | Whisper backend status, or transcribe an audio file. Needs the optional voice dependencies. |

## Production lifecycle

| Command | What it does |
| --- | --- |
| `/dataset list\|add\|run\|export …` | Manage and score a chain's dataset. |
| `/upload <chain_id>` | POST a saved chain to `CARE_UPLOAD__URL`. |
| `/forget <chain_id> [--force]` | Soft-delete a chain and its dataset (preview without `--force`). |

These are listed by `/help` in Production mode; see
[Production commands](/care/slash-commands/production/).
