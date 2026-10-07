---
title: Copy-on-Write Isolation
description: How parallel steps get isolated memory, and how their writes are merged back after the batch.
sidebar:
  order: 2
---

Steps in one parallel batch each run on their own copy of the context. Memory
in that copy is a **copy-on-write** view of the parent: nothing is copied
until a step touches it, and after the batch only what each step actually
changed is merged back.

## What a step sees

- Each step sees memory as it was at the **start of its batch**.
- A step's writes are **not** visible to its siblings in the same batch, only
  to later batches.
- Reading a namespace copies the mapping, not the values. A mutable value
  (list, dict) is deep-copied the first time the step reads it, so
  `memory_append` or in-place edits inside a parallel step never change the
  parent or a sibling.
- Registered tools are shared by reference. They must be safe to call
  concurrently.

## How writes are merged

The store records which keys a step **wrote** or **deleted** (reads never
count). After the batch, CARL merges per step, in step declaration order:

1. Deletions first, then writes, key by key.
2. A step that only read a namespace merges nothing, so it cannot revert a
   sibling's write.
3. Two steps writing **different** keys of one namespace both keep their
   values.
4. Two steps writing the **same** key (write/write, write/delete, two
   appends to one list): the step declared later wins. Appends are not
   combined. The order does not depend on `max_workers` or timing.
5. Every merged value is checked against the context's
   [`memory_schema`](/carl/memory/schema/). A violating value is dropped and
   the step that wrote it is marked failed.
6. A failed step's memory changes are not merged. A `map` step is the
   exception: its configured aggregate output is merged even when some items
   failed.

Example, verified on 0.5.0: two parallel memory steps write `k1` and `k2`
into a namespace that already holds `k1 = "old"`. The result is
`{"k1": "v1", "k2": "v2"}`.

## Profiling

Per-step memory and history sizes are recorded in
`StepExecutionResult.profiling` (`memory_bytes_after`, `history_bytes_after`,
`history_bytes_added`) and summarised by `result.get_profiling_summary()`.

## See also

- [Async execution](/carl/async/overview/#memory-isolation-under-parallelism) — the parallelism model.
- [Memory overview](/carl/memory/overview/) · [Memory schema](/carl/memory/schema/)
