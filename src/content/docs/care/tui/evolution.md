---
title: Evolution dashboard
description: Watch, compare, and accept genetic-algorithm runs from inside MAESTRO CARE.
sidebar:
  order: 4
---

`/evolution` opens MAESTRO CARE's **evolution dashboard** — an inbox of every
genetic-algorithm run your account can see on the Platform. From a row you open a
**run screen** that streams the search live: fitness curves, the Pareto front,
program-validity trends, and the per-generation fitness ladder. When a run lands a
winner you accept it straight back into the **stable** channel.

This is the visual twin of [`care evolve`](/care/cli/overview/). The dashboard
watches and compares runs; the CLI launches them headless. For the algorithm
itself — mutation, scoring, generations — see the concept page
[Evolution overview](/carl/evolution/overview/).

---

## The dashboard

The dashboard is a single sortable table, newest run first. Two tabs at the top
split it into **Active** (the default — live and recent runs) and **Archived**
(runs you've hidden but not deleted).

| Column | What it shows |
| --- | --- |
| **Status** | A coloured `●` dot + the run's status — green = running, yellow = queued/paused, blue = finished, grey = stopped, red = failed. |
| **Run** | The Platform run id. |
| **Base chain** | The seed chain the run evolves from. |
| **Gen** | Current generation. |
| **Best** | Best fitness seen across all generations. |
| **Current** | Best fitness in the live generation. |
| **Valid** / **Invalid** | Valid vs. invalid program counts. |
| **Started** | Local clock time the run began. |
| **Elapsed** | Wall-clock since start; the clock stops when the run finishes. |

Unknown cells render as `—` so a partial Platform payload never blanks a whole
row. The table auto-refreshes every 5 seconds, so a long watch stays current.

### Keys

| Key | Action |
| --- | --- |
| `Enter` | Open the highlighted run (see [The run screen](#the-run-screen)). |
| `s` | Stop the highlighted running evolution. |
| `Space` | Mark the row for compare (max 2). |
| `c` | Compare the two marked runs. |
| `a` | Archive / un-archive the highlighted run. |
| `r` | Refresh now. |
| `b` · `Esc` | Back to chat. |

The same actions are available as buttons along the bottom for anyone who hasn't
memorised the bindings yet.

:::note[Stop is best-effort]
`s` asks the Platform to cancel the run. If the configured SDK doesn't expose a
cancel method, the dashboard says so with a toast instead of failing silently.
:::

### The "▶ N evolving" counter

While the chat surface is open, the footer carries a live **`▶ N evolving`**
segment counting your in-flight runs. It polls the Platform off-thread and hides
itself when nothing is running — a quiet at-a-glance signal that work is still
churning in the background.

### Compare two runs

Mark two rows with `Space`, then press `c` to open the **Evolution Compare**
modal. The first row you marked is the left side, the second is the right, and the
modal plots both fitness curves next to each other so you can see which run climbed
faster or plateaued sooner.

### Archive

Cancelled and failed runs pile up. Press `a` to move a row out of the **Active**
tab into **Archived** — it stays on the Platform, and the archive list persists in
`~/.config/care/evolution_archive.json` across restarts. Switch to the
**Archived** tab and press `a` again on a row to bring it back.

---

## The run screen

`Enter` on a dashboard row — or **Library → `v`/`E`**, the
[Evolution Launch](/care/tui/screens/) picker — opens the run screen. Opened from
the dashboard it watches an existing run (it resumes the live stream, never
re-submits); launched from the picker it starts a fresh run and follows it.

A **Status** pane and an **Events** log ride along the top; the rest is a tabbed
deck that mirrors the gigaevo-platform web UI so you see the same information
whichever surface you're on.

| Tab | What it shows |
| --- | --- |
| **Fitness** | A high-resolution two-axis line chart — **best fitness** and the **current-generation mean** vs. generation — repainted incrementally as points arrive, so you can watch progress and spot plateaus. |
| **Statistics** | Summary cards plus the **"what is being optimised"** card (see below). |
| **Pareto front** | A table of non-dominated individuals; the highlighted row expands to a per-row detail card showing its full summary and every objective. Runs with ≥ 2 objectives also get a **2D scatter** beneath the table. |
| **Programs** | The valid-vs-invalid program trend across generations. |
| **Versions** | The fitness-growth ladder — every generation where best fitness strictly improved, as `Gen | Fitness | Δ` rows. Pick one to preview its chain or diff it against the parent. |

### What is being optimised

The **Statistics** tab answers "what is this run actually measuring?" with a
metadata card built from:

- **Optimising for** — the validation rubric (from the launch config, or recovered
  from the run's description when you're watching someone else's run);
- **Mode** — `full_chain` (the whole DAG is fair game) or `per_step` (one step
  perturbed at a time);
- **Runner** — the Platform runner that executed the run;
- **Platform** — the Platform version, fetched once on mount.

### Cost & token meter

The screen folds token and USD spend out of the live stream as it runs — from
dedicated `cost_tick` events, or from token/usage fields riding on per-individual
events when the Platform doesn't emit dedicated ticks. The running prompt +
completion token total and cumulative USD cost surface in the status area so you
can see what the search is spending in real time.

### Live updates, with a poll fallback

The run screen subscribes to the Platform's SSE event stream and renders each
`generation_started`, `individual_evaluated`, and `best_updated` event as it
arrives. When the stream is unavailable it falls back to polling the run's
`/results` metrics on a ~2-second tick (and, for a local stack whose `/results`
is empty, a direct Redis probe for the curve) — so the view keeps moving even
without a live SSE connection.

### Launch budget preview

The [Evolution Launch](/care/tui/screens/) picker shows a live **budget preview**
before you submit. It recomputes as you edit the fields:

```text
evaluations = iterations × population
```

plus a rough **token estimate** for that many evaluations. Sizing a run is then a
glance — bump iterations or population and watch the cost projection move before
you commit.

### Accept winner & export

| Key | Action |
| --- | --- |
| `a` | **Accept winner** — promote the selected individual (or the best one) into the **stable** channel, after a confirmation showing the chain id and the version transition. |
| `x` | Export the highlighted Pareto-front individual's chain to disk (JSON / Python switch). |
| `c` | Export the fitness curve to `evolution-<id>-curve.csv` + `.json` in the cwd. |
| `D` | Diff the selected version against its parent. |
| `z` | **Stop + Archive** — halt the run server-side and archive it. |
| `Esc` | Cancel. |

Accept is the one irreversible step — it flips the `latest` pointer — so it always
routes through a confirmation modal first. Pick a non-best Pareto row and accept
promotes *that* individual's chain, not the overall best.

---

## See also

- [Chain DAG](/care/tui/dag/) — inspect the graph behind an answer.
- [Evolution overview](/carl/evolution/overview/) — how the genetic search works.
