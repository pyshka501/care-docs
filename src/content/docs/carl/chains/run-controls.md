---
title: Run Controls
description: Fail-fast scheduling, acknowledged pause and resume, cancellation, and the chain timeout.
sidebar:
  order: 5
---

A host (a UI, a job runner, Maestro) often needs to stop or hold a chain while it
runs. CARL gives four controls: `fail_fast`, pause/resume, cancel, and the chain
`timeout`. All of them act at step boundaries: a step that has already started
runs to its own end or to its timeout.

## Fail-fast

By default a failed step does **not** stop the chain. Independent steps keep
running, and so do steps that depend on the failed one: they see whatever the
failed step left (often nothing). This is the historical behaviour.

Turn on `fail_fast` to stop scheduling after the first final failure:

```python
chain = ReasoningChain(steps=steps, max_workers=4, fail_fast=True)

# or
chain = ChainBuilder()...with_fail_fast().build()

# or directly
DAGExecutor(fail_fast=True)
```

With `fail_fast=True`:

- after a step fails **for good** (its own retries and fallbacks are used
  first), no new step starts;
- steps already running finish;
- every step that did not start is reported as skipped
  (`StepExecutionResult.skipped=True`);
- the chain result has `success=False`, and `result.metadata["fail_fast"]` says
  what happened:

```python
{
    "enabled": True,
    "triggered": True,
    "failed_step_number": 1,
    "skipped_step_numbers": [3, 2],
}
```

Rules and limits:

- `fail_fast` must be a `bool`. With `fail_fast=True`, `max_workers` must be a
  positive `int` or `"auto"`.
- Fail-fast wins over loops and chain-level RE-PLAN: a failure stops the run
  instead of looping back or re-planning.
- External side effects of completed steps are **not** rolled back.
- `fail_fast` is written by `to_dict()` and read by `from_dict()`.
- An unexpected exception inside a step executor becomes a failed step result
  (with `error_traceback`), not a crash of the run.

## Pause and resume

Pause is **acknowledged**: asking for a pause and being paused are different
states.

```python
task = asyncio.create_task(chain.execute_async(context))

context.request_pause()
context.is_pause_requested()   # True right away
context.is_paused()            # False while a step is still running
# ... the running step finishes, the scheduler waits ...
context.is_paused()            # True: nothing is running

context.clear_pause()          # resume
result = await task
```

- `request_pause()` sets the request. Queued steps check it before they start.
  Running steps (an LLM call, a tool) finish normally.
- `is_paused()` is `True` only when a pause was requested, the scheduler is
  waiting, and no step is active. Use it to show "Paused" in a UI.
- `clear_pause()` resumes. Completed steps are **not** replayed.
- `paused_duration()` returns the accumulated idle pause time in seconds.
- `wait_for_resume()` is the awaitable the executor uses; custom executors can
  use it too.
- Parallel snapshot contexts share one pause token, so one call reaches the whole
  batch.

## Cancel

```python
from mmar_carl import ExecutionCancelledError

task = asyncio.create_task(chain.execute_async(context))
context.cancel()
try:
    await task
except ExecutionCancelledError as exc:
    partial = exc.result          # ReasoningResult with completed steps
```

- `cancel()` requests cancellation and also wakes a paused run, so a paused chain
  can be cancelled without resuming first.
- Steps that have not started are skipped; running steps finish.
- The run raises `ExecutionCancelledError`. Its `result` holds the partial
  `ReasoningResult` (`success=False`).
- `is_cancelled()` (alias `is_cancellation_requested()`) and
  `await wait_for_cancellation()` let long-running tools and custom executors
  stop early. [Chain tools](/carl/steps/chain-tools/), for example, cancel their
  nested run.
- `reset_cancellation()` clears the flag before reusing a context.

## Timeouts

| Level | Where | What happens |
| --- | --- | --- |
| Chain | `ReasoningChain(timeout=...)`, `ChainBuilder.with_timeout()` | Checked before each batch starts. When the **active** time is over the limit, the run raises `TimeoutError` (`Chain execution timed out after …s. Completed k/n steps.`). Idle pause time is not counted. |
| LLM step | `LLMStepDescription.timeout`, `LLMStepConfig.timeout` | Per call. |
| Tool step | `ToolStepConfig.timeout` (default `30.0`) | Per tool call; fallbacks via `ToolErrorRecovery.on_timeout`. |
| Agent and runtime steps | their own config | E.g. `AgentStepConfig.timeout_seconds`, `ClaudeCodeStepConfig.timeout`, `CodexStepConfig.timeout`, `ChainToolDefinition.timeout_seconds`, command and code runtime limits. |

The chain `timeout` also acts as a **per-step** limit: the executor wraps each
step in `asyncio.wait_for(step.timeout or chain.timeout)`. A step that runs
longer fails with `Step timed out after …s`; it does not raise. Only LLM and
command-plan steps (and the legacy `StepDescription`) carry a step-level
`timeout` field, so for other step types the chain value is the cap. Tool and agent steps also apply their own config timeouts inside.

## See also

- [ReasoningChain](/carl/chains/overview/) · [Async execution](/carl/async/overview/)
- [Human-in-the-loop](/carl/orchestration/human-in-the-loop/): waiting for a person is a step, not a pause.
