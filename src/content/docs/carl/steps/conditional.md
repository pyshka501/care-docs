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

## Condition patterns

Besides bare `simpleeval` expressions, branch conditions accept a set of built-in
shorthand patterns (matched against the resolved `condition_context_key` value):

| Pattern | Matches when the value… |
| --- | --- |
| `contains:X` | contains the substring `X`. |
| `equals:X` | equals `X` exactly (case-sensitive). |
| `startswith:X` / `endswith:X` | starts / ends with `X`. |
| `matches:REGEX` | matches the regular expression. |
| `empty` / `nonempty` | is / isn't empty or whitespace. |

Anything else is evaluated as a `simpleeval` expression with `value` bound to the
resolved input — e.g. `len(value) > 5`, `int(value) >= 70`, or
`'error' in value or 'fail' in value`.

## Example

The repo's [conditions example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py)
(no API key) builds a sentiment router with `ChainBuilder`: a tool classifies the
text, then a conditional step routes to one of three handlers using `contains:`
patterns.

```python
chain = (
    ChainBuilder()
    .add_tool_step(number=1, title="Classify Sentiment",
                   tool_name="classify_text", input_mapping={"text": "$outer_context"})
    .add_conditional_step(
        number=2, title="Route by Sentiment",
        condition_context_key="$metadata.step_1",
        branches=[("contains:positive", 3), ("contains:negative", 4), ("contains:neutral", 5)],
        default_step=5, dependencies=[1],
    )
    .add_tool_step(number=3, title="Handle Positive", tool_name="handle_positive", input_mapping={})
    .add_tool_step(number=4, title="Handle Negative", tool_name="handle_negative", input_mapping={})
    .add_tool_step(number=5, title="Handle Neutral", tool_name="handle_neutral", input_mapping={})
    .build()
)
```

The conditional step's `result_data` carries `matched_condition` (the winning
branch's condition, or `"(default)"`) and `next_step` (the step it routed to).

## See also

- [Loops](/carl/steps/loops/) — repeat a range of steps until a condition holds.
- [Conditional routing example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) in the repo.
