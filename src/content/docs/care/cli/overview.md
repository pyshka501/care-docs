---
title: CLI Overview
description: The Maestro command line — every subcommand at a glance, and the two names it answers to.
sidebar:
  order: 1
---

Maestro ships one command-line program with two names:

- **`maestro`** — the main name. `uvx maestro-install` puts a `maestro` shim on your
  `PATH`.
- **`care`** — the same program under the package's old name, kept for scripts that
  already call it. Every example below works with either name.

`maestro` with **no subcommand opens the desktop app** (the same as `maestro app`).
Never call it bare from a script or CI job: it opens a window and blocks until you
close it. The headless subcommands share the app's config (`CareConfig`) and the same
Memory, generation and execution layers. Run `maestro <subcommand> --help` for the
full flag set of each one.

```bash
maestro --version        # prints e.g. "maestro 0.5.0"
maestro doctor           # check the environment
maestro generate "weather report for SF" --save weather
```

## Interfaces

| Command | Purpose |
| --- | --- |
| `maestro` / `maestro app` | Open the desktop app (the primary interface). |
| `maestro tui` | Open the Textual terminal UI (supported secondary interface). |
| `maestro web` | Serve the local browser interface on `127.0.0.1:8787`. |

Details: [Launching interfaces](/care/cli/app/).

## Setup

| Command | Purpose |
| --- | --- |
| `maestro init` | Quick start: write a minimal `.env` with model credentials. |
| `maestro doctor` | Environment, config, extras and service probes (incl. STARM solver servers). |
| `maestro migrate-secrets` | Move plaintext API keys from `config.toml` into the OS keychain. |

## Discovery and validation

| Command | Purpose |
| --- | --- |
| `maestro catalog` | List installed AgentSkills, MCP servers, tools and memory cards. |
| `maestro validate <chain.json>` | Parse and preflight a chain file. |
| `maestro import <pattern>...` | Validate chain JSON files; `--apply` saves them to Memory. |
| `maestro export <output> <chain_id>...` | Bundle chains (and skills) into a tarball. |

## Generate, edit, run, replay

| Command | Purpose |
| --- | --- |
| `maestro generate "<task>"` | Generate a chain from a task description. |
| `maestro revise <chain_id> "<edit>"` | Edit a saved chain in plain language into a new version. |
| `maestro compose <id> <id>...` | Glue saved chains into one new chain (sequential or parallel). |
| `maestro run <chain_id>` | Fetch a saved chain, preflight it, optionally execute it. |
| `maestro replay <run.json>` | Step through a saved `ReasoningResult` / `RunRecord`. |

## Memory and library

| Command | Purpose |
| --- | --- |
| `maestro memory ls` | List saved entities. |
| `maestro memory show <id>` | Print one entity. |
| `maestro memory history <chain_id>` | List recorded runs of a chain. |
| `maestro search "<query>"` | BM25 / vector / hybrid search over saved entities. |
| `maestro diff <left> <right>` | Compare two saved chains. |
| `maestro lineage <chain_id>` | Walk a chain's ancestry. |
| `maestro favourite <id>` | Star or unstar an entity. |

## Versions and long-term memory

| Command | Purpose |
| --- | --- |
| `maestro versions <id>` | Version history and which channels point where. |
| `maestro rollback <id> --to <version>` | Repoint a channel at a version (a pin, nothing is deleted). |
| `maestro promote <id>` | Copy one channel pointer to another (default `latest` → `stable`). |
| `maestro forget <id>` | Soft-delete an entity (preview unless `--force`). |
| `maestro remember "<text>"` | Save a note to long-term memory. |
| `maestro notes` | Print the long-term memory digest. |

## Marketplace and evolution

| Command | Purpose |
| --- | --- |
| `maestro marketplace "<query>"` | Search shared `agent_skill` listings. |
| `maestro evolve <chain_id>` | Submit an evolution run, optionally watch it and accept the winner. |

## Datasets and deployment

| Command | Purpose |
| --- | --- |
| `maestro dataset list\|add\|run\|export` | Manage and score a chain's eval dataset. |
| `maestro deploy <chain_id>` | Deploy a chain to the agent hub as an HTTP agent. |
| `maestro deployments` | List agents on the hub. |
| `maestro metrics [name]` | Usage and cost metrics of deployed agents. |

## Help

| Command | Purpose |
| --- | --- |
| `maestro help [--markdown] [--commands]` | Tutorial and key cheat sheet, or the CLI ↔ TUI parity table. |

:::note[Not in the CLI]
There are no `setup`, `discovery`, `capabilities` or `benchmark` subcommands. The
pages with those names in this section group related commands. Benchmark and
dataset generation, IdeaL idea work and the tools workshop live in the desktop app.
:::

:::tip
Detailed pages: [Launching interfaces](/care/cli/app/) ·
[Generate, Run & Replay](/care/cli/generate-run/) · [Revise](/care/cli/revise/) ·
[Compose](/care/cli/compose/) · [Setup](/care/cli/setup/) ·
[Discovery & Validation](/care/cli/discovery/) · [Export & Import](/care/cli/export/) ·
[Memory & Library](/care/cli/memory/) · [Datasets](/care/cli/dataset/) ·
[Deploy & Metrics](/care/cli/deploy/) · [Marketplace, Evolution & Help](/care/cli/capabilities/).
:::

:::note[Driving the CLI from an agent?]
Install the [Maestro agent skill](/care/skill/overview/). It teaches Claude Code,
Codex, hermes or OpenClaw to run these commands and finds the program on its own.
:::
