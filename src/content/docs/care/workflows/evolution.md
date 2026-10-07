---
title: Evolution
description: Evolving a chain from the Maestro app — what you need, the plan and its token estimate, starting, watching and cancelling a run, IdeaL ideas, and taking the result.
sidebar:
  order: 4
---

Evolution improves a chain automatically. The evolution platform (GigaEvo
Platform) mutates the chain, scores each candidate on a dataset and keeps the
best. In the desktop app you start and watch it from chat.

## What you need

- **Platform base URL** (and key, if your platform needs one) on the
  [MAESTRO settings page](/care/app/settings/), plus the mutation and
  validation models the platform should use. The platform calls these models
  itself; they are not the chat model.
- A **seed chain**: a saved chain or one from this session.
- A **dataset** with at least two rows of input and expected answer. The usual
  source is the [evolution data generator](/care/workflows/data-generation/).
  You can also give real examples in chat; the agent stages them as a dataset.
  The agent asks for real examples rather than inventing labels.

## Start

Ask in chat, for example:

```text
Evolve the receipt chain on the latest dataset, budget 1,000,000 tokens.
```

or press **Evolve** (*Эволюционировать*) on a chain card in the Library and
send the drafted request.

The agent then:

1. finds the chain and suitable datasets by name and asks you if several fit;
2. prepares both as exact artifacts (pinned by digest);
3. makes an **evolution plan**: the seed chain, the evaluator, promotion
   thresholds and a **token estimate**;
4. starts the evolution, normally as a background job. This is paid work and
   asks for one confirmation.

A total budget you name ("1,000,000 tokens") becomes the plan's total token
limit. It is checked **before** the start against the plan's estimate. During
the run the platform enforces per-call token caps, not a campaign-wide cutoff,
so treat the total as a planning limit. If the plan warns that the mutation cap
is too low for a reasoning model, the agent tells you before starting.

Dataset admission limits: 2–1000 rows, 2–64 scalar columns, non-empty input
and target in each row, cells up to 8,192 characters, at most 1 MiB as CSV.

## Watch

- The **progress dock** and the evolution card show the generation, the best
  score and the baseline; they refresh every 5 seconds.
- [Activity](/care/app/activity/) lists the run with the same progress.
- With IdeaL on, the **radar** shows which ideas the run uses and how they
  work. See [Ideas and the IdeaL radar](/care/app/ideas/).

`status: prepared` means the experiment exists but the platform has not yet
confirmed it as queued or running. Read its status before treating it as
started.

## Steer with ideas

With IdeaL as chain memory, each mutation gets a slate of ideas from your
namespace, and IdeaL records whether they helped. While a run is going you can
push a specific idea into its next mutations from the radar. Add ideas first
in **Library → Ideas** if your namespace is empty.

## Cancel

Ask the agent to stop the evolution, or kill its background job. Cancelling is
free. A modern evolution run can be **cancelled but not paused**.

## Take the result

When the run finishes, ask for the result. The best chain is **staged in the
session** as an artifact. It is not written to memory automatically. Run it on
your input to check it, then ask the agent to save it; it becomes a new
version in the Library.

## Limits

- No pause or resume for evolution runs.
- `population_size` is not accepted by the modern platform runner, and a
  free-form rubric is stored as a description, not used as a judge. The plan
  blocks a rubric evaluator when the platform cannot apply it.
- Datasets of *tasks with tools* cannot be used yet.
- No automatic comparison on the holdout part and no automatic promotion of
  the winner into memory.
- If the answer to a start request is lost, the outcome is uncertain. Within
  the same app process a repeated start with the same key returns the first
  outcome; after a restart, check the existing run before starting again.

## From the TUI and CLI

The TUI has an evolution dashboard and a launch picker; the CLI has
`maestro evolve <chain_id> [--wait] [--accept]`. See
[Production mode](/care/workflows/production/) and the
[CLI reference](/care/cli/capabilities/).
