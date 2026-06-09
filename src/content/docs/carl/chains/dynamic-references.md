---
title: Dynamic References
description: The $history / $memory / $metadata / $outer_context reference syntax that wires steps together.
sidebar:
  order: 4
---

Many step fields take a **reference string** that CARL resolves against the
execution context at run time. This is how a later step reads an earlier step's
output, a memory value, or the original input.

## Reference syntax

| Reference | Resolves to |
| --- | --- |
| `$history[-1]` | The output of a previous step by index (negative indexes from the end). |
| `$history` | The full current history as a single string. |
| `$memory.namespace.key` | A value from memory in a namespace. `$memory.key` uses the `default` namespace. |
| `$outer_context` | The original input. If it looks like JSON, it's parsed automatically. |
| `$metadata.path` | A (possibly nested) value from context metadata. |
| `$steps.path` | A nested value from the per-step results metadata. |
| `$ltm.key` | A value from long-term memory (when an LTM backend is wired in). |
| `$event.name` | The most-recent payload emitted for an event (see event-driven steps). |
| `"literal"` or `'literal'` | A quoted string is returned verbatim (a literal, not a reference). |

Anything else is looked up as a plain key in context metadata.

## Where references are used

| Field | On step | Typical value |
| --- | --- | --- |
| `input_mapping` | Tool | `{"data": "$history[-1]"}` |
| `argument_mapping` | MCP | `{"query": "$memory.input.query"}` |
| `value_source` | Memory (write/append) | `"$history[-1]"` |
| `condition` | Conditional branch | `"$history[-1] == 'yes'"` |
| `condition_context_key` | Conditional | `"$history[-1]"` |
| `condition_key` | [Loop](/carl/steps/loops/) | `"$memory.loop.needs_retry"` |
| `input_source` | Structured output | `"$history[-1]"` |
| `input_key` | Transform | `"$history[-1]"` |

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

# Feed the previous step's output and a literal into a tool
ToolStepDescription(
    number=2,
    title="Summarise",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="summarise",
        input_mapping={
            "text": "$history[-1]",
            "topic": "$memory.input.topic",
            "style": "'concise'",          # a literal string
        },
    ),
)
```

:::tip
Pre-execution validation warns when a step reads a `$memory.*` key that no prior
step writes — a quick way to catch wiring typos.
:::
