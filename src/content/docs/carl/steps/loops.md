---
title: Loops
description: Re-run a range of steps until a condition holds, with an iteration budget.
sidebar:
  order: 8
---

Any step can loop back to an earlier step, forming a loop body. Set
`loop_back_to` and `loop_config` on the **tail** step of the loop.

After the tail step completes successfully, the executor resolves
`loop_config.condition_key`. While it resolves truthy and the iteration budget
isn't exhausted, the loop body (every step numbered from `loop_back_to` to the
tail, inclusive) is reset and runs again. A failed tail step does not loop.

## LoopConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `condition_key` | `str` | `""` | A [context reference](/carl/chains/dynamic-references/) (`$metadata.step_N`, `$memory.ns.key`, `$history[-1]`, `$outer_context`, …) whose resolved value is cast to `bool`. Empty = always loop, up to `max_iterations`. |
| `max_iterations` | `int` | `10` | Budget guard: max re-executions of the loop body (≥ 1). |
| `negate_condition` | `bool` | `False` | `False` = while-loop (continue while truthy). `True` = until-loop (continue while falsy). |

:::caution
`condition_key` is a **reference**, not an expression. Its resolved value is cast
to a boolean, and a reference that fails to resolve counts as false. Have a step
produce a flag (a tool returning `True`/`False`, read with `$metadata.step_N`, or
a value written to `$memory.loop.needs_retry`) rather than putting logic in the
condition string. Note that `$history[-1]` is a non-empty string, so it is always
truthy.
:::

When the budget is exhausted, the chain simply continues past the tail step;
reaching `max_iterations` is not an error.

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, LoopConfig

# Steps 1–2 form the loop body; step 2 drives iteration.
ToolStepDescription(
    number=2,
    title="Refine answer",
    dependencies=[1],
    config=ToolStepConfig(tool_name="refiner", input_mapping={}),
    loop_back_to=1,
    loop_config=LoopConfig(
        condition_key="$memory.loop.needs_retry",  # truthy → loop again
        max_iterations=5,
    ),
)
```

For an until-loop (run until the flag becomes truthy), set `negate_condition=True`.

## ChainBuilder loop helpers

`ChainBuilder.add_while_loop(body_steps, condition_key, max_iterations=10, start_number=None)`
and `add_until_loop(...)` wrap the manual API. They renumber the body steps from
`start_number` (default: the next free number), set `loop_back_to` on the last
step, and attach a `LoopConfig`. `add_while_loop` continues while the value is
truthy; `add_until_loop` sets `negate_condition=True` and continues until it is
truthy.

:::note
The helpers do not add `dependencies` between body steps. Body steps without
dependencies run in parallel within one batch. If order matters inside the body,
set the dependencies yourself using the numbers the helper will assign.
:::

The repo's [loop example](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/loop_until_example.py)
(no API key) shows a research loop that keeps searching until enough facts are
gathered:

```python
body = [
    ToolStepDescription(number=0, title="Search Facts",
                        config=ToolStepConfig(tool_name="search_facts", input_mapping={})),
    ToolStepDescription(number=0, title="Evaluate Research",
                        config=ToolStepConfig(tool_name="evaluate_research", input_mapping={})),
    ToolStepDescription(number=0, title="Check Done",
                        config=ToolStepConfig(tool_name="check_done", input_mapping={})),
]

chain = (
    ChainBuilder()
    .add_until_loop(body_steps=body, condition_key="$metadata.step_3", max_iterations=10)
    .build()
)
```

The example also covers a retry-until-success loop, the manual `loop_back_to` /
`loop_config` API, and an `add_while_loop` queue drainer.

## Loop history

Each restart records the previous pass in
`context.metadata["loop_iteration_history"]`, keyed by `"<loop_back_to>-<tail>"`
(e.g. `"1-3"`). Every entry is `{"iteration": n, "results": [...]}` with the
dumped step results of that pass. Only the latest pass's results stay in
`ReasoningResult.step_results`.

At most one loop restarts per batch.

## See also

- [Conditional step](/carl/steps/conditional/) for one-shot branching.
- [Caching](/carl/steps/caching/): memoize loop-body steps that see the same inputs.
