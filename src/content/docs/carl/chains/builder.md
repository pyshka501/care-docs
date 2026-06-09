---
title: ChainBuilder
description: A fluent builder for assembling chains step by step.
sidebar:
  order: 2
---

`ChainBuilder` is a fluent alternative to constructing step objects by hand —
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
    .build()
)
```

## Step methods

| Method | Adds |
| --- | --- |
| `add_step(number, title, aim, reasoning_questions, stage_action, example_reasoning, …)` | An LLM step. Also takes `dependencies`, `step_context_queries`, `llm_config`, `execution_mode`. |
| `add_tool_step(number, title, tool_name, input_mapping=…, …)` | A tool step (`timeout=30.0`). |
| `add_mcp_step(number, title, server_name, tool_name, …)` | An MCP step (`timeout=60.0`). |
| `add_memory_step(number, title, operation, memory_key, …)` | A memory step (`namespace="default"`). |
| `add_transform_step(number, title, transform_type, input_key="$history[-1]", …)` | A transform step. |
| `add_conditional_step(...)` | A conditional branching step. |

Every `add_*` method accepts `dependencies`, `checkpoint`, `checkpoint_name`, and
`replan_enabled`, and returns `self` for chaining.

## Configuration methods

| Method | Sets |
| --- | --- |
| `with_max_workers(n)` | Parallel workers (`int` or `"auto"`). |
| `with_search_config(config)` | Context-extraction strategy. |
| `with_default_llm_config(cfg)` | Default LLM config for all LLM steps. |
| `with_timeout(seconds)` | Chain-level timeout. |
| `with_replan_policy(policy)` | RE-PLAN policy. |
| `with_progress(enable=True)` | Progress logging. |
| `with_metadata(**kv)` | Arbitrary metadata. |
| `with_trace_name(name)` / `with_session_id(id)` | Tracing identifiers. |
| `with_prompt_template(t)` | Custom prompt template. |

Finish with `.build()` → a `ReasoningChain`.

## See also

- [Generate a chain from natural language](/carl/chains/from-description/).
- [Dynamic references](/carl/chains/dynamic-references/) for `input_mapping` / `value_source`.
