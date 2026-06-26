---
title: Memory & Library
description: Browse, search, compare, and curate saved entities.
sidebar:
  order: 5
---

These read and curate the GigaEvo Memory store — the terminal twins of the
Library screen. The browsing verbs accept `--json` and most accept `--channel`
(default `latest`); the version, channel, and long-term-memory verbs below are
documented with their own flags.

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
| `--namespace NS` | — | Restrict to one MAESTRO namespace. |
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

---

## Versions & channels

Every saved entity keeps a full **version** history. **Channels** are named
pointers into that history: `latest` always tracks the newest write, while
`stable` is the curated pointer you advance deliberately. The verbs below let
you inspect versions and move channels around without ever destroying data.

### `care versions <entity_id>`

List an entity's version history, annotated with which channels point at each
version (the terminal twin of the TUI `/versions`).

```bash
care versions my-chain
care versions my-agent --entity-type agent --limit 50 --json
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--entity-type chain\|agent\|agent_skill\|memory_card\|step` | `chain` | Entity type. |
| `--limit N` | `20` | Max versions to list. |
| `--json` | off | Emit the version list as JSON. |

### `care rollback <entity_id> --to <version-id>`

Repoint a channel at a specific version. This is a **non-destructive pin**, not
a revert: it moves a channel pointer without deleting any history. The TUI twin
is `/rollback`.

```bash
care rollback my-chain --to 7f3a9c1b2d4e            # pin stable
care rollback my-chain --to 7f3a9c1b2d4e --channel latest
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--to <version-id>` | — (**required**) | Version to pin the channel to (see `care versions`). |
| `--channel C` | `stable` | Channel to repoint. |
| `--entity-type …` | `chain` | Entity type. |

:::note[No `--json`]
`rollback`, `promote`, and `forget` are mutating commands and print a plain
status line — they do not support `--json`.
:::

### `care promote <entity_id>`

Copy one channel pointer to another — by default `latest → stable`. This is the
direct channel move. The TUI `/promote` layers an interactive baseline/eval gate
on top (run the candidate against a baseline before advancing `stable`); the CLI
move is headless and ungated, so promote deliberately.

```bash
care promote my-chain                          # latest -> stable
care promote my-chain --from latest --to canary
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--from C` | `latest` | Source channel. |
| `--to C` | `stable` | Target channel. |
| `--entity-type …` | `chain` | Entity type. |

### `care forget <entity_id>`

Soft-delete a saved entity. The deletion is **recoverable via Memory trash**.
Without `--force` the command only previews what would be deleted; pass `--force`
to actually delete. The TUI twin is `/forget`.

```bash
care forget my-chain               # preview only — nothing is deleted
care forget my-chain --force       # soft-delete (recoverable)
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--entity-type …` | `chain` | Entity type. |
| `--force` | off | Actually delete (omit to preview). |

---

## Long-term memory

Long-term memory (LTM) is a per-session notes store that persists facts and
preferences across runs, separate from the entity library above.

### `care remember <note>`

Save an explicit note to long-term memory. The note is stored **verbatim** — the
TUI's LLM-merge deduplication is TUI-only. The TUI twin is `/remember`.

```bash
care remember "prefer hybrid search for finance chains"
```

LTM must be enabled, or the command exits `2`:

```bash
export CARE_CONTEXT__LTM_ENABLED=true   # and install the `carl` extra
```

:::note[Requires the `carl` extra]
`remember` needs `CARE_CONTEXT__LTM_ENABLED=true` **and** the `carl` extra
installed. With LTM disabled it exits `2` and tells you how to turn it on.
:::

### `care notes`

Show the stored long-term-memory notes digest (the terminal twin of the TUI's
`/memory` verb). When LTM is disabled it prints a hint instead of failing.

```bash
care notes
care notes --max-chars 500
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--max-chars N` | `2000` | Cap the digest size. |

## See also

- [`care evolve`](/care/cli/capabilities/) — produce new versions to promote.
- [`care run`](/care/cli/generate-run/) — record runs that populate `memory history`.
- [The MAESTRO CARE TUI](/care/tui/overview/) — the `/versions`, `/rollback`, `/promote`, `/forget`, `/remember`, and `/memory` twins.
