---
title: Memory Step
description: Read, write, append, delete, and list values in namespaced shared memory.
sidebar:
  order: 4
---

`MemoryStepDescription` performs an operation on the context's namespaced memory
store — useful for stashing intermediate results that later steps read back.

## MemoryStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `operation` | `MemoryOperation` | — (required) | `read` / `write` / `append` / `delete` / `list`. |
| `memory_key` | `str` | — (required) | Key in the memory store. |
| `value_source` | `str \| None` | `None` | Where the value comes from on `write`/`append` (e.g. `"$history[-1]"`). |
| `default_value` | `Any` | `None` | Returned on `read` when the key is missing. |
| `namespace` | `str` | `"default"` | Namespace for isolation. |

Memory is organised by **namespace → key**. Read it back elsewhere with the
`$memory.namespace.key` [reference](/carl/chains/dynamic-references/).

## Example: write then read

```python
from mmar_carl import MemoryStepDescription, MemoryStepConfig, MemoryOperation

# Step 3 stores step 2's output under results/analysis
MemoryStepDescription(
    number=3,
    title="Store result",
    dependencies=[2],
    config=MemoryStepConfig(
        operation=MemoryOperation.WRITE,
        memory_key="analysis",
        value_source="$history[-1]",
        namespace="results",
    ),
)

# A later step reads it back
MemoryStepDescription(
    number=5,
    title="Retrieve result",
    config=MemoryStepConfig(
        operation=MemoryOperation.READ,
        memory_key="analysis",
        namespace="results",
        default_value="(missing)",
    ),
)
```

:::note
During **parallel** execution each step gets a copy-on-write view of memory.
Writes from parallel siblings are **not** visible to each other — only to
subsequent batches.
:::

## See also

- [Dynamic references](/carl/chains/dynamic-references/) — reading memory with `$memory.*`.
- [Building chains](/carl/chains/builder/) — the `add_memory_step()` shortcut.
