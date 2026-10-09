---
title: What is Maestro?
description: Maestro is a desktop app for generating, running, repairing and evolving agent chains. The TUI and the CLI remain as secondary interfaces.
sidebar:
  order: 1
---

**Maestro** is a desktop application for building agent chains. You describe a
task in chat; Maestro generates a chain, runs it on your input, repairs it if a
run fails, saves it to memory and evolves it against a dataset.

A chain is a small program of typed steps (model calls, tools, MCP servers,
skills) with dependencies between them. Chains are written in the
[CARL format](/carl/getting-started/overview/).

## Interfaces

| Interface | Command | Status |
| --- | --- | --- |
| **Maestro desktop app** | `maestro` (or `maestro app`) | Primary. A native window with a chat agent, the Library, Activity and Settings. |
| Textual TUI | `maestro tui` | Supported, secondary. Terminal chat with Interactive and Production modes. |
| Headless CLI | `maestro <subcommand>` | Supported, secondary. Scripting, CI, Memory administration. |
| Agent skill | — | Drive Maestro from another agent through the CLI. See [Agent skill](/care/skill/overview/). |

The Python package is `maestro-care`; its import name and older command name is
`care`. `care` still works as an alias of `maestro`.

## What the desktop app does

The app is built around the **Maestro harness**: a resident chat agent with
sessions, tools, approvals and background jobs. Chain work is done by typed
Maestro tools that the agent calls on your behalf.

- **Generate** a chain from a task description, or let the chat agent write one
  itself.
- **Run** the chain on your input; pause, resume or stop it between steps.
- **Repair** a failed run: Maestro proposes a corrected chain; running it is a
  separate step.
- **Save** chains to memory and find them later in the
  [Library](/care/app/library/).
- **Generate evolution data**: a verified dataset for a chain.
- **Evolve** a chain on that dataset with the evolution platform.
- **Work with ideas** in [IdeaL](/ideal/getting-started/overview/): add ideas,
  watch which ones help evolution, steer a running evolution.
- **Create tools and skills** in the workshop, with checks before saving.

All model calls (generation, execution, repair, data generation, drafts) use
the **chat model you selected in the session**. Paid work asks for one
confirmation in an app dialog. See [Confirmations](/care/app/confirmations/).

## The stack

| Part | Role |
| --- | --- |
| **Maestro** (`maestro-care`) | The app, the harness plugins, the CLI and the TUI. |
| **MAGE** (`mmar-mage`) | Generates a CARL chain from a task description. |
| **CARL** (`mmar-carl`) | Executes chains. See [CARL](/carl/getting-started/overview/). |
| **GigaEvo Memory** with **IdeaL** | Stores chains, memory cards, tools and skills; IdeaL stores ideas and their effect on evolution. |
| **GigaEvo Platform** | Evolves a chain against a dataset. |

Details: [Architecture](/care/concepts/architecture/).

## Where to go next

- [Quick start](/care/getting-started/quick-start/): install, open the app, set the model, build the first chain.
- [The desktop app](/care/app/overview/): sessions, the Library, Activity, Settings.
- [Release 0.5.0](/care/reference/release-0-5-0/): what this release contains and its known limits.
- [CLI reference](/care/cli/overview/) and [TUI](/care/tui/overview/) for the secondary interfaces.
