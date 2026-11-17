---
title: Evolution and the lake
description: How a Maestro evolution run receives IdeaL ideas for mutations and reports outcomes back. What Maestro sends, how the task key is built, and the limits.
sidebar:
  order: 4
---

When the chain memory is IdeaL, every evolution that Maestro starts is wired
to the lake. Maestro itself does not pick ideas or report scores: the
evolution service does that, through the public IdeaL API.

## What Maestro sends

When it creates the evolution experiment, Maestro adds:

| Field | Value |
| --- | --- |
| `enable_memory` | `true` |
| `memory_backend` | `ideal` |
| `memory_namespace` | The configured IdeaL namespace. |
| `memory_task_key` | A stable key for the task (below). |

These fields are set last, so nothing else in the request can redirect the
namespace. With **Read only** on, or with the `Library search` backend, none of
them is sent and evolution runs without memory.

## The task key

IdeaL rates ideas per task. Maestro derives the key from the chain:

- `task:<16 hex>`: SHA-256 of the chain's task description (whitespace
  collapsed, case-folded). Evolved winners keep the description, so their
  next runs land on the same key.
- `chain:<16 hex>`: when the chain has no task description, a hash of the seed
  chain's id.

The same task therefore collects experience across runs. The Library uses
the same key to list "evolutions of this chain".

**Limit.** The key hashes the exact wording. A reworded task description is
a new task: it starts without local experience and only borrows from other
tasks and from global evidence. Runs started before the stable key existed
are not linked to their chain ("прогоны были до того, как задача получила
постоянный ключ").

## What the evolution service does

1. **Before each mutation**: `POST /v1/retrieve` with `mode=evolution`, the
   run id, a fresh candidate id per mutation decision, and a short task
   statement. The slate's ideas are rendered into the mutation prompt. About
   30% of slates are empty on purpose (control).
2. **If retrieval fails**: the mutation proceeds without ideas, and no
   outcome is reported for it. The run is never blocked by the lake.
3. **After the child is evaluated**: `POST /v1/outcome` with `kind=mutation`,
   the score `delta` (`null` for an invalid child) and the ideas the child
   actually used. Censored attempts and attempts that never produced a child
   are not reported: they say nothing about the ideas.
4. **Delivery**: outcomes go to a durable local outbox first and are sent
   asynchronously. Network failures, cancellation and resume do not lose or
   double-count them; the API is idempotent on exact repeats.
5. **At the end of a naturally finished run**: `POST /v1/outcome` with
   `kind=run`, the best archived chain under a readable name, its fitness and
   the ideas on its lineage. Cancelled or unfinished runs send no run outcome.

The best chain becomes a task chain in the namespace. Next time generation
works on the same task, the catalog can offer it as a starting point.

## Watching a run

- The evolution card in chat has **Радар идей** (see [Radar](/ideal/maestro/radar/)).
- The signed run page (`run_url`) is the server's own live view.
- The Library graph shows the run with its delivered and cited ideas once the
  first slate is recorded.

## Limits

- The evolution side is a separate service. What it reports (task key on
  every retrieve, `parent_score`, `metric`, `change`) depends on its version.
  Without `parent_score` and bounds, strength ranks raw deltas instead of the
  fraction of the remaining range. Without `change`, server-side extraction
  has nothing to learn from.
- Idea text reaches the mutation as written. Lake content is a suggestion,
  not an instruction; anyone who can write the namespace can influence
  mutations. Keep namespaces to people you trust.
- Path attribution is naive: every idea on the best chain's lineage gets a
  path win.
