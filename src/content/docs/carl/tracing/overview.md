---
title: Tracing & Observability
description: The execution trace, Gantt charts, HTML playback, aggregation, and Langfuse.
sidebar:
  order: 1
---

Every run builds a structured `ExecutionTrace` automatically, attached to
`result.trace`. It's serialisable, diffable, and replayable.

```python
result = chain.execute(context)
trace = result.trace
```

## Gantt & HTML playback

```python
print(trace.format_gantt())              # text Gantt (parallel-batch aware)
print(trace.format_gantt(format="mermaid"))

trace.to_html("playback.html")           # standalone animated HTML/JS (zero deps)
```

`to_html()` writes a self-contained file (inline CSS+JS) you can drop into a PR
description; with no path it returns the HTML string.

## Persist & diff

```python
trace.to_json()                          # serialise (also: from_json)
diff = trace.diff(other_trace)           # structural diff between two runs
```

## Aggregate across runs

`TraceAggregator` rolls up many traces — per-step latency percentiles
(`p50/p95/p99/mean/max`) and token usage (`p50/p95`) — to catch tail-latency
outliers after a batch:

```python
from mmar_carl import TraceAggregator

agg = TraceAggregator([t1, t2, t3])
```

## Langfuse

For a hosted tracing dashboard, set `LANGFUSE_PUBLIC_KEY` (and secret) in the
environment — CARL's `tracing.py` integration reports spans automatically
(install `mmar-carl[langfuse]`).

## Logging

```python
import logging
from mmar_carl import set_log_level, get_logger

set_log_level(logging.DEBUG)   # INFO by default
get_logger().info("Starting analysis")
```

| Level | When |
| --- | --- |
| `DEBUG` | Development — detailed flow. |
| `INFO` | Production — chain start/complete (default). |
| `WARNING` | Failed steps. |
| `ERROR` | Critical errors. |

## See also

- [Visualization](/carl/tracing/visualization/) — token pies, heatmaps, Mermaid.
- [Cost estimation](/carl/tracing/cost/) — dry-run spend projection.
