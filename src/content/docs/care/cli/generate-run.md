---
title: Generate, Run & Replay
description: Generate a chain from a task, run a saved chain, export it, and replay results.
sidebar:
  order: 2
---

The core generate → run loop, plus exporting chains to disk and replaying past runs.

## `care generate "<task>"`

Generate a CARL chain from a free-form task via MAGE.

```bash
care generate "weather report for SF" --save weather --output weather.json
```

| Flag | Purpose |
| --- | --- |
| `--mode fast\|deep` | MAGE generation mode (defaults to MAGE's own default). |
| `--save NAME` | Save the generated chain to Memory under `NAME` (new entity). |
| `--output PATH` | Write the chain to a file (format inferred from `.json` / `.py`). |
| `--output-format json\|python` | Override the export format. |
| `--json` | Emit the chain as JSON instead of a summary line. |

If a `generate` call fails because of authentication or an expired token, the CLI
now prints a single friendly hint pointing you at `care init` (to re-seed your
credentials) and `care doctor` (to diagnose the endpoint) — instead of a raw
traceback.

:::note[Looking for `care export`?]
For a one-off file, export the generated chain inline with `generate --output PATH`
or a *saved* chain with `run --export PATH` (below) — both write `.json` or `.py`
(a runnable Python module) based on the extension. To ship several chains (plus
their AgentSkills) as one portable tarball, use the dedicated
[`care export`](/care/cli/export/) command.
:::

## `care run <chain_id>`

Fetch a saved chain from Memory, preflight it, and optionally execute it.

```bash
care run my-chain --execute --input city=Paris --save-result paris-run
care run my-chain --export chain.py            # export, don't run
```

| Flag | Purpose |
| --- | --- |
| `--channel NAME` | Version channel to read (default `latest`). |
| `--execute` | Execute via CARL after preflight (needs `mmar_carl` + an LLM key). |
| `--task TEXT` | Override `outer_context` for the run. |
| `--input KEY=VALUE` | Add a pair to `context.memory['input']` (repeatable). |
| `--save-result NAME` | Persist a run digest as a `memory_card` (requires `--execute`). |
| `--export PATH` | Also write the fetched chain to a file (`.json` / `.py`). |
| `--export-format json\|python` | Override the export format. |
| `--json` | Emit the preflight result as JSON. |
| `--log PATH` / `--log-level debug\|info` | Write a structured debug log of the run. |

## `care replay <source>`

Step through a saved `ReasoningResult` / `RunRecord` JSON from a previous run. Use
`-` to read from stdin.

```bash
care replay run.json            # whole session, one block per step
care replay run.json --step 2   # just step 2 (0-indexed)
cat run.json | care replay -
```

| Flag | Purpose |
| --- | --- |
| `--step N` | Render only step N (0-indexed); default renders the whole session. |
| `--json` | Structured payload (chain metadata + every step) instead of the walkthrough. |

Run `care <command> --help` for the authoritative, up-to-date flag set.
