---
title: ChainBuilder
description: A fluent builder for assembling chains step by step.
sidebar:
  order: 2
---

`ChainBuilder` is a fluent alternative to constructing step objects by hand:
chain `.add_*()` and `.with_*()` calls, then `.build()`.

## Example

```python
from mmar_carl import ChainBuilder

chain = (
    ChainBuilder()
    .add_step(
        number=1,
        title="Analysis",
        aim="Analyze the data.",
        reasoning_questions="What patterns exist?",
        stage_action="Extract insights.",
        example_reasoning="Pattern analysis reveals trends.",
    )
    .add_tool_step(
        number=2,
        title="Calculate",
        tool_name="my_calculator",
        input_mapping={"value": "$history[-1]"},
        dependencies=[1],
    )
    .add_memory_step(
        number=3,
        title="Store",
        operation="write",
        memory_key="result",
        value_source="$history[-1]",
        dependencies=[2],
    )
    .with_max_workers(2)
    .with_fail_fast()
    .build()
)
```

## Step methods

| Method | Adds |
| --- | --- |
| `add_step(number, title, aim, reasoning_questions, stage_action, example_reasoning, …)` | An LLM step. Also takes `dependencies`, `step_context_queries`, `llm_config`, `execution_mode`. |
| `add_tool_step(number, title, tool_name, input_mapping=None, …)` | A tool step (`timeout=30.0`, `tool_description=""`). |
| `add_mcp_step(number, title, server_name, tool_name, command=None, args=None, …)` | An MCP step over stdio (`arguments`, `argument_mapping`, `timeout=60.0`). |
| `add_memory_step(number, title, operation, memory_key, …)` | A memory step (`value_source`, `default_value`, `namespace="default"`). |
| `add_transform_step(number, title, transform_type, input_key="$history[-1]", …)` | A transform step (`output_format`, `expression`, `map_template`). |
| `add_conditional_step(number, title, branches, default_step=None, condition_context_key="$history[-1]", …)` | A conditional step. `branches` is a list of `(condition, next_step)` tuples or `ConditionalBranch`. |
| `add_if_else(number, title, condition, if_true, if_false, condition_step=None, …)` | A two-way conditional. |
| `add_switch(number, title, branches, condition_step=None, …)` | A multi-way conditional; `branches` maps conditions to step numbers, `"default"` maps the fallback. |
| `add_while_loop(body_steps, condition_key, max_iterations=10, start_number=None)` | A loop body that repeats while the condition is truthy. See [loops](/carl/steps/loops/). |
| `add_until_loop(body_steps, condition_key, max_iterations=10, start_number=None)` | A loop body that repeats until the condition becomes truthy. |
| `add_chain_tool(definition)` | A [chain tool](/carl/steps/chain-tools/) definition. |

The `add_*` step methods accept `dependencies` (except `add_if_else` and
`add_switch`, which use `condition_step`), `checkpoint`, `checkpoint_name` and,
for most, `replan_enabled`. All return `self`.

There are no `add_*` shortcuts for the other step types (agent, code, command,
wait, map, Claude Code, Codex, orchestration steps, …). Build those as typed
objects and append them to `builder.steps`, or pass a list straight to
`ReasoningChain`:

```python
from mmar_carl import WaitStepDescription, WaitStepConfig, AfterWaitCondition

builder = ChainBuilder().add_tool_step(number=1, title="Kick off", tool_name="start_job")
builder.steps.append(
    WaitStepDescription(
        number=2,
        title="Give the job a minute",
        dependencies=[1],
        config=WaitStepConfig(condition=AfterWaitCondition(seconds=60)),
    )
)
chain = builder.build()
```

## Configuration methods

| Method | Sets |
| --- | --- |
| `with_max_workers(n)` | Parallel workers (`int` or `"auto"`). |
| `with_fail_fast(enabled=True)` | Stop scheduling after the first final failure. See [run controls](/carl/chains/run-controls/). |
| `with_timeout(seconds)` | Chain-level timeout. |
| `with_search_config(config)` | Context extraction strategy. |
| `with_default_llm_config(cfg)` | Default LLM config for LLM steps. |
| `with_replan_policy(policy)` | RE-PLAN policy. |
| `with_progress(enable=True)` | Progress logging. |
| `with_metadata(**kv)` | Chain metadata. |
| `with_trace_name(name)` / `with_session_id(id)` | Tracing identifiers. |
| `with_prompt_template(t)` | Custom prompt template. |

Finish with `.build()` to get a `ReasoningChain`; it runs the same validation as
the constructor.

## See also

- [Generate a chain from natural language](/carl/chains/from-description/).
- [Dynamic references](/carl/chains/dynamic-references/) for `input_mapping` / `value_source`.
