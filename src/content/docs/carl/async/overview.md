---
title: Async Execution
description: Sync vs async, DAG parallelism, memory isolation, callbacks, timeouts, cancellation, pause and resume.
sidebar:
  order: 1
---

CARL is async at its core. A chain runs its steps through a DAG executor that
runs in parallel whatever the dependencies allow.

## Sync vs async

```python
result = chain.execute(context)              # synchronous wrapper
result = await chain.execute_async(context)  # inside async code
```

`execute()` wraps `execute_async()`. Called from inside a running event loop
(a notebook, an async test, a web handler) it warns and falls back to a
thread pool with a nested loop, which can deadlock on loop-bound clients. Use
`await chain.execute_async(...)` there, or pass `strict_async=True` to make
`execute()` raise instead of warn.

## DAG parallelism

The executor groups steps into **batches**: steps whose dependencies are done
run together; later batches wait only for what they depend on. `max_workers`
caps concurrency within a batch (default `3`; `"auto"` = batch size).

```python
chain = ReasoningChain(steps=steps, max_workers=4)   # or "auto"
```

```python
LLMStepDescription(number=1, title="Revenue", aim="...", dependencies=[])
LLMStepDescription(number=2, title="Costs",   aim="...", dependencies=[])     # runs with 1
LLMStepDescription(number=3, title="Profit",  aim="...", dependencies=[1, 2]) # waits for both
```

`chain.get_execution_plan()` shows the batches before you run.

## Memory isolation under parallelism

Each step in a batch runs on its own copy of the context. Memory is
copy-on-write: siblings don't see each other's writes; later batches do. After
the batch, each step's written and deleted keys are merged back in step
declaration order, so the step declared later wins on a same-key conflict.
Each successful step's history entry and newly registered tools are merged
too. Registered tools
are shared by reference and must be safe to call concurrently. See
[copy-on-write](/carl/memory/cow/).

`runtime_input` is copied into every step copy. The event bus and the pause
and cancel tokens are shared by reference, so one call on the original
context reaches all running steps, and a `wait` step can see an event that a
sibling emits in the same batch.

## Monitoring callbacks

Set callbacks on the `ReasoningContext`:

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    on_step_start=lambda num, title: print(f"start {num}: {title}"),
    on_step_complete=lambda r: print(f"done {r.step_number}: {r.success}"),
    on_progress=lambda done, total: print(f"{done}/{total}"),
    on_llm_chunk=lambda chunk: print(chunk, end=""),   # token streaming
)
```

| Callback | Signature |
| --- | --- |
| `on_step_start` | `(step_number, step_title)` |
| `on_step_complete` | `(StepExecutionResult)` |
| `on_chain_complete` | `(ReasoningResult)` |
| `on_progress` | `(completed, total)` |
| `on_llm_chunk` | `(chunk)` or `(chunk, *, step_number, stage)` — CARL inspects the signature. |
| `on_step_event` | `(step_number, event_type, payload)` — fine-grained events such as `debate.turn_argument`, `parallel_sampling.sample`, `supervisor.route_selected`. Exceptions inside it are logged and swallowed. |
| `on_human_input_requested` | `async (HumanInputRequest) -> HumanInputResponse` — the provider for [human-input steps](/carl/orchestration/human-in-the-loop/). |
| `on_command_approval_requested` | `(CommandApprovalRequest) -> bool` — approval for [command steps](/carl/steps/command/); without it, commands that need approval are denied. |

## Timeouts

- **Chain**: `ReasoningChain(..., timeout=60.0)`. Counts active time only;
  idle time in an acknowledged pause is excluded.
- **Step**: `LLMStepDescription(..., timeout=30.0)` or `LLMStepConfig.timeout`;
  tool steps use `ToolStepConfig.timeout` (default 30 s); other step types
  have their own bounds in their configs.

## Fail-fast, cancel, pause

| Control | Call | Effect |
| --- | --- | --- |
| Fail-fast | `ReasoningChain(fail_fast=True)` | After the first final failure no new step starts; the rest are skipped. |
| Cancel | `context.cancel()` | Running steps stop cooperatively; unstarted steps are skipped with `error_message="cancelled by user"`. Wakes a paused run. |
| Pause | `context.request_pause()` | No queued step starts; running steps finish. `is_paused()` turns `True` once nothing is active. |
| Resume | `context.clear_pause()` | Continues without re-running completed steps. |

Details, including `result.metadata["fail_fast"]` and the difference between
`is_pause_requested()` and `is_paused()`: [run controls](/carl/chains/run-controls/).

## Resume in another process

`ReasoningContext.snapshot()` captures history, memory, metadata and the
cancel state as a `ContextSnapshot` (framework-internal `__` metadata keys
are dropped). Later:

```python
result = await chain.execute_async(new_context, resume_from=snapshot)
```

Steps completed in the snapshot are skipped. Host authority objects
(`CommandPolicy`, `NetworkEnforcer`, …) are not in the snapshot; the new
context must get them from the host again.

## See also

- [Streaming](/carl/async/streaming/) — partial results with `stream_async`.
- [Run controls](/carl/chains/run-controls/)
