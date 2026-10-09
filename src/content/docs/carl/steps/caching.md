---
title: Caching
description: Memoize a step's result within a chain run to skip repeated work.
sidebar:
  order: 9
---

Attach a `StepCache` to a step's `cache` field to memoize its result. Before
running the step, the DAG executor looks up an in-memory cache. On a hit it
returns the stored result with **no LLM or tool call**.

The cache lives on the `DAGExecutor` and is cleared at the start of every
`chain.execute()`. Within one run it is shared by all batches, which helps
[loops](/carl/steps/loops/) that revisit the same inputs. Nothing persists
between runs.

## StepCache

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `ttl` | `int \| None` | `None` | Time-to-live in seconds (≥ 1). `None` = never expires within the run. |
| `key_fn` | `Callable[[ReasoningContext], str] \| None` | `None` | Custom cache-key function. |

**Default key:** `f"{step.number}:{context.outer_context[:256]}"`, the step
number plus the first 256 characters of `outer_context`. It does not look at
history, memory, or the step's inputs. Within one run `outer_context` usually
doesn't change, so a step with the default key is a hit from its second
execution on, even if what it reads has changed. Use `key_fn` when the result
depends on anything else.

If `key_fn` raises, the default key is used.

## Example

```python
from mmar_carl import LLMStepDescription, StepCache

LLMStepDescription(
    number=2,
    title="Classify intent",
    aim="Classify the user intent.",
    cache=StepCache(
        ttl=300,
        key_fn=lambda ctx: "2:" + ctx.outer_context[:512],
    ),
)
```

## Rules

- A hit needs an entry for the computed key that hasn't expired.
- Only successful results are stored.
- A hit replays the stored `result`, `result_data`, `token_usage`, and history
  entry, and sets `profiling["cache_hit"] = True`. Side effects of the original
  run, such as memory writes, are **not** replayed.
- `cache` is excluded from serialization (`to_dict` / `to_json`), and so is
  `key_fn`. Re-attach caching after loading a chain from JSON.

:::caution
A custom key is used as is; it is not prefixed with the step number. Two steps
whose `key_fn` returns the same string share one entry, and the second step gets
the first step's result. Include the step number in custom keys, as in the
example above.
:::

## Steps that reject `cache`

These step types raise a validation error when `cache` is set, because their
execution has side effects or depends on runtime-only state:

| Step | Reason |
| --- | --- |
| `command` | Command execution may have side effects. |
| `shell_session` | Shell execution may have side effects. |
| `command_plan` | Its host capability registry is runtime-only. |
| `claude_code` | The agent may read or modify the workspace. |
| `codex` | A Codex turn may read or modify the workspace. |

All other step types accept `cache`. That includes steps that can have side
effects, such as `tool`, `mcp`, `agent`, `code`, `map`, and `human_input`; only
cache them when replaying the earlier result is really what you want.
