---
title: Production Mode
description: The TUI Production mode — generate, save, baseline, dataset, evolution and release of a durable chain.
sidebar:
  order: 2
---

Production is the TUI mode for chains you want to keep, measure and improve.
It needs Memory. In the desktop app the same steps are separate requests to
the agent; see [Scenarios](/care/workflows/scenarios/).

## What a Production prompt does

1. **Generate** a reproducible chain (no agent loop: it must run the same way
   every time).
2. **Ask once** before running it (stage `run` is `ask` by default).
3. **Save** it to Memory under a stable `chain_id`. If the same task was
   already saved, the TUI shows the existing chain instead of saving a
   duplicate; prefix the task with `[FORCE]` to save anyway.
4. **Baseline**: run it once and record the run as the first dataset entry.
5. **Evolve**: if a platform is configured and the baseline succeeded, start
   an evolution run.

Your next plain prompt **revises** the saved chain into a new version. Run
`/new` to start a new chain.

## Requirements

- Memory: `CARE_MEMORY__BASE_URL` (and `CARE_MEMORY__API_KEY` if the server
  needs one). Without it the TUI falls back to Interactive with a warning.
- Platform (optional): `CARE_PLATFORM__BASE_URL`. Without it, save and
  baseline happen and evolution is skipped.

## Versions and channels

Saved chains are versioned. Revisions create new versions; the `latest`
channel points at the newest. `stable` is the released one. The CLI reads
`latest` by default; pass `--channel stable` to `maestro run`.

```text
/revise <id> <change>        # natural-language edit → new version
/promote <id|name> [--force] # gated release latest → stable
/rollback <id|name> [--to <vid>]
```

## Datasets

```text
/dataset list <chain_id>
/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]
/dataset run <chain_id>              # replay every entry and score it
/dataset export <chain_id> <path>    # write entries as JSONL
```

The baseline seeds the first entry. These TUI datasets are stored as memory
cards; they are separate from the [evolution data](/care/workflows/data-generation/)
that the desktop app generates.

## Evolution

```text
/evolution                       # dashboard of active and recent runs
/evolution setup [<chain_id>]    # launch picker with a budget preview
/evolution list
/evolution <run_id>              # state of one run
/evolution watch <run_id>        # stream events
/evolution accept <run_id> <individual_id>
```

The [Evolution dashboard](/care/tui/evolution/) shows the fitness chart, the
Pareto front, programs and versions. Accepting a winner promotes it into the
`stable` channel. Headless:

```bash
maestro evolve <chain_id> --iterations 8 --wait --accept
```

## Release and shipping

```text
/deploy <id|name> [--channel stable]   # serve as an HTTP agent on the hub
/upload <chain_id>                     # POST the chain JSON to CARE_UPLOAD__URL
/forget <chain_id> [--force]           # soft delete (recoverable in Memory)
```

See [Deploying agents](/care/workflows/deploy/).

## See also

- [Interactive and Production modes](/care/workflows/modes/)
- [Slash commands → production](/care/slash-commands/production/)
- [Scenarios](/care/workflows/scenarios/)
