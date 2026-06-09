---
title: Conditional Step
description: Branch to a step based on a condition expression.
sidebar:
  order: 6
---

`ConditionalStepDescription` evaluates one or more conditions and routes execution
to a target step. The winning branch's step runs; the non-winning branches'
downstream steps are skipped (true routing).

## ConditionalStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `branches` | `list[ConditionalBranch]` | — (required) | Ordered branches; the first whose condition is truthy wins. |
| `default_step` | `int \| None` | `None` | Step to run when no branch matches. |
| `condition_context_key` | `str` | `"$history[-1]"` | The value conditions are evaluated against. |

Each `ConditionalBranch` has:

| Field | Type | Purpose |
| --- | --- | --- |
| `condition` | `str` | Expression evaluated against context (uses `simpleeval`). |
| `next_step` | `int` | Step number to run if the condition is true. |

## Example

```python
from mmar_carl import ConditionalStepDescription, ConditionalStepConfig, ConditionalBranch

ConditionalStepDescription(
    number=2,
    title="Route on classification",
    dependencies=[1],
    config=ConditionalStepConfig(
        branches=[
            ConditionalBranch(condition="$history[-1] == 'yes'", next_step=3),
        ],
        default_step=4,
    ),
)
```

Condition expressions can use the [dynamic references](/carl/chains/dynamic-references/)
(`$history[-1]`, `$memory.ns.key`, …) to inspect prior output.

## See also

- [Loops](/carl/steps/loops/) — repeat a range of steps until a condition holds.
- [Conditional routing example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) in the repo.
