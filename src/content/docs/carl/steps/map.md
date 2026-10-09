---
title: Map Step
description: Call one registered tool for every item of a JSON array, with bounded concurrency and per-item timeouts, and collect every outcome in input order.
sidebar:
  order: 18
---

`MapStepDescription` takes a JSON array from the context and calls one registered tool
once per element. Calls run in parallel up to a limit. Every item gets its own outcome,
and the step returns all of them in input order. Its behaviour is set by
`MapStepConfig`. The step makes no LLM call.

Map is a data-parallel step over one fixed operation. It is not a general loop, a
router or a way to change the graph at run time.

## Minimal example

```python
import asyncio
import json

from mmar_carl import (
    MapStepConfig,
    MapStepDescription,
    ReasoningChain,
    ReasoningContext,
)


async def score(item: dict, index: int, threshold: int) -> dict:
    if item["value"] < 0:
        raise ValueError("negative value")
    await asyncio.sleep(0.01 * (3 - index))  # later items finish first
    return {"name": item["name"], "pass": item["value"] >= threshold}


async def main() -> None:
    rows = [
        {"name": "alpha", "value": 7},
        {"name": "beta", "value": -1},
        {"name": "gamma", "value": 3},
    ]
    context = ReasoningContext(outer_context=json.dumps(rows), api=None)
    context.memory_write("threshold", 5, namespace="input")
    context.register_tool("score", score)

    chain = ReasoningChain(steps=[
        MapStepDescription(
            number=1,
            title="Score rows",
            config=MapStepConfig(
                items_source="$outer_context",
                tool_name="score",
                item_parameter="item",
                index_parameter="index",
                input_mapping={"threshold": "$memory.input.threshold"},
                max_items=100,
                max_concurrency=2,
                item_timeout_seconds=1,
                output_memory_key="scores",
            ),
        ),
    ])

    result = await chain.execute_async(context)
    step = result.step_results[0]
    outcome = step.as_map_outcome()
    print(step.success, step.error_message)
    print(outcome.total_items, outcome.completed_items, outcome.failed_items)
    for item in outcome.items:
        print(item.index, item.status.value, item.output, item.error_message)
    print(context.memory_read("scores", namespace="map")["completed_items"])


asyncio.run(main())
```

Output:

```text
False MapStep completed with 1 non-completed item(s)
3 2 1
0 completed {'name': 'alpha', 'pass': True} None
1 failed None negative value
2 completed {'name': 'gamma', 'pass': False} None
2
```

CARL also logs a `UserWarning` because no earlier step writes
`$memory.input.threshold`; here the value was written before the run.

One item failed, so the step is not successful. The other two items still ran, and
the aggregate with all three outcomes was still written to memory.

Another runnable example is
[`examples/orchestration/map_step_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/map_step_example.py).

## Fields

`MapStepConfig`:

| Field | Type | Default | Rules |
| --- | --- | --- | --- |
| `items_source` | `str` | required | Reference that must resolve to a JSON array. Allowed forms: exactly `$outer_context`, or `$memory.*`, `$steps.*`, `$metadata.*`, `$event.*`. Anything else (`$history`, literals) is rejected. |
| `tool_name` | `str` | required | Registered tool called once per item. Non-blank. |
| `item_parameter` | `str` | `"item"` | Keyword argument that receives the current element. Must be a valid Python identifier and not a keyword. |
| `index_parameter` | `str \| None` | `None` | Optional keyword argument that receives the zero-based input index. Same rules; must differ from `item_parameter`. |
| `input_mapping` | `dict[str, str]` | `{}` | Shared keyword arguments. Keys follow the same identifier rules; values use the same reference forms as `items_source`. Keys may not reuse `item_parameter` or `index_parameter`. |
| `max_items` | `int` | `1000` | `>= 1`. A longer array fails the step before any call. |
| `max_concurrency` | `int` | `8` | `1..256`. Maximum calls running at once. |
| `item_timeout_seconds` | `float` | `30.0` | `> 0` and finite. Applies to each item separately. |
| `output_memory_key` | `str \| None` | `None` | Key for the aggregate outcome. Non-blank. |
| `output_namespace` | `str` | `"map"` | Memory namespace for `output_memory_key`. Non-blank. |

When `items_source` is `$outer_context` and the outer context is a JSON string, it is
parsed first, as in the example.

## How it runs

1. **Resolve once.** `items_source` and every `input_mapping` value are resolved
   once, before any call. Both must be JSON-compatible; they are copied through JSON,
   so items never share mutable objects with CARL memory.
2. **Check bounds.** A non-array source, a non-JSON value, more than `max_items`
   elements, or an unregistered tool fails the whole step. No tool is called.
3. **Fan out.** For each element, CARL calls the tool with the shared arguments plus
   `item_parameter=<element>` and, if set, `index_parameter=<index>`. Async tools are
   awaited; sync tools run in a worker thread. At most `max_concurrency` calls are
   active.
4. **Collect all.** Each call ends as `completed`, `failed`, `timed_out` or
   `cancelled`. One failure does not stop the siblings. A result that is not
   JSON-serializable makes that item `failed` with `error_type="NonJsonResult"`.
5. **Aggregate.** Outcomes are sorted by input index, not by completion order. The
   aggregate is written to memory once, if `output_memory_key` is set, **even when
   some items failed**.

An empty array succeeds without calling the tool.

## Result

Read the typed outcome with `StepExecutionResult.as_map_outcome()`. It returns a
`MapOutcome`:

| Field | Meaning |
| --- | --- |
| `items` | `list[MapItemOutcome]` in input order. |
| `total_items` | Number of items. |
| `completed_items`, `failed_items`, `timed_out_items`, `cancelled_items` | Counts per status. They always add up to `total_items`. |
| `max_concurrency` | The configured bound. |
| `enforcement_gaps` | Known limits hit during the run (see below). |

Each `MapItemOutcome` has:

| Field | Meaning |
| --- | --- |
| `index` | Zero-based input index. |
| `status` | `MapItemStatus`: `completed`, `failed`, `timed_out` or `cancelled`. |
| `success` | `True` exactly when `status` is `completed`. |
| `output` | JSON result. Only for `completed`. |
| `error_type`, `error_message` | Required for every other status, for example `ValueError`, `TimeoutError`, `CancelledError`, `NonJsonResult`. |
| `execution_time` | Seconds for this item. |

The step succeeds only when **every** item is `completed` (an empty array counts). In
all other cases `success=False` and `error_message` is
`MapStep completed with N non-completed item(s)`. The aggregate JSON is still in
`result` and `result_data`, and a history entry is still added.

`cancelled` is used only for host cancellation of the run. Cancellation stops items
that have not started and cancels running async calls. Every item still gets an
outcome. If the run was cancelled, the step result has `skipped=True`.

### Memory when items fail

A failed step normally contributes no memory changes. Map is the exception: when it
runs in a parallel batch and some items fail, the executor still commits the one
aggregate under `output_namespace` / `output_memory_key`, and nothing else from that
step's snapshot.

## Limits

- **Sync tools cannot be killed.** After a timeout or cancellation, a sync tool keeps
  running in its thread. The aggregate records this in `enforcement_gaps`, for
  example `sync tool 'check' may continue after timeout`. Use async tools when you
  need real cancellation.
- **Not in V1:** retries, filter, reduce, fail-fast, per-item memory writes,
  per-item tool choice, nested chains or graph changes.
- **`cache` is not rejected** on this step. A cache hit returns the stored aggregate
  without calling the tool and without writing `output_memory_key`. See
  [caching](/carl/steps/caching/).

## Preflight and serialization

- `ReasoningChain.required_tools()` includes `tool_name`, so
  [preflight](/carl/care-integration/preflight/) reports a missing tool in
  `missing_tools`.
- The wire type is `"map"`. It entered the chain format at `format_version` 8.
  Chains saved by CARL 0.5.0 carry `format_version` 11. See
  [migration](/carl/serialization/migration/).
- The full config round-trips through `to_dict()` / `from_dict()`.
- `ChainBuilder` has no `add_map_step` helper. Build `MapStepDescription` directly.

## See also

- [Tool step](/carl/steps/tool/): one call of one tool.
- [Agent step](/carl/steps/agent/): the model decides which tools to call.
- [Parallel sampling](/carl/orchestration/parallel-sampling/): run one LLM step many
  times.
- [Loops](/carl/steps/loops/) for sequential iteration.
- [Dynamic references](/carl/chains/dynamic-references/).
