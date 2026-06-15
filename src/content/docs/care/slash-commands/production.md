---
title: Production Commands
description: Dataset, evolution, and publish commands available in Production mode.
sidebar:
  order: 2
---

These commands appear once you're in **Production** mode (where chains are saved to
Memory under a stable `chain_id`). They drive the dataset → evolution → publish
flow. See [chat modes](/care/getting-started/overview/) for the mode difference.

## Datasets

| Command | What it does |
| --- | --- |
| `/dataset list <chain_id>` | Show dataset entries for a chain. |
| `/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]` | Add a dataset case. |
| `/dataset run <chain_id>` | Replay + score the dataset entries. |
| `/dataset export <chain_id> <path>` | Write entries as JSONL. |

## Evolution

| Command | What it does |
| --- | --- |
| `/evolution <run_id>` | Render the evolution state inline. |
| `/evolution watch <run_id>` | Stream evolution events live. |
| `/evolution accept <run_id> <individual_id>` | Promote the winning individual into the stable channel. |

## Publish & lifecycle

| Command | What it does |
| --- | --- |
| `/deploy <ref> [--channel X] [--name Y]` | Deploy a saved chain to the [agent hub](/care/workflows/deploy/) as an HTTP agent (default channel: `stable`). |
| `/promote <chain_id> <version>` | Promote a version (or accepted evolution winner) into the **stable** channel. |
| `/upload <chain_id>` | POST the chain to `CARE_UPLOAD__URL`. |
| `/forget <chain_id> [--force]` | Soft-delete a chain + its dataset. |

:::note
Production requires `CARE_MEMORY__BASE_URL`. Without Memory configured, selecting
Production auto-falls back to Ad-Hoc — so these commands won't apply.
:::
