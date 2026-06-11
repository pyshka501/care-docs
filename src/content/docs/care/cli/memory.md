---
title: Memory & Library
description: Browse, search, compare, and curate saved entities.
sidebar:
  order: 5
---

These read the GigaEvo Memory store — the terminal twins of the Library screen.
All accept `--json`; most accept `--channel` (default `latest`).

## `care memory ls`

List saved entities.

```bash
care memory ls --entity-type chain --tag finance --q weather --favourites-only
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--entity-type chain\|agent\|agent_skill\|memory_card` | `chain` | Entity type to list. |
| `--limit N` | `20` | Max rows. |
| `--channel NAME` | `latest` | Version channel. |
| `--namespace NS` | — | Restrict to one MAESTRO CARE namespace. |
| `--tag T` | — | Filter by tag (repeatable, AND). |
| `--q TEXT` | — | Case-insensitive substring on name/description. |
| `--favourites-only` | off | Only favourited entities. |

## `care memory show <entity_id>`

Print one entity's metadata + content.

| Flag | Default | Purpose |
| --- | --- | --- |
| `--entity-type … (+ step)` | `chain` | Entity type. |
| `--channel NAME` | `latest` | Version channel. |
| `--content-only` | off | Print only the `content` body. |

## `care memory history <chain_id>`

List recorded runs for a chain (`--limit`, `--channel`, `--namespace`).

## `care search "<query>"`

BM25 / vector / hybrid search across saved entities.

```bash
care search "quarterly risk" --search-type hybrid --top-k 5
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--entity-type …` | `chain` | What to search. |
| `--search-type bm25\|vector\|hybrid` | `bm25` | Search backend. |
| `--top-k N` | `10` | Max hits. |

## `care diff <left> <right>`

Compare two saved chains side-by-side.

| Flag | Purpose |
| --- | --- |
| `--channel NAME` | Channel to read both from (default `latest`). |
| `--left-label` / `--right-label` | Display labels (default: entity_id). |

## `care lineage <chain_id>`

Walk a chain's ancestry DAG.

| Flag | Default | Purpose |
| --- | --- | --- |
| `--channel NAME` | `latest` | Start from this channel's head. |
| `--version-id ID` | — | Walk from a specific historical version. |
| `--max-depth N` | `10` | BFS-depth cap (1–100). |

## `care favourite <entity_id>`

Star / unstar a library entity.

```bash
care favourite my-chain          # star
care favourite my-chain --off    # unstar
```

| Flag | Purpose |
| --- | --- |
| `--entity-type …` | Entity type (default `chain`). |
| `--off` | Unstar instead of starring. |
