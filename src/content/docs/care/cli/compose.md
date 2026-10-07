---
title: Compose chains
description: Glue two or more saved chains into one new chain, sequentially or in parallel with an aggregator step.
sidebar:
  order: 2.7
---

`maestro compose` builds one new chain out of two or more saved chains. It fetches
each chain from Memory and flattens them into a single graph:

- **`sequential`** (default) — the chains run one after another, in the order you
  list them: every first step of a chain depends on all final steps of the previous
  one.
- **`parallel`** — the chains run independently, and a final LLM aggregator step
  combines their outputs.

Like [`revise`](/care/cli/revise/), it only **previews** by default. Pass `--yes` to
save the result to the library as a new chain.

```bash
maestro compose fetch-news summarise-news                     # preview
maestro compose fetch-news summarise-news --name news-digest --yes
maestro compose weather-sf weather-nyc --mode parallel \
  --aggregator-aim "Compare the two forecasts in one table" --yes
maestro compose a b c --json | jq '.steps | length'
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `CHAIN_ID ...` | — | Two or more chain `entity_id`s, in order. Duplicates are dropped. |
| `--mode sequential\|parallel` | `sequential` | How the chains are joined. |
| `--name NAME` | generated | Name of the composed chain. |
| `--aggregator-aim TEXT` | — | Custom aim of the aggregator step (parallel mode). |
| `--channel NAME` | `latest` | Memory channel to read the chains from. |
| `--yes` | off | Save the composed chain (default: preview only). |
| `--json` | off | Print the composed chain as JSON. Human notices then go to stderr, so stdout stays valid JSON. |

The preview lists every step of the result with its type and dependencies:

```text
Composed (sequential) 2 chains -> 'news-digest': 5 steps
  1. [tool] Fetch headlines  deps=[]
  ...

Preview only — re-run with --yes to save this to the library.
```

A saved composed chain is tagged `composed` and `compose:<mode>`, and its change
summary names the source chains, so it is easy to find with
`maestro memory ls --tag composed`.

Exit code `2` when fewer than two distinct ids are given, a chain cannot be fetched
or has no steps, or the save fails. Composition itself is local and calls no model; the parallel aggregator is an LLM
step that runs when you execute the chain.

## See also

- [Revise a chain](/care/cli/revise/) — edit one chain in plain language.
- [Memory & Library](/care/cli/memory/) — find chain ids and inspect the result.
