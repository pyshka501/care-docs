---
title: Loops
description: Re-run a range of steps until a condition holds, with a budget guard.
sidebar:
  order: 8
---

Any step can loop back to an earlier step, forming a cyclic loop body. Attach
`loop_back_to` and `loop_config` to the **tail** step of the loop.

After the tail step completes successfully, the executor evaluates
`loop_config.condition_key`; while it resolves truthy (and the iteration budget
isn't exhausted) the loop body — steps `[loop_back_to, tail]` inclusive — is reset
and re-run.

## LoopConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `condition_key` | `str` | `""` | A [context reference](/carl/chains/dynamic-references/) (`$memory.ns.key`, `$history[-1]`, `$outer_context`) whose resolved value is cast to `bool`. Empty = "always loop" up to `max_iterations`. |
| `max_iterations` | `int` | `10` | Budget guard — max re-executions of the loop body (≥ 1). |
| `negate_condition` | `bool` | `False` | `False` = while-loop (continue while truthy). `True` = until-loop (continue while falsy). |

:::caution
`condition_key` is a **reference**, not an arbitrary expression — its *resolved
value* is cast to a boolean. Have an earlier step write a flag (e.g.
`$memory.loop.needs_retry`) rather than embedding logic in the condition string.
:::

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, LoopConfig

# Steps 1–2 form the loop body; step 2 drives iteration.
ToolStepDescription(
    number=2,
    title="Refine answer",
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

`ChainBuilder` wraps the manual API with `add_until_loop` and `add_while_loop`:
pass a list of body steps and a `condition_key`, and the builder renumbers the
body and attaches the right `LoopConfig` (`add_while_loop` continues while truthy;
`add_until_loop` continues until truthy).

## Example

The repo's [loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py)
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

After the run, the per-step iteration counts are in
`context.metadata["loop_iteration_history"]`. The example also covers a
retry-until-success loop, the manual `loop_back_to` / `loop_config` API, and an
`add_while_loop` queue drainer.

## See also

- [Loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py) in the repo.
- [Conditional step](/carl/steps/conditional/) for one-shot branching.
