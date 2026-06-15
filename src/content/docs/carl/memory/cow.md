---
title: Copy-on-Write Isolation
description: How parallel steps get isolated memory without paying for a full deep copy.
sidebar:
  order: 2
---

When steps run in parallel, each one needs its own view of memory so siblings
don't clobber each other. CARL does this with a **copy-on-write (COW)** store
instead of deep-copying the whole memory for every step.

## What you need to know

- Each parallel step sees the memory as it was at the **start of its batch**.
- A step's writes are **not** visible to its parallel siblings — only to
  **subsequent** batches.
- Tools shared across parallel steps must be **stateless** (they're shared via a
  shallow copy).

This is automatic — there's nothing to configure. It just makes parallel
execution correct and cheaper than full deep copies.

## Profiling

Per-step memory and history sizes are recorded in each `StepExecutionResult.profiling`
(keys `memory_bytes_after`, `history_bytes_after`, `history_bytes_added`) and aggregated
by `result.get_profiling_summary()`, so you can see how memory grows across a run.

## See also

- [Async execution](/carl/async/overview/#memory-isolation-under-parallelism) — the parallelism model.
- [Memory overview](/carl/memory/overview/)
