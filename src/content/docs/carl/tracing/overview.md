---
title: Tracing & Observability
description: ExecutionTrace as a per-step, per-agent record — inputs, model, prompt, measured timing, nested sub-traces — plus Gantt, HTML playback, aggregation, Langfuse and logging.
sidebar:
  order: 1
---

Every run builds an `ExecutionTrace` and attaches it to `result.trace`. It
records what each step received, which model served it, when it really ran,
and, for delegating steps, the trace of the nested chain. It serialises,
diffs and renders.

## What one event records

`trace.events` holds one `TraceEvent` per step:

| Field | Content |
| --- | --- |
| `step_number`, `step_title`, `step_type` | Identity. |
| `success`, `skipped`, `error_message` | Outcome. |
| `result`, `result_data` | Output (text clipped at 10 000 characters). |
| `execution_time`, `token_usage`, `batch_index` | Cost and scheduling. |
| `inputs` | The step's `input_mapping`, resolved just before its batch ran. Values are JSON-normalised and capped at 2 000 characters; unresolvable references are `None`; steps without `input_mapping` record `{}`. |
| `model` | The model that served the step (`None` for non-LLM steps). |
| `prompt` | The rendered prompt, clipped at 10 000 characters. **Opt-in**: only with `ReasoningContext(trace_prompts=True)`. |
| `started_at`, `ended_at` | Measured ISO-8601 UTC timestamps. |
| `sub_trace` | The full `ExecutionTrace` of the nested chain for handoff and supervisor steps. |

Prompts embed the outer context, history and memory reads, which is why
capture is off by default. A `sensitive=True` human-input step records neither
prompt nor inputs, and the memory key it wrote shows as `"[redacted]"` in the
inputs of later steps, whatever `trace_prompts` says.

This example runs offline with a stub client:

```python
import asyncio
from mmar_carl import (
    LLMClientBase, LLMStepDescription, ToolStepDescription, ToolStepConfig,
    ReasoningChain, ReasoningContext,
)

class StubLLM(LLMClientBase):
    @property
    def model_name(self): return "stub-model"
    async def get_response(self, prompt): return "Paris"
    async def get_response_with_retries(self, prompt, retries=3): return "Paris"

def lookup_weather(city: str) -> str:
    return f"sunny in {city}"

chain = ReasoningChain(steps=[
    LLMStepDescription(number=1, title="Pick city", aim="Name one city."),
    ToolStepDescription(number=2, title="Weather", dependencies=[1],
        config=ToolStepConfig(tool_name="lookup_weather",
                              input_mapping={"city": "$steps.1.result"})),
])

async def main():
    ctx = ReasoningContext(outer_context="Trip planning", api=StubLLM(), trace_prompts=True)
    ctx.register_tool("lookup_weather", lookup_weather)
    result = await chain.execute_async(ctx)
    for ev in result.trace.events:
        print(ev.step_number, ev.model, ev.inputs, ev.started_at, bool(ev.prompt))
    # 1 stub-model {} 2026-...+00:00 True
    # 2 None {'city': 'Paris'} 2026-...+00:00 False

asyncio.run(main())
```

## Gantt & HTML playback

```python
print(trace.format_gantt())                   # text Gantt
print(trace.format_gantt(format="mermaid"))
trace.to_html("playback.html")                # standalone animated HTML, no dependencies
```

The Gantt uses the measured `started_at` / `ended_at` when every event has
them, and falls back to the batch layout otherwise (older or hand-built
traces). `to_html()` also shows model, timing, prompt and a pane for nested
sub-traces; with no path it returns the HTML string.

## Persist & diff

```python
s = trace.to_json()
same = ExecutionTrace.from_json(s)            # also from_dict / TraceEvent.from_dict
diff = trace.diff(other_trace)                # dict describing structural differences
```

Trace JSON written before these fields existed still loads; missing fields
take defaults. Helpers: `get_event(n)`, `get_failed_events()`,
`get_skipped_events()`, `get_successful_events()`, `total_tokens()`.

## Aggregate across runs

`TraceAggregator` rolls up many traces into per-step latency percentiles
(`p50`, `p95`, `p99`, `mean`, `max` in ms) and token percentiles:

```python
from mmar_carl import TraceAggregator

agg = TraceAggregator([t1, t2, t3])
print(agg.format_text())
agg.latency_ms[1]   # {"p50": ..., "p95": ..., ...} for step 1
agg.tokens[1]
```

## Langfuse

Install `mmar-carl[langfuse]` and set `ENABLE_LANGFUSE=True`,
`LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` and optionally `LANGFUSE_HOST`
(default `https://cloud.langfuse.com`). Spans are then reported
automatically; `is_langfuse_enabled()` and `langfuse_flush()` are exported.

## Logging

```python
import logging
from mmar_carl import set_log_level, get_logger

set_log_level(logging.DEBUG)   # INFO by default
get_logger().info("Starting analysis")
```

## See also

- [Visualization](/carl/tracing/visualization/) — token pies, heatmaps, Mermaid.
- [Cost estimation](/carl/tracing/cost/) — dry-run spend projection.
- [Evolution](/carl/evolution/overview/) — `model` in traces attributes `MODEL_SWAP` results.
