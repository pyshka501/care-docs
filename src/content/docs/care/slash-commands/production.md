---
title: Production Commands
description: Dataset, evolution, release and lifecycle slash commands for chains saved in Production mode.
sidebar:
  order: 2
---

In **Production** mode every request produces a chain saved to Memory under a stable
`chain_id`, with a baseline run as its first dataset entry. The commands below work
on such chains. They are registered in both modes; `/help` lists them when you are in
Production. See [Modes](/care/workflows/modes/).

:::note
Production needs `CARE_MEMORY__BASE_URL` (and `CARE_MEMORY__API_KEY` when the server
requires auth). Without Memory, switching to Production falls back to Interactive
with a warning, and commands that need Memory say it is not configured.
:::

## Datasets

| Command | What it does |
| --- | --- |
| `/dataset list <chain_id>` | Show the chain's dataset entries. |
| `/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]` | Add a case. `--rubric` is used by the TUI run as an LLM-judge prompt. |
| `/dataset run <chain_id>` | Replay every entry through the chain and score it. |
| `/dataset export <chain_id> <path>` | Write the entries as JSONL. |

The CLI twin is [`maestro dataset`](/care/cli/dataset/); it ignores `--rubric` and
scores by substring.

## Evolution

| Command | What it does |
| --- | --- |
| `/evolution` | Evolution primer, then the runs dashboard. |
| `/evolution setup [<chain_id>]` | Open the launch modal, optionally bound to a chain. |
| `/evolution list` | Open the runs dashboard. |
| `/evolution <run_id>` | Print a run's state inline. |
| `/evolution watch <run_id>` | Stream the run's events into chat until it closes or you press Esc. |
| `/evolution accept <run_id> <individual_id>` | Promote that individual into the `stable` channel. |

See [The Evolution screen](/care/tui/evolution/).

## Release

| Command | What it does |
| --- | --- |
| `/versions <id\|name> [diff <vA> <vB>]` | Version history; `diff` shows the JSON patch. |
| `/promote <id\|name> [--from latest] [--to stable] [--force]` | Gated release of a channel. |
| `/rollback <id\|name> [--channel stable] [--to <version-id>]` | Repoint a channel one version back or to a given version. |
| `/deploy <id\|name> [--channel stable] [--name x]` | Deploy to the [agent hub](/care/workflows/deploy/). |

`/promote` runs a gate before it moves the channel: it checks that the candidate
loads within the template tool set, makes a mandatory baseline run, compares eval
scores with the baseline when scores exist, and only then promotes. `--force` skips
the gate. The CLI [`maestro promote`](/care/cli/memory/) has no gate and moves the
channel directly.

## Lifecycle

| Command | What it does |
| --- | --- |
| `/upload <chain_id>` | POST the chain's JSON to the URL in `[upload]` / `CARE_UPLOAD__URL`. |
| `/forget <chain_id>` | Preview what would be deleted. |
| `/forget <chain_id> --force` | Soft-delete the chain **and** every dataset card tagged `dataset-entry:<chain_id>`. Recoverable from Memory's trash. |
