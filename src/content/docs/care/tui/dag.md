---
title: The chain DAG
description: Read a chain as a coloured box-and-arrow graph — open the full-DAG modal, inspect steps, and watch a run light up.
sidebar:
  order: 3
---

Every chain in MAESTRO CARE is a small **DAG** — boxes for steps, arrows for
the data flow between them. The TUI draws that graph everywhere a chain
appears: inline under a fresh generation, in the inspect pane, live during a
run, and full-screen in the **chain DAG modal** (the *View chain* button under
a fresh generation). This page is a tour of what the picture shows you and the
keys that drive it.

## Colour by step type

Each box is tinted by what the step *is*, so you can read a chain's shape at a
glance without opening a single step:

| Colour | Step type |
| --- | --- |
| Cyan | AI / LLM step |
| Magenta | Tool call |
| Blue | MCP tool |
| Green | Code / Python step |

A numbered **legend** rides under the graph — one `N — description` row per
step, with its leading number tinted the same colour as its box. Where a box
can't show every dependency as a drawn arrow (a "skip" edge across layers), the
legend carries it along as a `◀ N` annotation, so no dependency is ever hidden.

## The full-DAG modal

After a successful generation the chat surface mounts a **View chain** button
next to the `✓ Chain generated` line. Press it to open the chain DAG modal,
which puts three views side by side:

- the **box-and-arrow graph** of the whole chain at the top,
- a **clickable step list** on the left — one button per node, and
- a **CARL detail pane** on the right that prints the selected step exactly as
  it rides inside the serialised CARL chain (indented, syntax-coloured).

Click a step in the list — or click its box directly in the graph — and both
the detail pane and the highlight update together. The picture and the list are
two ways to drive the same selection.

### Lineage dim

The moment you pick a step, everything *outside* that step's data-flow lineage
fades to a muted grey, so the path that feeds and follows your selection reads
as the foreground. Pick a different step and the dim follows it.

### Footer actions

| Button | What it does |
| --- | --- |
| **Save to library** | Write the chain to Memory (locks once saved). |
| **Evolve this chain** | Save if needed, then hand off to the Platform for evolution. |
| **Edit step** | Send the selected step to `/revise` for a targeted revision (see below). |
| **Close** | Dismiss the modal (`Escape` does the same). |

## Render modes

The graph is read-only, but you can reshape how it's drawn — live, in place,
preserving your current selection.

### Layout toggle — `l`

Flip the graph between **top-down** (`tb`) and **left-to-right** (`lr`). Wide,
shallow chains read better left-to-right; tall, linear ones top-down. The
default orientation is set by config (see below).

### ASCII glyph mode

Boxes are drawn with Unicode box-drawing characters by default. ASCII mode
swaps every glyph for a plain equivalent (`+ - | v <`), width-for-width, for
terminals without good Unicode support or for clean copy-paste. It's a config
knob that applies to *every* DAG surface — the inline trail, the inspect pane,
the run overlay, and this modal.

### Bus-lane skip-edge routing

A dependency that jumps more than one layer ("skip" edge) clutters a top-down
graph with long crossing arrows. **Bus lanes** route those skip edges down a
tidy left-margin gutter instead, keeping the spine of the graph clean. It's a
config knob and applies to the top-down layout.

### Two-line label wrapping

The modal has room a one-line trail doesn't, so its boxes wrap full step labels
across **two lines** rather than truncating them — you read the whole label
without opening the step.

### Config knobs

These defaults set the initial state; the `l` key still flips the layout live.

| Env var | Values | Effect |
| --- | --- | --- |
| `CARE_DEFAULTS__DAG_LAYOUT` | `tb` · `lr` | Initial orientation of the modal's graph (default `tb`). |
| `CARE_DEFAULTS__DAG_ASCII` | `true` · `false` | Draw every DAG with plain ASCII glyphs (default `false`). |
| `CARE_DEFAULTS__DAG_BUS_LANES` | `true` · `false` | Route multi-layer skip edges down a margin lane (default `false`). |

```bash
export CARE_DEFAULTS__DAG_LAYOUT=lr
export CARE_DEFAULTS__DAG_ASCII=true
export CARE_DEFAULTS__DAG_BUS_LANES=true
```

:::note[Set them once in your environment]
These are `CARE_DEFAULTS__*` knobs — export them before launching the TUI (or
set them in your shell profile) and every DAG surface picks them up.
:::

## Overlays — when the graph carries run data

The same renderer re-tints the boxes when there's run information to show. The
overlay takes precedence over the plain step-type colours.

### Live run-status overlay

During execution each box is tinted by how far the chain has progressed, so the
graph doubles as a live progress view:

| Colour | Status |
| --- | --- |
| Grey | Pending / skipped |
| Bold yellow | Running |
| Green | Done |
| Bold red | Failed |

### Latency heat-map — `m`

On the execution screen, press `m` to flip the live graph between the run-status
tint and a **latency heat-map**: each box is shaded by its wall-clock time on a
low→high scale — **green → yellow → bold red** — so the slowest steps jump out.
A step with no recorded metric stays muted. The toggle is a no-op until the run
finishes and timings are available.

### Version-diff DAG under `/revise`

When you revise a chain, the new version is drawn against the old one as a diff
graph: **added** steps in green, **changed** in yellow, **removed** in red, and
**unchanged** muted — so you see exactly what the revision touched. Renumbering
a revise does isn't mistaken for churn.

## Mermaid export — `y`

Press `y` to copy the chain to your clipboard as Mermaid `flowchart` source,
ready to paste into Markdown, a PR, or these docs. The direction follows your
current layout toggle: top-down exports as `flowchart TD`, left-to-right as
`flowchart LR`.

## Keyboard topology navigation

You can walk the graph by its *topology*, not just its line order. The
selection moves and keyboard focus follows it onto the matching step button:

| Key | Moves to |
| --- | --- |
| `k` | A dependency of the current step (up the graph) |
| `j` | A dependent of the current step (down the graph) |
| `p` | Previous step by position |
| `n` | Next step by position |
| `l` | Toggle layout (top-down ↕ / left-to-right ↔) |
| `y` | Copy the chain as Mermaid |
| `Escape` | Close the modal |

## Edit a step → `/revise`

Select a step, then press **Edit step**. The modal closes and seeds a targeted
`/revise` in the chat for *that* step's number — so you can describe the change
in plain language and regenerate just the part you want, instead of redoing the
whole chain.

## See also

- [Screens reference](/care/tui/screens/) — every MAESTRO CARE screen and modal.
- [The Evolution screen](/care/tui/evolution/) — watch a GA improve a chain.
- [CARL trace visualization](/carl/tracing/visualization/) — the trace-side graph.
