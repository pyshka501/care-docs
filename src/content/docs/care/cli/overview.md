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
| `care init` | One-shot quick-start: write a minimal `.env`. |
| `care doctor` | Environment, config, and dependency health report. |
| `care migrate-secrets` | Move plaintext API keys into the OS keychain. |

## Discovery & validation

| Command | Purpose |
| --- | --- |
| `care catalog` | List installed AgentSkills, MCP servers, tools, capability cards. |
| `care validate <chain.json>` | Parse + preflight a CARL chain. |
| `care import <pattern>...` | Batch-validate (dry-run) or import chain JSON files. |
| `care export <output> <chain_id>...` | Bundle chains (+skills) to a tarball; `import` is the inverse. |

## Generate / run / replay

| Command | Purpose |
| --- | --- |
| `care generate "<task>"` | One-shot MAGE generation. |
| `care run <chain_id>` | Fetch a saved chain, preflight, and optionally execute via CARL. |
| `care revise <chain_id> "<edit>"` | AI-edit a saved chain into a new version (`/revise` twin). |
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

## Versions & long-term memory

| Command | Purpose |
| --- | --- |
| `care versions <chain_id>` | List versions & channels for an entity. |
| `care rollback <chain_id>` | Restore an earlier version onto a channel. |
| `care promote <chain_id>` | Promote a version to a stable channel. |
| `care forget <id>` | Soft-delete (tombstone) an entity. |
| `care remember "<text>"` | Write a long-term memory note. |
| `care notes` | Print the long-term memory digest. |

## Marketplace & evolution

| Command | Purpose |
| --- | --- |
| `care marketplace "<query>"` | Search shared `agent_skill` listings. |
| `care evolve <chain_id>` | Submit + watch + accept an evolution run. |

## Deploy & datasets

| Command | Purpose |
| --- | --- |
| `care deploy <chain_id>` | Deploy a chain to the agent-hub over HTTP. |
| `care deployments` | List active agent-hub deployments. |
| `care metrics <deployment>` | Usage metrics for a deployment. |
| `care dataset <chain_id> ...` | Manage & run a chain's eval dataset (list/add/run/export). |

## UX

| Command | Purpose |
| --- | --- |
| `care help [--markdown] [--commands]` | Render the tutorial + cheat-sheet, or the CLI ↔ TUI parity table. |

:::tip
Detailed pages (in the sidebar): [Generate, Run & Replay](/care/cli/generate-run/) ·
[Setup](/care/cli/setup/) · [Discovery & Validation](/care/cli/discovery/) ·
[Revise](/care/cli/revise/) · [Export & Import](/care/cli/export/) ·
[Memory & Library](/care/cli/memory/) · [Datasets](/care/cli/dataset/) ·
[Deploy & Metrics](/care/cli/deploy/) · [Capabilities & Evolution](/care/cli/capabilities/).
:::

:::note[Driving `care` from an agent?]
Install the [care-cli Agent Skill](/care/skill/overview/) — it teaches Claude Code or
hermes to run every command above, with portable auto-detection of `care`.
:::
