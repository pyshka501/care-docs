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

## See also

- [Loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py) in the repo.
- [Conditional step](/carl/steps/conditional/) for one-shot branching.
