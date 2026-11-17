---
title: Marketplace, Evolution & Help
description: Search the skill marketplace, evolve a saved chain, and render help or the CLI ↔ TUI table.
sidebar:
  order: 6
---

## `maestro marketplace "<query>"`

Search shared `agent_skill` listings in Memory.

```bash
maestro marketplace "pdf extraction" --top-k 5 --deep
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--top-k N` | `10` | Maximum listings. |
| `--min-score F` | — | Drop listings below this relevance score. |
| `--tag T` | — | Require a tag (repeatable, AND). |
| `--namespace NS` | — | Scope the search to a Memory namespace. |
| `--deep` | off | Also match `skill_instructions` (slower, more recall). |
| `--json` | off | JSON instead of the text listing. |

## `maestro evolve <chain_id>`

Submit an evolution run for a saved chain (the seed) to the Platform, optionally
watch it, and accept the winner. Evolution makes many model calls; a run with the
defaults below already spends real tokens.

```bash
maestro evolve weather --iterations 8 --population 12 --wait --accept
maestro evolve weather --test-data-path /abs/eval.jsonl \
  --validation-type "Binary (0/1)" --binary-method substring --wait
maestro evolve weather --objective accuracy --objective brevity \
  --validation-criteria "Reward concise, correct answers" --wait --json
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--mode full_chain\|per_step` | `full_chain` | Evolution mode. |
| `--iterations N` | `5` | Maximum generations. |
| `--population N` | `8` | Population per generation. |
| `--validation-criteria TEXT` | — | Free-form prompt for the validation judge. |
| `--validation-type` | `Continuous (0..1)` | `Continuous (0..1)` or `Binary (0/1)` (quote the value). |
| `--metric` | `ROUGE-L` | Continuous metric: `ROUGE-1`, `ROUGE-2`, `ROUGE-L`, `BERTScore`, `BLEU`. |
| `--binary-method` | — | With `Binary (0/1)`: `equality`, `substring` or `regexp`. |
| `--target-column NAME` | `expected` | Dataset column to score against. |
| `--objective NAME` | — | Multi-objective fitness term (repeatable). |
| `--test-data-path PATH` | — | Evaluation test data. |
| `--threshold F` | — | Fitness threshold for early stop. |
| `--wait` | off | Follow the event stream and print per-generation progress until the run ends. |
| `--accept` | off | After `--wait`, promote the best individual. Without `--wait` it exits `2`. |
| `--json` | off | JSON summary instead of text lines. |

Without `--wait` the command submits the run and returns its id. The desktop app
covers more of the evolution workflow than this command: finding the chain and
dataset by name, the IdeaL run radar and forcing an idea into a running evolution.

## `maestro help`

Render the tutorial walkthrough and the key cheat sheet.

```bash
maestro help --markdown
maestro help --category library
maestro help --screen LibraryScreen
maestro help --commands
```

| Flag | Purpose |
| --- | --- |
| `--markdown` | Emit Markdown instead of plain text. |
| `--category global\|library\|generation\|execution\|evolution` | Restrict the bindings list to one category. |
| `--screen NAME` | Restrict the bindings to one TUI screen (e.g. `LibraryScreen`). |
| `--commands` | Print the CLI ↔ interactive surface table instead of the tutorial. |

### `--commands`: what each subcommand maps to

`maestro help --commands` reads the subcommand list from the live parser and prints,
for each one, the closest interactive surface: a slash command, a TUI screen or modal,
or "no direct interactive surface". It also says where a same-named slash command
behaves differently, for example:

- `/promote` adds a release gate; `maestro promote` moves the channel directly.
- `/remember` merges the note with a model; `maestro remember` stores it as written.
- `/rollback` can step one version back; `maestro rollback` needs `--to`.
- `/export` saves the chat transcript; `maestro export` bundles library chains.

It ends with the slash commands that have no same-name CLI command, such as
`/artifacts`, `/library`, `/mode`, `/upload`, `/evolution` and `/theme`.

:::tip
Most read commands accept `--json` for scripting, and Memory-reading commands accept
`--channel` (default `latest`). `doctor`, `init`, `migrate-secrets`, `help`,
`export`, `deploy`, `rollback`, `promote` and `forget` have no `--json`.
:::
