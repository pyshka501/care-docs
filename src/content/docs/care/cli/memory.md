---
title: Memory & Library
description: Browse, search, compare, and curate saved entities.
sidebar:
  order: 5
---

These commands read the GigaEvo Memory store — the library of saved chains,
agents, skills, and run records. They have terminal twins of the TUI's Library
screen.

## `care memory ...`

```bash
care memory ls --entity-type chain --tag finance --q "weather"
care memory show <entity_id> --content-only
care memory history <chain_id>
```

| Subcommand | Purpose |
| --- | --- |
| `memory ls` | List saved entities (`--entity-type`, `--tag`, `--q` filters). |
| `memory show <id>` | Drill down on one entity (`--content-only`). |
| `memory history <chain_id>` | List recorded runs for a chain. |

## `care search "<query>"`

BM25 / vector / hybrid search across saved entities.

```bash
care search "quarterly risk" --search-type hybrid
```

| Flag | Purpose |
| --- | --- |
| `--search-type bm25\|vector\|hybrid` | Search backend. |

## Compare & curate

```bash
care diff <left_id> <right_id>     # side-by-side chain compare
care lineage <chain_id>            # walk the ancestry DAG
care favourite <entity_id>         # star a library entity (--off to unstar)
```

Run `care <command> --help` for the full flag set.
