---
title: Conditional Step
description: Route execution to one branch based on a condition.
sidebar:
  order: 6
---

`ConditionalStepDescription` evaluates its branches in order against one value
and routes execution to the first branch that matches. The chosen step runs; the
other branches are skipped. It makes no LLM call.

## ConditionalStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `branches` | `list[ConditionalBranch]` | (required) | Ordered branches; the first whose condition is true wins. |
| `default_step` | `int \| None` | `None` | Step to run when no branch matches. |
| `condition_context_key` | `str` | `"$history[-1]"` | A [reference](/carl/chains/dynamic-references/) for the value the conditions test. An unresolved reference becomes `""`. |

Each `ConditionalBranch` has:

| Field | Type | Purpose |
| --- | --- | --- |
| `condition` | `str` | A pattern or a `simpleeval` expression (see below). |
| `next_step` | `int` | Step number to run if the condition is true. |

## Conditions

A condition sees **only the resolved value**, never the reference syntax. Pick the
value with `condition_context_key`, then test it.

Built-in patterns (matched against `str(value)`):

| Pattern | True when the value… |
| --- | --- |
| `contains:X` | contains the substring `X` (case-sensitive). |
| `equals:X` | equals `X` exactly (case-sensitive). |
| `startswith:X` / `endswith:X` | starts / ends with `X`. |
| `matches:REGEX` | matches the regular expression (`re.search`). |
| `empty` / `nonempty` | is / isn't empty or whitespace. |

Anything else is a `simpleeval` expression with the value bound to `value` (and
`v`). Available functions: `len`, `str`, `int`, `float`, `abs`, `min`, `max`,
`sum`, `bool`. Examples: `len(value) > 5`, `int(value) >= 70`,
`'error' in value or 'fail' in value`.

:::caution
An expression that raises is treated as **false**, silently. A condition such as
`$history[-1] == 'yes'` is not an error; it just never matches, because `$...`
references are not available inside the expression. Also note that
`$history[-1]` (the default key) is the full history entry,
`Step N. Title` plus `Result: ...`, so `equals:` rarely matches it. Use
`$metadata.step_N` to test step N's result value.
:::

## Routing rules

- Branch steps must declare a dependency on the conditional step
  (`dependencies=[<conditional number>]`). Otherwise they can run before the
  decision is made.
- After the decision, every step that has not run yet and is neither the chosen
  step nor depends (directly or transitively) on it is recorded as skipped
  (`skipped=True`, `success=True`). A join step that depends on the chosen branch
  still runs.
- If no branch matches and there is no `default_step`, all steps that depend
  directly on the conditional step are skipped.
- `result_data` carries `next_step` and `matched_condition` (the winning
  condition, or `"(default)"`).

:::caution[Known issue: unrelated pending steps are skipped too]
The skip rule is not limited to the conditional's own branches. A step on an
independent path that has not run yet when the decision is made (for example a
step that depends on a sibling of the conditional) is skipped as well, and never
runs. A step that ran in the same batch as the conditional can also show up twice
in `step_results`, once as completed and once as skipped. Until this is fixed,
make independent work finish before the conditional (make the conditional depend
on it), or make it depend on every branch target.
:::

## Example

```python
from mmar_carl import ConditionalStepDescription, ConditionalStepConfig, ConditionalBranch

ConditionalStepDescription(
    number=2,
    title="Route on classification",
    dependencies=[1],
    config=ConditionalStepConfig(
        condition_context_key="$metadata.step_1",
        branches=[
            ConditionalBranch(condition="equals:yes", next_step=3),
        ],
        default_step=4,
    ),
)
```

The repo's [conditions example](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/conditions_example.py)
(no API key) builds a sentiment router with `ChainBuilder`: a tool classifies the
text, then a conditional step routes to one of three handlers using `contains:`
patterns. The snippet below adds `dependencies=[2]` to the handlers. The
example file omits them, so there all three handlers run in the first batch,
before the routing decision.

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
    .add_tool_step(number=3, title="Handle Positive", tool_name="handle_positive",
                   input_mapping={}, dependencies=[2])
    .add_tool_step(number=4, title="Handle Negative", tool_name="handle_negative",
                   input_mapping={}, dependencies=[2])
    .add_tool_step(number=5, title="Handle Neutral", tool_name="handle_neutral",
                   input_mapping={}, dependencies=[2])
    .build()
)
```

## See also

- [Loops](/carl/steps/loops/): repeat a range of steps until a condition holds.
- [Evaluation step](/carl/steps/advanced/): an inline quality gate with its own `on_fail` routing.
