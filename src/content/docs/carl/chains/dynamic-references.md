---
title: Dynamic References
description: The $history / $memory / $outer_context / $steps / $metadata / $event / $ltm reference syntax and literals that wire steps together.
sidebar:
  order: 4
---

Many step fields take a **reference string** that CARL resolves against the
execution context at run time. This is how a later step reads an earlier step's
output, a memory value, or the host's input.

## Reference syntax

| Reference | Resolves to |
| --- | --- |
| `$history[-1]` | One history entry by index (negative counts from the end). `None` when history is empty. |
| `$history` | The whole current history as one string. |
| `$memory.namespace.key` | A memory value. `$memory.key` reads the `default` namespace. |
| `$outer_context` | The host input. If `context.runtime_input` is set, that dict. Otherwise the `outer_context` string, parsed as JSON when it looks like JSON (`{…}`, `[…]` or a quoted string). |
| `$outer_context.path.to.field` | One field of the value above, by dotted path. `None` if a key is missing. |
| `$steps.<n>.path` | A field of step `n`'s stored result, e.g. `$steps.1.result_data` or `$steps.1.result_data.city`. |
| `$metadata.path` | A (possibly nested) value from `context.metadata`. Each finished step's `result_data` is also stored as `$metadata.step_<n>`. |
| `$event.<name>` | The latest payload emitted for an event (see [the event bus](/carl/orchestration/overview/#the-event-bus)). |
| `$ltm.<key>` | A value from long-term memory, when an LTM backend is attached. |
| `"text"` or `'text'` | A **literal**. The quotes are stripped and the text is used as is. |
| anything else | Looked up as a plain key in `context.metadata`. Usually `None`. |

Nested paths use dots; list elements use numeric segments.

### Host input: `runtime_input` vs `outer_context`

A host that has structured input should pass it separately from the prompt text:

```python
context = ReasoningContext(
    outer_context="Summarise the customer's request.",   # what LLM steps read as input text
    runtime_input={"customer": {"id": 42, "city": "Oslo"}},
    api=client,
)
```

- `$outer_context` → `{"customer": {...}}`, and `$outer_context.customer.city` → `"Oslo"`.
- LLM prompts still use `outer_context` (and `step_context_queries` search it).
- `runtime_input` is copied into each per-step context, including parallel batches,
  so references work inside `chain.execute()`.
- Hosts can check support with `mmar_carl.HOST_RUNTIME_INPUT_ABI` (`1`).

Without `runtime_input`, put JSON in `outer_context` and the same references work.

### Literals

Quote literals. An unquoted value that is not a `$` reference is looked up as a
metadata key and usually resolves to `None`. For a
[tool step](/carl/steps/tool/) a required parameter that resolves to `None`
fails with `CARL_TOOL_INPUT_UNRESOLVED` before the tool is called.

```python
input_mapping={
    "style": "'concise'",          # string literal
    "values": '"[1, 2, 3]"',       # JSON text; declare ToolParameter(type="list") to parse it
    "limit": '"10"',               # declare ToolParameter(type="int") to get 10
}
```

Agent-delegation steps ([Claude Code](/carl/steps/claude-code/),
[Codex](/carl/steps/codex/)) are more lenient: there an unquoted, non-`$` value
is passed through as plain text.

## Where references are used

| Field | On step | Typical value |
| --- | --- | --- |
| `input_mapping` | Tool, agent, map, command, command plan, agent skill, handoff, supervisor, Claude Code, Codex | `{"data": "$history[-1]"}` |
| `input_mapping` | Structured output | Only the mapped values enter the prompt's `Input:` block. |
| `prompt_input_mapping` | Human input | Mapped values are added to the human prompt as `Context (JSON):`. |
| `argument_mapping` | MCP | `{"query": "$memory.input.query"}` |
| `value_source` | Memory (write/append) | `"$history[-1]"` |
| `condition`, `condition_context_key` | Conditional | `"$history[-1]"` |
| `condition_key` | [Loop](/carl/steps/loops/) | `"$memory.loop.needs_retry"` |
| `input_source` | Structured output | `"$history[-1]"` |
| `input_key` | Transform | `"$history[-1]"` |
| `items_source` | [Map](/carl/steps/map/) | `"$steps.1.result_data.rows"` |
| `task_source` | Supervisor, debate | `"$outer_context"` |
| `resume_session` | Claude Code, Codex | `"$memory.claude_code.step_1"` |
| `output_reference` | [Chain tool](/carl/steps/chain-tools/) | `"$steps.1.result_data"` (read in the child) |

Some fields accept only `$` references. Agent and map steps, for example, reject
literals in `input_mapping`; their pages say so.

## Example

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

ToolStepDescription(
    number=2,
    title="Summarise",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="summarise",
        input_mapping={
            "text": "$history[-1]",
            "topic": "$memory.input.topic",
            "city": "$outer_context.customer.city",
            "style": "'concise'",
        },
    ),
)
```

## Validation before the run

When a chain is built and before it runs, CARL checks reference syntax and warns
when a step reads a `$memory.*` key that no earlier step writes. The warning also
fires for keys you pre-populate on the context; it is a hint, not an error.
Scoped mappings (`input_mapping` on structured output, `prompt_input_mapping` on
human input) are checked the same way.
