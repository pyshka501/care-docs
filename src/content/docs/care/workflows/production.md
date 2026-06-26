---
title: Production Mode
description: The full Production lifecycle — generate, save, baseline, dataset, evolution, promote.
sidebar:
  order: 2
---

Production mode turns a one-off generation into a **durable, measurable, improvable
agent**. It's the path you use when you want to keep a chain, test it, evolve it,
and ship the best version.

## What happens on a Production prompt

When you type a task in Production mode, MAESTRO runs this sequence automatically:

1. **Generate** — MAGE produces a **reproducible** chain (no ReAct loop, no
   answer-synthesis — Production chains must run the same way every time).
2. **Stash** — the chain lands in the session artifact store (the header pill and
   [`/artifacts`](/care/slash-commands/overview/) see it).
3. **Save** — the chain is saved to Memory under a stable **`chain_id`** with a
   display name. (Duplicate of an existing chain → no re-save.)
4. **Baseline** — MAESTRO runs **one baseline execution** and persists it as the
   **first dataset entry** for that chain.
5. **Evolve** — if a [Platform](/care/concepts/architecture/) is wired and the
   baseline succeeded, MAESTRO **kicks off an evolution run** against the baseline.

After this, the chain lives in your [Library](/care/tui/screens/) under its
`chain_id`.

:::tip[Iterating vs starting over]
Your **next plain prompt** in Production doesn't generate a brand-new chain — it
**revises the chain you just saved** (via [`/revise`](/care/slash-commands/overview/)),
producing a **new version**. To start a genuinely new chain, run `/new` first.
:::

## Requirements & fallback

- **Memory is required**: `CARE_MEMORY__BASE_URL` (+ `CARE_MEMORY__API_KEY` if auth
  is enforced). Without it, selecting Production **auto-falls back to Ad-Hoc** with
  a warning.
- **Platform is optional**: evolution only runs when `CARE_PLATFORM__BASE_URL` is
  set; otherwise the save + baseline still happen, evolution is skipped.

## Channels & versions

Saved chains are **versioned**. Edits (via `/revise`) create new versions; the
`latest` channel always points at the newest. Promote a chosen version (or an
evolution winner) into the **stable** channel with [`/promote`](/care/slash-commands/overview/).
CLI reads honour `--channel` (default `latest`) — e.g. [`care run <id> --channel stable`](/care/cli/generate-run/).

## Production commands

These appear in Production mode (see the full list under
[slash commands → production](/care/slash-commands/production/)):

### Datasets — measure quality

```text
/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]
/dataset list <chain_id>
/dataset run <chain_id>          # replay every entry + score it
/dataset export <chain_id> <path>   # write entries as JSONL
```

The baseline run seeds entry #1; add more cases, then `/dataset run` to score the
chain against them. The CLI twin builds + scores datasets headlessly.

### Evolution — improve automatically

You can launch an evolution run three ways:

1. **Automatically** — in Production, a successful baseline kicks one off (step 5 above).
2. **From the TUI** — open a saved chain in the [Library](/care/tui/screens/) and press
   `v` / `E` to open the **Evolution Launch picker**. It shows a **budget preview**
   before you commit — the iteration count, rubric, and objectives, with the estimated
   token/USD cost for the run — so you can size a run before spending on it.
3. **Headless** — [`care evolve <chain_id> --iterations 8 --wait --accept`](/care/cli/capabilities/).

Once a run is live, follow it on the [Evolution dashboard](/care/tui/evolution/) — the
list of active and recent runs (`Enter` opens one, `c` compares two). Each run view
streams the **Fitness** chart, the **Pareto front**, **Programs**, and **Versions**, with
a running **cost meter** in the header so you always see token/USD spend against the
budget you set at launch.

Watch and steer a run from chat:

```text
/evolution <run_id>              # render the run's state inline
/evolution watch <run_id>        # stream events live
/evolution accept <run_id> <individual_id>   # promote the winner
```

The GA optimises against the chain's **dataset** (the fitness signal), so seed a few
[dataset entries](#datasets--measure-quality) first. Accepting a winner — via
`/evolution accept`, the [Evolution dashboard](/care/tui/evolution/)'s **Accept winner**
button, or `care evolve --accept` — promotes the best individual into the **stable** channel.

### Deploy — serve as an HTTP agent

Ship a saved chain to the [agent hub](/care/workflows/deploy/) so it runs as an HTTP
agent with its own Swagger UI:

```text
/deploy <ref> [--channel <ch>] [--name <agent>]   # default channel: stable
```

Needs the `deploy` extra (`pip install "maestro-care[deploy]"`). Full guide:
[Deploying agents](/care/workflows/deploy/).

### Lifecycle

```text
/revise [<id>] <change>          # edit the chain in natural language → new version
/promote <id> <version>          # promote a version / winner to the stable channel
/upload <chain_id>               # POST the chain to CARE_UPLOAD__URL
/forget <chain_id> [--force]     # soft-delete the chain + its dataset
```

## See also

- [Scenarios](/care/workflows/scenarios/) — end-to-end worked examples.
- [Ad-Hoc vs Production](/care/workflows/modes/) · [Architecture](/care/concepts/architecture/)
