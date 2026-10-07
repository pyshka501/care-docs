---
title: Memory Step
description: Read, write, append, delete, and list values in namespaced shared memory.
sidebar:
  order: 4
---

`MemoryStepDescription` performs one operation on the context's namespaced memory
store. Use it to stash intermediate results that later steps read back. It makes
no LLM call.

## MemoryStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `operation` | `MemoryOperation` | (required) | `read` / `write` / `append` / `delete` / `list`. |
| `memory_key` | `str` | (required) | Key in the memory store. Also required for `list`, where it is not used. |
| `value_source` | `str \| None` | `None` | Where the value comes from on `write` / `append`, e.g. `"$history[-1]"`. |
| `default_value` | `Any` | `None` | `read`: returned when the key is missing. `write` / `append` without `value_source`: the value written. |
| `namespace` | `str` | `"default"` | Namespace for isolation. |

Memory is organised as **namespace → key**. Read it back elsewhere with the
`$memory.namespace.key` [reference](/carl/chains/dynamic-references/)
(`$memory.key` reads from the `default` namespace).

What each operation does and returns:

| Operation | Effect | `result_data` |
| --- | --- | --- |
| `read` | Reads the key, or `default_value`. | The value. |
| `write` | Overwrites the key. | `{"key", "namespace", "value"}` |
| `append` | Appends to a list, creating `[]` first. Fails if the key holds a non-list. | `{"key", "namespace", "appended"}` |
| `delete` | Removes the key if present. A missing key is not an error. | `{"key", "namespace", "existed"}` |
| `list` | Lists the namespace's keys. | `list[str]` |

`value_source` is resolved as a reference. A value that does not start with `$`
and does not resolve is written as a literal string.

If the chain or context has a [memory schema](/carl/memory/schema/), `write` and
`append` are type-checked first; a mismatch fails the step and nothing is written.

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
    dependencies=[3],
    config=MemoryStepConfig(
        operation=MemoryOperation.READ,
        memory_key="analysis",
        namespace="results",
        default_value="(missing)",
    ),
)
```

`$history[-1]` is the previous step's full history entry (`Step N. Title` plus
`Result: ...`). To store only the result value, use `$metadata.step_N`, which
holds that step's `result_data` (or `result` when there is no structured data).

## Memory under parallel execution

Steps in the same parallel batch work on copy-on-write views of memory. The rules:

- **Siblings don't see each other's writes.** Each step in a batch sees memory as
  it was before the batch. Writes become visible to later batches.
- **Reads don't revert writes.** Only keys a step actually wrote or deleted are
  merged back. A step that only reads a namespace contributes nothing to the merge
  (but see the caution below for list and dict values).
- **Nested values are isolated.** Reading a mutable value (a list, a dict) gives
  the step its own copy. In-place changes such as `append` are detected and merged
  as writes; they never reach the parent or a sibling directly.
- **Same-key conflicts are last-write-wins in step declaration order.** When two
  steps of one batch write (or write and delete) the same key, the
  highest-numbered step wins, whatever finished first. This holds for any
  `max_workers`.
- **Appends are whole-list writes, not unions.** Two steps appending to the same
  list in one batch: the higher-numbered step's list survives, the other append is
  lost. Put such steps in separate batches (add a dependency) if you need both.
- **Merged values pass the memory schema.** A merged value that violates the
  memory schema is not merged, and the step that wrote it is marked failed.

:::caution[Known issue: list and dict values]
When one step of a batch writes or appends to a key holding a **list or dict**,
and a higher-numbered step of the same batch only reads that key, the old value
can come back after the merge. The reader's isolated copy is compared with the
parent value after the writer has already merged, so it looks like a change and
is merged last. Scalar values (strings, numbers, booleans) are not affected.
Until this is fixed, don't read and write the same list or dict key in one
parallel batch: make the reader depend on the writer.
:::

Details and the reasoning behind these rules: [copy-on-write memory](/carl/memory/cow/).

## See also

- [Memory overview](/carl/memory/overview/) and [memory schema](/carl/memory/schema/).
- [Dynamic references](/carl/chains/dynamic-references/): reading memory with `$memory.*`.
- [Building chains](/carl/chains/builder/): the `add_memory_step()` shortcut.
