---
title: CLI Overview
description: The headless `care` command-line interface — every subcommand at a glance.
sidebar:
  order: 1
---

`care` (no subcommand) launches the TUI. The headless subcommands share the same
`CareConfig` and data layers the TUI uses — every screen's primary affordance has
a terminal twin. Run `care <subcommand> --help` for the full flag set on each.

## Setup

| Command | Purpose |
| --- | --- |
| `care init` | One-shot quick-start: write a minimal `.env` (or full `config.toml` with `--toml`). |
| `care doctor` | Environment, config, and dependency health report. |
| `care migrate-secrets` | Move plaintext API keys into the OS keychain. |

## Discovery & validation

| Command | Purpose |
| --- | --- |
| `care catalog` | List installed AgentSkills, MCP servers, tools, capability cards. |
| `care validate <chain.json>` | Parse + preflight a CARL chain. |
| `care import <pattern>...` | Batch-validate (dry-run) or import chain JSON files. |

## Generate / run / replay

| Command | Purpose |
| --- | --- |
| `care generate "<task>"` | One-shot MAGE generation. |
| `care run <chain_id>` | Fetch a saved chain, preflight, and optionally execute via CARL. |
| `care replay <run.json>` | Step through a saved `ReasoningResult` / `RunRecord`. |

## Memory browse

| Command | Purpose |
| --- | --- |
| `care memory ls` | List saved entities. |
| `care memory show <id>` | Drill down on a single entity. |
| `care memory history <chain_id>` | List recorded runs for a chain. |
| `care search "<query>"` | BM25 / vector / hybrid search across saved entities. |
| `care diff <left> <right>` | Side-by-side chain compare. |
| `care lineage <chain_id>` | Walk the ancestry DAG. |
| `care favourite <id>` | Star / unstar a library entity. |

## Capabilities & evolution

| Command | Purpose |
| --- | --- |
| `care marketplace "<query>"` | Search shared `agent_skill` listings. |
| `care evolve <chain_id>` | Submit + watch + accept an evolution run. |

## UX

| Command | Purpose |
| --- | --- |
| `care help [--markdown]` | Render the tutorial + cheat-sheet. |

:::tip
Detailed pages (in the sidebar): [Generate, Run & Replay](/care/cli/generate-run/) ·
[Setup](/care/cli/setup/) · [Discovery & Validation](/care/cli/discovery/) ·
[Memory & Library](/care/cli/memory/) · [Capabilities & Evolution](/care/cli/capabilities/).
:::

:::note[Driving `care` from an agent?]
Install the [care-cli Agent Skill](/care/skill/overview/) — it teaches Claude Code or
hermes to run every command above, with portable auto-detection of `care`.
:::
