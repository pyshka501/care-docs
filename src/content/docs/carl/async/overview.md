---
title: Async Execution
description: Sync vs async, DAG parallelism, memory isolation, callbacks, timeouts, and resume.
sidebar:
  order: 1
---

CARL is async at its core. A chain runs its steps through a DAG executor that
parallelises everything dependencies allow.

## Sync vs async

```python
result = chain.execute(context)              # synchronous wrapper
result = await chain.execute_async(context)  # async (use inside async code)
```

`execute()` is a thin synchronous wrapper around `execute_async()`. Use the async
form inside an event loop (web servers, TUIs, notebooks); use the sync form in
scripts.

## DAG parallelism

The executor groups steps into **batches** by dependency: steps with no unmet
dependencies run first and in parallel; later batches wait only for what they
depend on. Control concurrency with `max_workers`:

```python
chain = ReasoningChain(steps=steps, max_workers=4)   # or "auto"
```

```python
LLMStepDescription(number=1, title="Revenue", dependencies=[])
LLMStepDescription(number=2, title="Costs",   dependencies=[])   # runs with 1
LLMStepDescription(number=3, title="Profit",  dependencies=[1, 2])  # waits for both
```

## Memory isolation under parallelism

During parallel execution each step gets a **copy-on-write** view of memory.
Writes from parallel siblings are **not** visible to each other — only to
subsequent batches. Tools shared across parallel steps must be **stateless**.

## Monitoring callbacks

Set callbacks on the `ReasoningContext` to observe a run:

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    on_step_start=lambda num, title: print(f"▶ step {num}: {title}"),
    on_step_complete=lambda r: print(f"✓ step {r.step_number}: {r.success}"),
    on_progress=lambda done, total: print(f"{done}/{total}"),
    on_llm_chunk=lambda chunk: print(chunk, end=""),   # token streaming
)
```

| Callback | Signature |
| --- | --- |
| `on_step_start` | `(step_number, step_title)` |
| `on_step_complete` | `(StepExecutionResult)` |
| `on_progress` | `(completed, total)` |
| `on_llm_chunk` | `(chunk)` or `(chunk, *, step_number, stage)` |

## Timeouts

- **Chain-level**: `ReasoningChain(..., timeout=60.0)`.
- **Per-step**: `LLMStepDescription(..., timeout=30.0)` or via `LLMStepConfig.timeout`; tool steps use `ToolStepConfig.timeout` (default 30 s).

## Pause & resume

`execute_async(context, resume_from=snapshot)` restores a prior
`ContextSnapshot` (history / memory / metadata / cancel state) and skips steps
already completed in that snapshot — the cross-process resume primitive used by
CARE. Pair it with `ReasoningContext.snapshot()`.

## See also

- [Streaming execution](/carl/async/streaming/) — render partial progress with `stream_async`.
