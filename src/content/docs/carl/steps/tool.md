---
title: Tool Step
description: Call registered Python functions inside a chain, with retries and fallbacks.
sidebar:
  order: 3
---

`ToolStepDescription` executes a Python function you registered on the context.
Its behaviour is configured with `ToolStepConfig`.

## Register the tool first

Tools are looked up by name in the context's tool registry:

```python
def calculate_growth(data: str) -> dict:
    return {"growth_rate": 0.15, "trend": "positive"}

context.register_tool("calculate_growth", calculate_growth)
```

:::caution
Tools that run in **parallel** steps must be **stateless** — parallel steps share
tools via a shallow copy, so thread safety is not guaranteed for mutable state.
:::

## ToolStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `tool_name` | `str` | — (required) | Name of the registered tool. |
| `tool_description` | `str` | `""` | What the tool does. |
| `parameters` | `list[ToolParameter]` | `[]` | Declared input parameters. |
| `input_mapping` | `dict[str, str]` | `{}` | Maps tool parameter names → context references (e.g. `"$history[-1]"`). |
| `output_key` | `str` | `"result"` | Key under which the output is stored in the step result. |
| `timeout` | `float` | `30.0` | Execution timeout in seconds. |
| `retry_on_error` | `bool` | `True` | Whether to retry on error. |
| `error_recovery` | `ToolErrorRecovery \| None` | `None` | Retry + fallback strategy (below). |
| `allowed_tool_tags` | `list[str] \| None` | `None` | Whitelist of tags; the executor refuses tools whose tags don't intersect. |

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

ToolStepDescription(
    number=2,
    title="Calculate growth",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="calculate_growth",
        input_mapping={"data": "$history[-1]"},  # feed step 1's output
    ),
)
```

## Error recovery

`ToolErrorRecovery` adds retries and fallback tools:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `retry_max` | `int` | `0` | Extra attempts after the first failure. |
| `retry_delay` | `float` | `0.0` | Seconds between attempts. |
| `on_timeout` | `str \| None` | `None` | Fallback tool name to call on timeout. |
| `on_exception` | `str \| None` | `None` | Fallback tool name to call after retries are exhausted. |

```python
from mmar_carl import ToolStepConfig, ToolErrorRecovery

ToolStepConfig(
    tool_name="web_search",
    error_recovery=ToolErrorRecovery(
        retry_max=2,
        retry_delay=1.0,
        on_timeout="cached_search",    # registered fallback tool
        on_exception="cached_search",
    ),
)
```

The fallback tool receives the same keyword arguments as the primary tool.

## Registering many tools at once

Use the [`@carl_tool` decorator + dynamic discovery](/carl/steps/tool-discovery/) to
register tools in bulk (from a module, a glob, or a factory) instead of one
`register_tool` call at a time.

## See also

- [Tool discovery](/carl/steps/tool-discovery/) — `@carl_tool`, `register_tools_from_path`, runtime discovery.
- [Dynamic references](/carl/chains/dynamic-references/) — what you can put in `input_mapping`.
