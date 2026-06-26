---
title: Export & import bundles
description: Pack saved chains and skills into a portable tarball, then import them on another machine.
sidebar:
  order: 4.5
---

`care export` writes saved chains — and, optionally, the AgentSkills they depend
on — into a single portable tarball you can copy to another machine. `care
import` is its inverse: it reads chain JSON back and (with `--apply`) saves it
into the local Memory. Both default to the `latest` channel. This pair is the
terminal twin of the Library's **export bundle** action.

## `care export <output> <entity_id>...`

Bundle one or more chains into a tarball (e.g. `bundle.tar.gz`).

```bash
care export bundle.tar.gz weather-report risk-digest \
  --skill web-search --channel latest
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `<output>` | — | Output tarball path (e.g. `bundle.tar.gz`). |
| `<entity_id>...` | — | One or more chain `entity_id`s to export. |
| `--skill SKILL_ID` | — | AgentSkill `entity_id` to bundle in (repeatable). |
| `--channel NAME` | `latest` | Memory channel to read from. |

On success it prints the chain count, skill count, output path, and byte size:

```text
exported 2 chain(s) + 1 skill(s) → bundle.tar.gz (40817 bytes)
```

If an `entity_id` can't be fetched it is skipped and listed (the rest still
bundle):

```text
skipped (fetch failed): typo-chain-id
```

:::note[No `--json`]
`care export` writes a human-readable summary only — there is no `--json`
output. It exits `1` on a bundling error.
:::

## `care import <PATTERN>...`

`care import` is the inverse of `care export`: it validates chain JSON files
(glob patterns are accepted) and, with `--apply`, saves them to Memory. **It
runs as a dry-run preview by default** — nothing is written until you pass
`--apply`. See [Discovery & validation](/care/cli/discovery/) for the full flag
reference.

| Flag | Default | Purpose |
| --- | --- | --- |
| `<PATTERN>...` | — | File paths or globs (e.g. `**/*.json`). |
| `--apply` | off | Actually save to Memory (otherwise dry-run). |
| `--channel NAME` | `latest` | Default channel for entries that omit one. |

It exits `0` when every chain validates, `1` otherwise.

---

## Round-trip: move a library between machines

Export two chains plus the skill they share on the source machine:

```bash
care export bundle.tar.gz weather-report risk-digest --skill web-search
# exported 2 chain(s) + 1 skill(s) → bundle.tar.gz (40817 bytes)
```

Copy `bundle.tar.gz` to the target machine, unpack it, and preview before
committing — the dry-run shows exactly what would be saved:

```bash
tar xzf bundle.tar.gz
care import "*.json"            # dry-run preview, writes nothing
care import "*.json" --apply    # commit the chains to local Memory
```

## See also

- [Discovery & validation](/care/cli/discovery/) — `care import` flags and chain validation.
- [Memory & Library](/care/cli/memory/) — browse and curate what you imported.
