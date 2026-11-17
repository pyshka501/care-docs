---
title: Rating and outcomes
description: How IdeaL turns mutation outcomes into a rating. Slates and control, outcome classes, gain rate, strength, task keys and transfer, run outcomes and path wins.
sidebar:
  order: 3
---

IdeaL rates an idea only by what happened when evolution applied it. Nobody
rates ideas by hand. This page explains the inputs and the two numbers you
see everywhere: **gain rate** and **strength**.

## Slates and the control arm

Before each mutation, evolution calls `POST /v1/retrieve` with
`mode=evolution`, a `run_id` and a `candidate_id`. IdeaL returns a **slate**:

- up to `k` ideas (default 3) and at most one relevant tool;
- picked by Thompson sampling over each idea's rating, weighted by how close
  the idea is to the query (`RETRIEVE_RELEVANCE_WEIGHT`, default 0.7);
- or, with probability `IDEA_CONTROL_PROBABILITY` (default 0.3), an **empty
  control slate**.

Every slate is recorded, empty ones included. Calling again with the same
`run_id` and `candidate_id` returns the recorded slate. The control arm is
what lets IdeaL say "mutations with ideas improved X% of the time, mutations
without ideas Y%".

The query is `context.focus` (what to improve; up to four weak spots as a
list) or, without a focus, `context.task_description`. Keep
`task_description` to one or two sentences. Passing a whole evolution prompt
breaks retrieval.

## Mutation outcomes

After the child chain is evaluated, evolution reports one outcome:

```json
{"kind": "mutation", "run_id": "...", "candidate_id": "...",
 "delta": 0.04, "parent_score": 0.61,
 "cited_idea_ids": ["<ideas from this slate that were really applied>"],
 "metric": {"name": "accuracy", "higher_is_better": true,
            "lower_bound": 0, "upper_bound": 1, "min_delta": 0.01}}
```

- `delta` is child score minus parent score, or `null` for an invalid child.
- `cited_idea_ids` must list only ideas that the mutation actually used.
  Ideas delivered but not cited get no credit and no blame.
- `metric` is optional. It sets the direction (`higher_is_better`), the noise
  level (`min_delta`) and the known range. IdeaL keeps the latest description
  per namespace and task.
- Repeating the same outcome returns 200 instead of 201 and counts once.

Each cited outcome falls into one class, after orienting `delta` so that
positive always means better:

| Class | Condition |
| --- | --- |
| `gain` | `delta > min_delta` |
| `regression` | `delta < -min_delta` |
| `no_gain` | `abs(delta) ≤ min_delta` |
| `invalid` | `delta = null` |

## Gain rate

**Gain rate** is a posterior probability that applying the idea gives a
`gain`. It comes from a Beta distribution, so a fresh idea starts near the
middle and moves with evidence. One gain out of one application gives about
67%, not 100%.

## Strength

**Strength** says how large the effect is, compared with other changes in the
same task. Each valid outcome gets a signed percentile in `[-1, 1]`: +0.8 means
"better than 80% of changes in this task".

- When every valid outcome of the task has `parent_score` and a known bound,
  the percentile ranks the fraction of the remaining range that was gained.
  Otherwise it ranks the raw oriented `delta`.
- With fewer than 20 valid outcomes in the task, percentiles are shrunk toward
  zero by `n / 20`.
- An idea's mean strength is shrunk again by its own evidence count:
  `n / (n + IDEA_STRENGTH_PRIOR_COUNT)` (default 5).
- `no_gain` counts as zero; `invalid` has no strength.

Small numbers are not trustworthy. The `efficacy` summary
("introduced in 4 children; gain rate 67%; mean strength +0.18; …
(confident)") appears only after `IDEA_MIN_EVENTS` (default 3) citations.

## Task keys and transfer

Experience is combined in three levels:

1. the same namespace and the same `task_key`;
2. the same `task_key` in other namespaces;
3. global evidence for the same idea across everything.

The same idea in different namespaces is linked by `content_hash` of its
normalised description. Tools are linked by `tool_key`. Upper levels act as a
capped prior; local evidence takes over as it grows. When tasks disagree about
an idea, global evidence is weakened.

Without a `task_key` in the retrieve call, the levels are namespace, then
global. One `run_id` cannot switch task keys mid-run (422).

**Limit.** The task key is only as stable as the caller makes it. Maestro
derives it from a hash of the chain's task description (see
[Evolution](/ideal/maestro/evolution/)). A reworded task gets a new key and
starts without local experience; only levels 2 and 3 carry over.

## Run outcomes

At the end of a run, evolution reports the best chain once:

```json
{"kind": "run", "namespace": "...", "task_key": "...", "run_id": "...",
 "best_chain": {...}, "best_fitness": 0.65,
 "path_idea_ids": ["<ideas applied along the best chain's lineage>"]}
```

IdeaL stores `best_chain` as a `chain` tagged `task:<task_key>` with its
fitness, so catalog retrieval can offer it on the same task. Each idea in
`path_idea_ids` gets a **path win** and a `derived_from` relation to the
chain. Path attribution is naive: every idea on the lineage counts.

## Forced ideas

On a live run, a person can force an idea into every next slate until a
mutation cites it (arm `forced`, never control). Forced mutations are shown
in the run feed but excluded from idea ratings and from the ideas-vs-control
comparison.

## Extracted ideas

With `IDEAL_EXTRACTION_ENABLED=true` and a configured lake LLM, outcomes that
carry `change: {diff, rationale}` are turned into new active ideas during and
after the run. Their `source_evidence` points to real outcome records and
counts in the same gain rate and strength. Parameter-only changes and changes
that implement an existing lake idea are skipped. Extraction is off by
default.

## Where you see the numbers

| Place | Shows |
| --- | --- |
| Maestro, Library → Ideas | Rating (gain rate), strength, delivered, cited, successes, path wins per idea. |
| Maestro, run radar | Per-run effect of each delivered idea, ideas vs control. |
| IdeaL web UI, IdeaL tab | Overview, tasks, ideas table with `efficacy`, runs. |
| Run page (`run_url`) | Radar, best score curve, arms, mutation feed. |
