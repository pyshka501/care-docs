---
title: Memory Overview
description: The three memory layers, how to read and write them, and history management.
sidebar:
  order: 1
---

CARL gives a chain three layers of state:

1. **Short-term memory** — namespaced key/value store on the context
   (`context.memory[namespace][key]`). Lives for one run.
2. **Session metadata** — arbitrary `context.metadata` for custom extensions.
3. **Long-term memory (LTM)** — optional cross-session backend; see [LTM](/carl/memory/ltm/).

Plus **history** — the flat list of step outputs in execution order.

## Reading & writing short-term memory

From inside a chain, use a [memory step](/carl/steps/memory/) (`read` / `write` /
`append` / `delete` / `list`). Programmatically, the context exposes the same
operations:

```python
context.memory_write("analysis", value, namespace="results")
context.memory_read("analysis", namespace="results", default=None)
context.memory_append("log", entry, namespace="events")
context.memory_delete("analysis", namespace="results")
context.memory_list(namespace="results")   # -> list of keys
```

All take `namespace="default"` unless you pass one. Read memory back in step
references with [`$memory.namespace.key`](/carl/chains/dynamic-references/).

:::caution
Under [parallel execution](/carl/async/overview/) each step gets a copy-on-write
view of memory — writes are visible only to **subsequent** batches, not parallel
siblings. See [copy-on-write](/carl/memory/cow/).
:::

## History management

`context.history` is the list of step outputs; `context.get_current_history()`
renders it as a single string. For long chains, cap it to prevent context bloat:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `max_history_entries` | `int` | `0` | Max entries to keep (`0` = unlimited). |
| `trim_strategy` | `"oldest" \| "compress"` | `"oldest"` | `oldest` drops the oldest entries (FIFO); `compress` strips verbose step headers, keeping result content. |

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    max_history_entries=20,
    trim_strategy="compress",
)
```

## See also

- [Copy-on-write isolation](/carl/memory/cow/)
- [Long-term memory](/carl/memory/ltm/)
- [Memory schema validation](/carl/memory/schema/)
