---
title: Tool Step
description: Call registered Python functions inside a chain, with typed inputs, fail-before-dispatch checks, retries and fallbacks.
sidebar:
  order: 3
---

`ToolStepDescription` calls a Python function you registered on the context.
Its behaviour is configured with `ToolStepConfig`.

## Register the tool first

Tools are looked up by name in the context's tool registry:

```python
def calculate_growth(data: str) -> dict:
    return {"growth_rate": 0.15, "trend": "positive"}

context.register_tool("calculate_growth", calculate_growth)
```

Both plain and `async` functions work. A plain function runs in a worker thread
(`asyncio.to_thread`); an `async` function is awaited directly. Both are bounded
by `ToolStepConfig.timeout`.

:::caution
Tools that run in **parallel** steps must be **stateless**. Parallel steps share
the same callables, so thread safety for mutable state is up to you. A sync tool
that is already running in a worker thread cannot be force-stopped on timeout.
:::

## ToolStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `tool_name` | `str` | required | Name of the registered tool. |
| `tool_description` | `str` | `""` | What the tool does. |
| `parameters` | `list[ToolParameter]` | `[]` | Declared parameters: types for coercion and the `required` flag. |
| `input_mapping` | `dict[str, str]` | `{}` | Tool parameter name → [reference](/carl/chains/dynamic-references/) or quoted literal. |
| `timeout` | `float` | `30.0` | Seconds per call. |
| `error_recovery` | `ToolErrorRecovery \| None` | `None` | Retries and fallback tools (below). |
| `allowed_tool_tags` | `list[str] \| None` | `None` | Tag allowlist. The step refuses a tool whose registered tags don't intersect it. |
| `output_key` | `str` | `"result"` | Accepted for compatibility. The tool executor does not read it. |
| `retry_on_error` | `bool` | `True` | Accepted for compatibility. The tool executor does not read it; use `error_recovery`. |

### ToolParameter

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `str` | required | Parameter name (matches the `input_mapping` key). |
| `type` | `str` | `"string"` | `string`, `int`, `float`, `bool`, `list` or `dict`. A string value is coerced to this type; `list` and `dict` are parsed as JSON. |
| `description` | `str` | `""` | Free text. |
| `required` | `bool` | `True` | See "Unresolved inputs" below. |
| `default` | `Any` | `None` | Informational. |

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, ToolParameter

ToolStepDescription(
    number=2,
    title="Calculate growth",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="calculate_growth",
        parameters=[ToolParameter(name="data", type="string")],
        input_mapping={"data": "$history[-1]"},  # feed step 1's output
    ),
)
```

## Inputs from the host: `$outer_context.<field>`

When the host passes structured input in `ReasoningContext.runtime_input`, a
mapping can read one field of it:

```python
context = ReasoningContext(
    outer_context="Plan a trip.",          # prompt text for LLM steps
    runtime_input={"user": {"city": "Oslo"}},
    api=client,
)

ToolStepConfig(
    tool_name="weather",
    parameters=[ToolParameter(name="city", type="string")],
    input_mapping={"city": "$outer_context.user.city"},   # → "Oslo"
)
```

With `runtime_input` set, `$outer_context` resolves to `runtime_input`, not to the
prompt text. Without it, `$outer_context.<field>` reads from `outer_context`
when that holds a JSON object. `runtime_input` is copied into every
per-step context, so the reference works inside `chain.execute()` and in
parallel batches. Details: [dynamic references](/carl/chains/dynamic-references/).

## Unresolved inputs fail before dispatch

If a **required** parameter resolves to `None`, the step fails and the tool is
**not called**:

```
CARL_TOOL_INPUT_UNRESOLVED: required parameter 'city' resolved to null; check input_mapping and runtime input.
```

A parameter is required when its `ToolParameter` says `required=True` (the
default). Without a declaration, CARL inspects the function: a parameter with no
default value is required, and so is any name the signature does not list
(for example a `**kwargs` tool). Mark optional inputs with
`ToolParameter(..., required=False)` or give the function parameter a default.

Typical causes:

- a typo in a reference, or a `$memory` key no step writes;
- `$outer_context.<field>` when the field is absent from `runtime_input`;
- an **unquoted literal**. A string that is neither a `$` reference nor quoted is
  looked up as a metadata key and usually resolves to `None`. Write literals in
  quotes and declare the type:

```python
ToolStepConfig(
    tool_name="total",
    parameters=[ToolParameter(name="values", type="list")],
    input_mapping={"values": '"[100, 200, 300]"'},   # quoted → parsed as JSON list
)
```

## Error recovery

`ToolErrorRecovery` adds retries and fallback tools:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `retry_max` | `int` | `0` | Extra attempts after the first failure. |
| `retry_delay` | `float` | `0.0` | Seconds between attempts. |
| `on_timeout` | `str \| None` | `None` | Fallback tool to call on timeout. |
| `on_exception` | `str \| None` | `None` | Fallback tool to call after retries are exhausted. |

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
`CARL_TOOL_INPUT_UNRESOLVED` is raised before any attempt, so retries and
fallbacks never run with a missing input.

## Result

On success the step result has:

- `result_data`: the tool's return value as is (read it later with
  `$steps.<n>.result_data` or `$metadata.step_<n>`);
- `result`: the same value as a string (JSON for non-strings);
- a history entry `Step N. <title> [TOOL: <name>]` with the result.

A timeout or exception gives `success=False` with `error_message`. Whether
dependent steps still run depends on [fail-fast](/carl/chains/run-controls/).

## Tools that are chains

A [chain tool](/carl/steps/chain-tools/) is registered under its own name and is
called by a tool step like any function. It returns a typed envelope; the tool
step succeeds even when the nested chain did not, so check the envelope's
`status`.

## Registering many tools at once

Use the [`@carl_tool` decorator and dynamic discovery](/carl/steps/tool-discovery/)
to register tools in bulk (from a module, a glob, or a factory).

## See also

- [Tool discovery](/carl/steps/tool-discovery/): `@carl_tool`, `register_tools_from_path`, runtime discovery.
- [Dynamic references](/carl/chains/dynamic-references/): what you can put in `input_mapping`.
- [Map step](/carl/steps/map/): call one tool for every element of a list.
- [Agent step](/carl/steps/agent/): let an LLM choose tool calls in a bounded loop.
