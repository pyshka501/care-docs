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
| `on_step_event` | `(step_number, event_type, payload)` — fine-grained step lifecycle events. |
| `on_human_input_requested` | fired when a [human-input step](/carl/orchestration/human-in-the-loop/) pauses for input. |

## Timeouts

- **Chain-level**: `ReasoningChain(..., timeout=60.0)`.
- **Per-step**: `LLMStepDescription(..., timeout=30.0)` or via `LLMStepConfig.timeout`; tool steps use `ToolStepConfig.timeout` (default 30 s).

## Cancellation

Cancel a run cooperatively from another task (e.g. a UI "stop" button):

```python
context.cancel()          # request cancellation
context.is_cancelled()    # check the flag
context.reset_cancellation()  # clear it before reusing the context
```

A cancelled step is marked `skipped=True` with `error_message="cancelled by user"`,
and partial outputs already produced are surfaced on the result. Steps that haven't
started are skipped. `ExecutionCancelledError` is the related exported exception.

## Pause & resume

For a stop-and-continue-later flow, the pause side produces a snapshot:

```python
context.request_pause()        # ask the run to pause at the next safe point
context.is_pause_requested()
await context.wait_for_resume()  # (inside a step) block until resumed
context.clear_pause()
```

Then `execute_async(context, resume_from=snapshot)` restores a prior
`ContextSnapshot` (history / memory / metadata / cancel state) and skips steps
already completed in that snapshot — the cross-process resume primitive used by
MAESTRO. Pair it with `ReasoningContext.snapshot()`. For human-in-the-loop steps,
`context.provide_human_input(value)` supplies the awaited answer.

## See also

- [Streaming execution](/carl/async/streaming/) — render partial progress with `stream_async`.
