---
title: CLI
description: The mage command — generate, edit, validate, evolve and version — with its options and what each command does not do.
sidebar:
  order: 2
---

The package installs a `mage` command (**released**; same commands on the
development line). In Maestro you normally use `maestro generate` instead,
which calls MAGE with Maestro's settings: see
[Generate, run and replay](/care/cli/generate-run/).

## `mage generate "<task>"`

```bash
mage generate "Analyze a financial report" --mode fast -o chain.json --no-memory
```

| Option | Default | Notes |
| --- | --- | --- |
| `--mode`, `-m` | `deep` | `fast` or `deep`. |
| `--model` | `gpt-4o` | |
| `--api-key` | env `MAGE_API_KEY` | |
| `--base-url` | unset | Any OpenAI-compatible endpoint. |
| `--temperature`, `-t` | `0.2` | |
| `--output`, `-o` | unset | Write the chain JSON here; otherwise it is printed. |
| `--no-memory` | off | Without it, MAGE tries to save the chain to GigaEvo Memory. |
| `--skills` | off | Skill discovery from the built-in skill registry. |
| `--skills-web` | off | Let skill discovery fall back to web search. |
| `--benchmark-profile` | unset | Authoring preset: `bfcl`, `seal_tools`, `rotbench`, `toolalpaca`, `custom`. |

The CLI builds `MAGEConfig` from these options only. It does not read
`MAGEConfig.from_env()`, so it always uses the `legacy` strategy and the
default stage switches, and it takes a plain string task (no typed request).

## `mage edit "<instruction>"`

```bash
mage edit "rename to 'Invoice QA'" --chain chain.json -o edited.json     # local file, no Memory
mage edit "add a validation step" --id chain-abc123 --save               # saved chain, new version
mage edit "also extract tables from the PDF summariser"                  # find the chain in Memory
```

Options: `--id`, `--chain`, `--channel` (`latest`), `--save`, `--output`,
`--model`, `--api-key`, `--base-url`, `--temperature`. A failed edit leaves
the original unchanged.

## `mage validate <chain.json>`

```bash
mage validate chain.json
```

Three layers: `validate_carl_json` (always), strict CARL types (`--strict`,
on), `ReasoningChain.from_json` (`--check-carl`, on). `--check-capabilities`
also looks up every `agent_skill` URI in Memory and warns on misses. Exit
code 0 on success, 1 on failure.

:::caution[Not full admission]
`mage validate` does not run `lint_chain` or `validate_runtime_chain`. A chain
it accepts can still fail generation-time admission (wrong bindings, a terminal
step that does not match the output contract).
:::

## `mage evolve "<task>"`

Synthesizes a small benchmark for the task, generates a population of chains
and mutates them for a few generations. Options include `--population` (5),
`--generations` (4), `--benchmark-tasks` (8), `--threshold` (0.95),
`--plateau` (2), `--seed`, `--model`, `--execution-model`, `--memory/--no-memory`,
`--web`, `--output`, `--benchmark-output`.

This is MAGE's own, older evolution loop. Maestro evolves chains on the
GigaEvo evolution platform instead: see
[Evolution](/care/workflows/evolution/).

## `mage version`

Prints the installed version: `mmar-mage 0.1.3` for the release,
`mmar-mage 0.2.0` on the development line.

`mage version`, `mage validate` and `mage --help` were run on
`feat/v3-ideal-loop` (acf7091). `generate`, `edit` and `evolve` make paid
model calls and were not run for this page.
