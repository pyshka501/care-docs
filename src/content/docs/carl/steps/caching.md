---
title: Caching
description: Memoize a step's result within a chain run to skip repeated work.
sidebar:
  order: 9
---

Attach a `StepCache` to any step's `cache` field to memoize its result. Before
running the step, the DAG executor checks an in-memory cache; on a hit the stored
result is returned with **no LLM or tool call**.

The cache lives on the `DAGExecutor` instance, so it is shared across all batches
within a single `chain.execute()` (useful for [loops](/carl/steps/loops/) that
revisit the same inputs) and reset on each new run.

## StepCache

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `ttl` | `int \| None` | `None` | Time-to-live in seconds. `None` = never expires within the run. |
| `key_fn` | `Callable[[ReasoningContext], str] \| None` | `None` | Custom cache-key function. Default key = step number + first 256 chars of `outer_context`. |

## Example

```python
from mmar_carl import LLMStepDescription, StepCache

LLMStepDescription(
    number=2,
    title="Classify intent",
    aim="Classify the user intent.",
    cache=StepCache(
        ttl=300,
        key_fn=lambda ctx: ctx.outer_context[:512],
    ),
)
```

A step is a cache hit when an entry exists for the computed key **and** it hasn't
expired.
