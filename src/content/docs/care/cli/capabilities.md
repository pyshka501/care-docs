---
title: Capabilities & Evolution
description: Search the marketplace, evolve chains, and render help.
sidebar:
  order: 6
---

## `care marketplace "<query>"`

Search shared `agent_skill` listings on Memory.

```bash
care marketplace "pdf extraction" --top-k 5 --deep
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--top-k N` | `10` | Max listings. |
| `--min-score F` | `0.0` | Drop listings below this relevance score. |
| `--tag T` | — | Require tag (repeatable, AND). |
| `--namespace NS` | — | Scope the search to a namespace. |
| `--deep` | off | Also match `skill_instructions` (slower, more recall). |

## `care evolve <chain_id>`

Submit an evolution run for a saved chain, optionally watch it, and accept the
winner — the terminal twin of the Evolution screen.

```bash
care evolve my-chain --iterations 8 --population 12 --wait --accept
care evolve my-chain --objective accuracy --objective brevity \
  --validation-criteria "Reward concise, correct answers" --wait
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--mode full_chain\|per_step` | `full_chain` | Evolution mode. |
| `--iterations N` | `5` | Max generations. |
| `--population N` | `8` | Population per generation. |
| `--validation-criteria TEXT` | `""` | Prompt for the validation judge. |
| `--objective NAME` | — | Multi-objective fitness term (repeatable). |
| `--test-data-path PATH` | — | Evaluation test data. |
| `--threshold F` | — | Fitness threshold for early stop. |
| `--wait` | off | Block on the SSE stream, printing per-generation progress. |
| `--accept` | off | After `--wait`, promote the best individual (requires `--wait`). |

## `care help`

Render the tutorial walkthrough + key cheat-sheet.

```bash
care help --markdown
care help --category library
care help --screen LibraryScreen
care help --commands
```

| Flag | Purpose |
| --- | --- |
| `--markdown` | Emit Markdown (README quick-reference) instead of styled text. |
| `--category global\|library\|generation\|execution\|evolution` | Restrict the bindings listing to one category. |
| `--screen NAME` | Restrict bindings to one screen (e.g. `LibraryScreen`). |
| `--commands` | Print the CLI ↔ TUI parity table instead of the tutorial (see below). |

### `--commands` — the CLI ↔ TUI parity table

`care help --commands` prints the subcommand-to-screen-verb parity table: every
headless subcommand paired with its TUI twin (`care run ↔ /run`,
`care evolve ↔ /evolve`, and so on). The subcommand list is read live from the
argparse parser, so it can never drift from the actual CLI. After the twins, it
lists the TUI-only verbs that have no headless equivalent yet — `/upload`,
`/tour`, `/settings`, and `/theme`. Use it to confirm whether a screen action you
rely on can be scripted headlessly.

:::tip
Almost every command also accepts `--json` for scripting, and Memory-reading
commands accept `--channel` (default `latest`).
:::
