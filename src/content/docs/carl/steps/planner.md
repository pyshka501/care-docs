---
title: Planner Step
description: Let a model choose and order a bounded set of tool actions that the chain declared in advance.
sidebar:
  order: 23
---

`PlannerStepDescription` (`step_type: "planner"`, new in 0.5.0) lets a model
pick which of a fixed set of tool actions to run, and in what order. The chain
declares the actions with their tool arguments. The model only returns action
IDs. CARL then adds the chosen actions to the running DAG as ordinary
[tool steps](/carl/steps/tool/).

An empty plan is valid. A step that depends on the planner waits until the
whole selected sequence has finished.

## Example

```python
from mmar_carl import (
    Language, LLMStepDescription, PlannerStepConfig, PlannerStepDescription,
    ReasoningChain, ReasoningContext, ToolStepConfig,
)

plan = PlannerStepDescription(
    number=1,
    title="Choose checks",
    config=PlannerStepConfig(
        instruction="Select the checks the user asked for.",
        input_mapping={"request": "$outer_context.request"},
        actions={
            "inventory": ToolStepConfig(
                tool_name="check_inventory",
                tool_description="Count units in stock",
                input_mapping={"product_id": "$outer_context.product_id"},
            ),
            "price": ToolStepConfig(
                tool_name="check_price",
                tool_description="Look up the current price",
                input_mapping={"product_id": "$outer_context.product_id"},
            ),
        },
        max_actions=2,
    ),
)
report = LLMStepDescription(number=2, title="Report", aim="Summarise the checks.", dependencies=[1])
chain = ReasoningChain(steps=[plan, report])

context = ReasoningContext(
    outer_context="How much is SKU-7?",
    runtime_input={"request": "How much is SKU-7?", "product_id": "SKU-7"},
    api=client,
    language=Language.ENGLISH,
)
context.register_tool("check_inventory", lambda product_id: {"units": 12})
context.register_tool("check_price", lambda product_id: {"price": 19.9})

result = chain.execute(context)
```

If the model answers `{"actions": ["price"]}`, the run contains the planner
(step 1), an injected tool step titled `price` (step 3, the next free number)
and then the report (step 2), which waited for step 3.

## PlannerStepConfig

The model rejects unknown fields.

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `instruction` | `str` | required | What to plan, 1–8192 chars. |
| `actions` | `dict[str, ToolStepConfig]` | required | 1–32 named actions. Names are 1–64 chars. Each value is a full tool config with its own `input_mapping`. |
| `input_mapping` | `dict[str, str]` | `{}` | Inputs the model sees, as `{name: reference}`. |
| `max_actions` | `int` | `3` | Upper bound on the plan length, 1–16. |

`PlannerStepDescription` also takes an optional `llm_config` for the planning
call. `cache` is rejected: a planner adds steps to the DAG.

## How the plan is made

The planner runs a [structured-output](/carl/steps/structured-output/) call.
The prompt carries `instruction`, the `input_mapping` values, and a catalog of
action names with their `tool_description` (or `tool_name` when the
description is empty). The reply must match a JSON Schema:
`{"actions": [...]}`, at most `max_actions` unique names from `actions`.

The model cannot pass tool arguments, invent a tool or add another planner.
Tool arguments stay in the chain. Only register tools the host is willing to
call; `chain.preflight(context)` lists the primary and fallback tools of every
action.

## Result

| Where | What |
| --- | --- |
| `$steps.N.result_data.actions` | The selected action IDs, in order. |
| `$steps.N.result_data.step_numbers` | Step numbers assigned to the injected tool steps, same order (nonempty plans). |
| Injected steps | Ordinary tool step results, titled with the action name. Each depends on the previous one. |

`ReasoningContext.on_step_complete` fires when the planner has chosen, while
other steps of its batch may still run. For a nonempty plan,
`on_step_event(planner_number, "planner_actions_scheduled", payload)` fires
after the step numbers are assigned and before the tools start. The payload
has parallel `actions` and `step_numbers` lists.

A failed injected tool behaves like any failed step. Turn on chain
[`fail_fast`](/carl/chains/run-controls/#fail-fast) if a tool failure should
stop the rest of the plan.

## Limits

- A chain with a planner rejects RE-PLAN, loop-back, trace replay and resume
  from a saved snapshot. In-process pause and resume work as usual.
- Each planner's budget is `max_actions` or the number of `actions`,
  whichever is smaller. The sum over all planners must fit the chain's
  `max_injections` (default 50), or the chain is rejected when it is built.
- Chain format 13 introduced the step type. A reader older than 0.5.0 rejects
  format 13 and newer with `ChainFormatNewerError`.

## See also

- [Command plan](/carl/steps/command-plan/): a model picks typed arguments for one host capability.
- [Agent step](/carl/steps/agent/): a bounded tool loop where the model also picks arguments.
- [Tool step](/carl/steps/tool/) · [Dynamic references](/carl/chains/dynamic-references/)
