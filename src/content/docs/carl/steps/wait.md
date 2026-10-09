---
title: Wait Step
description: Pause one branch of a running chain until a timer fires or a named event arrives, without blocking the event loop.
sidebar:
  order: 17
---

`WaitStepDescription` waits inside the running CARL process. It completes when its
condition is met: a relative timer, an absolute time, a named event, or the first of
several of these. Its behaviour is set by `WaitStepConfig`. The step makes no LLM or
tool call.

The wait is asynchronous. It does not block the event loop, does not hold a worker
thread, and does not poll. Other steps in the same parallel batch keep running.

:::caution[Process-local only]
The wait lives only in the current process. If the process exits, the wait is lost.
There is no persistence, scheduler, resume API or exactly-once delivery. A wait that
must survive a restart has to be built in the host application.
:::

## Minimal example

A sync tool loads data and emits `data_ready`. A wait step in the same parallel batch
wakes on that event, or gives up after 5 seconds.

```python
import asyncio
import time

from mmar_carl import (
    AfterWaitCondition,
    AnyOfWaitCondition,
    EventWaitCondition,
    ReasoningChain,
    ReasoningContext,
    ToolStepConfig,
    ToolStepDescription,
    WaitStepConfig,
    WaitStepDescription,
)

context = ReasoningContext(outer_context="", api=None)


def load_data() -> str:
    # A sync tool runs in a worker thread; emit_event is safe from there.
    time.sleep(0.2)
    context.emit_event("data_ready", {"rows": 3})
    return "loaded"


context.register_tool("load_data", load_data)

chain = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Load data",
        config=ToolStepConfig(tool_name="load_data"),
    ),
    # No dependency on step 1: both steps run in the same parallel batch.
    WaitStepDescription(
        number=2,
        title="Wait for data or give up",
        config=WaitStepConfig(
            condition=AnyOfWaitCondition(conditions=[
                EventWaitCondition(name="data_ready"),
                AfterWaitCondition(seconds=5),
            ]),
            output_memory_key="data_wait",
        ),
    ),
])

result = asyncio.run(chain.execute_async(context))
outcome = result.step_results[1].as_wait_outcome()
print(outcome.trigger, outcome.condition_index, outcome.name, outcome.payload)
print(round(outcome.elapsed_seconds, 1))
print(context.memory_read("data_wait", namespace="wait")["trigger"])
```

Output:

```text
event 0 data_ready {'rows': 3}
0.2
event
```

## Fields

`WaitStepConfig`:

| Field | Type | Default | Rules |
| --- | --- | --- | --- |
| `condition` | `WaitCondition` | required | One of the four condition models below. |
| `output_memory_key` | `str \| None` | `None` | If set, the outcome is written under this key in the `wait` memory namespace. Stripped; blank is rejected. |

The namespace is always `wait`; it is not configurable.

### Conditions

`WaitCondition` is a Pydantic union tagged by `type`. In JSON you write the tag
explicitly, for example `{"type": "after", "seconds": 60}`.

| Model | `type` | Field | Validation | Completes |
| --- | --- | --- | --- | --- |
| `AfterWaitCondition` | `"after"` | `seconds: float` | `>= 0` and finite. | After `seconds`. `0` completes at once. |
| `AtWaitCondition` | `"at"` | `timestamp: datetime` | Must be timezone-aware; naive datetimes are rejected. | At that moment. A time in the past completes at once. |
| `EventWaitCondition` | `"event"` | `name: str` | Stripped; empty is rejected. | When an event with that name exists in the context. |
| `AnyOfWaitCondition` | `"any_of"` | `conditions: list` | At least 2 items. Items must be `after`, `at` or `event`; nested `any_of` is rejected. | When the first listed condition completes. |

`AllOf`, callables as conditions and nested compositions are not supported.

## Events

Events go through the existing `context.emit_event(name, payload)` API. The same events
drive `triggered_by` on steps and the `$event.<name>` reference.

- **Level-triggered.** An event that was emitted before the wait started completes the
  wait at once.
- **Broadcast, not consumed.** Every waiter on the same name wakes. Later waiters see
  the event too.
- **Last value wins.** Emitting the same name again replaces the payload.
- **Shared across parallel snapshots.** Steps in one parallel batch run on context
  snapshots, but all snapshots share one event bus. A sibling step can wake a waiter
  in the same batch.
- **Safe from threads.** `emit_event` can be called from a sync tool running in a
  worker thread. Wake-ups are passed back to the waiter's event loop.
- **Immediate and not rolled back.** The event is visible as soon as it is emitted,
  even before the emitting step finishes. If that step later fails, the event stays.
  Emit only after your work is committed if you need that guarantee.
- **Payload must be JSON.** If a waited-for payload is not JSON-serializable, the wait
  step fails with `WaitStep event payload must be JSON-compatible`.

## Result

Read the typed outcome with `StepExecutionResult.as_wait_outcome()`. It returns a
`WaitOutcome`:

| Field | Meaning |
| --- | --- |
| `trigger` | `"after"`, `"at"` or `"event"`: which leaf condition completed. |
| `elapsed_seconds` | Monotonic time from step start. |
| `condition_index` | For `any_of`: index of the winning condition. `None` for a single condition. |
| `seconds` | Set for `after`. |
| `timestamp` | Set for `at` (ISO 8601 string). |
| `name`, `payload` | Set for `event`. |

On success `result` is the same outcome as sorted JSON, and one history entry is added.

When several `any_of` conditions are ready in the same event-loop turn (for example two
zero-length timers, or an event that was already emitted), the one listed **first**
wins.

A successful wait is the only success. Cancellation never looks like a fired trigger:
if the run is cancelled, the step returns the normal cancelled result
(`skipped=True`), even when the condition completed in the same turn.

## Failure modes and limits

- **No built-in timeout.** A bare `event` wait waits until the event arrives, the run
  is cancelled, or a chain-level timeout stops the run. Pair an event with an `after`
  timer in `any_of` when you need a deadline. The timeout branch is a normal success
  with `trigger="after"`; branch on it downstream.
- **Timers are in-process.** `at` computes the delay once from the current UTC time;
  it is not a wall-clock alarm and does not survive a restart.
- **Non-JSON payloads** fail the step, as above.
- **`cache` is not rejected** on this step. A cache hit returns the stored outcome
  without waiting and without writing `output_memory_key`. You almost never want
  this for a wait. See [caching](/carl/steps/caching/).

## Serialization

- The wire type is `"wait"`. It entered the chain format at `format_version` 5.
  Chains saved by CARL 0.5.0 carry `format_version` 11. See
  [migration](/carl/serialization/migration/).
- The full config round-trips through `to_dict()` / `from_dict()`.
- `ChainBuilder` has no `add_wait_step` helper. Build `WaitStepDescription` directly.

## See also

- [The event bus](/carl/orchestration/overview/#the-event-bus) and `triggered_by`.
- [Run controls](/carl/chains/run-controls/): pause, resume, cancel and timeouts.
- [Human-in-the-loop](/carl/orchestration/human-in-the-loop/) for waiting on a person.
- [Map step](/carl/steps/map/).
