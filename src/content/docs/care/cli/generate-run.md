---
title: Generate, Run & Replay
description: Generate a chain from a task, run a saved chain with inputs and files, export it, and replay results.
sidebar:
  order: 2
---

The core generate → run loop, plus exporting chains to disk and replaying past runs.
Generation and execution call a model, so they take from a few seconds to several
minutes and cost money on a paid endpoint.

## `maestro generate "<task>"`

Generate a chain from a free-form task description.

```bash
maestro generate "weather report for SF" --save weather --output /abs/weather.json
maestro generate "summarise a PDF report" --mode deep --json
```

| Flag | Purpose |
| --- | --- |
| `--mode fast\|deep` | Generation mode. Without it the generator's own default applies. |
| `--save NAME` | Save the chain to Memory under `NAME` (a new entity). Without it nothing is saved. |
| `--output PATH` | Write the chain to a file; format from the extension (`.json` / `.py`). |
| `--output-format json\|python` | Override the export format. |
| `--json` | Print the chain as JSON instead of a summary line. |

If generation fails on authentication or an expired token, the CLI prints one hint
pointing at `maestro init` (re-seed credentials) and `maestro doctor` (check the
endpoint) instead of a traceback.

:::note[One file or a bundle?]
For one file, use `generate --output PATH` or, for a saved chain, `run --export PATH`.
Both write `.json` or a runnable `.py`. To ship several chains with their
AgentSkills as one tarball, use [`maestro export`](/care/cli/export/).
:::

## `maestro run <chain_id>`

Fetch a saved chain from Memory and preflight it. Preflight reports the tools, MCP
servers and skills the chain needs and which are missing; it calls no model. Add
`--execute` to run the chain.

```bash
maestro run weather                                   # preflight only
maestro run weather --execute --input city=Paris --save-result paris-run
maestro run report-digest --execute --file /abs/report.pdf
maestro run weather --export /abs/chain.py            # export, don't run
```

| Flag | Purpose |
| --- | --- |
| `--channel NAME` | Version channel to read (default `latest`). |
| `--execute` | Execute the chain after preflight. Needs the `carl` extra and a model key. |
| `--task TEXT` | Override `outer_context`. Without it the stored task description is used. |
| `--input KEY=VALUE` | Add a pair to `context.memory['input']` (repeatable). |
| `--file PATH` | Attach a file's contents under its basename (repeatable). |
| `--classify-files heuristic\|model` | How to decide which skill steps read an input file: `heuristic` (keyword match, default, deterministic) or `model` (asks the model, needs a key). |
| `--save-result NAME` | Save a run digest as a `memory_card` tagged `run-record` and `chain:<id>`. Requires `--execute`. |
| `--export PATH` | Also write the fetched chain to a file (`.json` / `.py`). |
| `--export-format json\|python` | Override the export format. |
| `--json` | Print the preflight result as JSON. |
| `--log PATH` | Append a structured debug log of the run (invocation, fetch, preflight, export, execution, persistence). |
| `--log-level debug\|info` | `info` (default) logs milestones; `debug` adds tracebacks and the fetched chain. |

:::note[Where inputs land]
`--input` and `--file` values go to `context.memory['input']`; a tool or MCP step
reads one with the reference `$memory.input.<key>` in its `input_mapping` /
`argument_mapping`. LLM steps see the same values as a JSON block appended to the task
text, marked as untrusted data. A reference such as `$outer_context.<field>` does
**not** find them: with inputs present the outer context is that task text, not a
JSON object.
:::

## `maestro replay <source>`

Step through a saved `ReasoningResult` / `RunRecord` JSON from an earlier run. Use `-`
to read from stdin.

```bash
maestro replay /abs/run.json            # whole session, one block per step
maestro replay /abs/run.json --step 2   # only step 2 (0-indexed)
cat run.json | maestro replay -
```

| Flag | Purpose |
| --- | --- |
| `--step N` | Render only step N (0-indexed). |
| `--json` | Structured payload (chain metadata + every step) instead of the walkthrough. |

## Solver tools in generated chains

When STARM solver servers are configured, the generator can plan `solve_sudoku`,
`solve_maze` and the other solver tools into a chain, and `run --execute` calls them.
On the CLI a solver failure comes back as text for the next step, and an answer that
fails the local check is marked `REJECTED by a local check`. See
[STARM solvers](/care/solvers/starm/).

Run `maestro <command> --help` for the authoritative flag set.
