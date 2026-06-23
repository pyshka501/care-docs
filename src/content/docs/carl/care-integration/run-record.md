---
title: RunRecord
description: A durable, replayable record of one chain execution.
sidebar:
  order: 3
---

A `RunRecord` bundles everything about one execution — the chain snapshot, the
input, the (lossless) result, and timing — into a single JSON-serialisable record.
It's what MAESTRO stores as run history and what [`care replay`](/care/cli/generate-run/)
reads back.

## Capture a run

```python
from datetime import datetime, timezone
from mmar_carl import RunRecord

started = datetime.now(timezone.utc)
result = await chain.execute_async(context)

record = RunRecord.from_run(
    chain=chain,
    context=context,
    result=result,
    started_at=started,
    chain_id="my-chain",        # optional
    chain_version="v3",         # optional
)
```

`from_run` snapshots `chain.to_dict()`, captures `outer_context` + memory +
context metadata (dropping framework-internal `__`-prefixed keys), and stamps
`finished_at = now()` if you don't pass one.

## Fields

| Field | Meaning |
| --- | --- |
| `chain_id` / `chain_version` | Identity of the executed chain (optional). |
| `chain_dict` | The full serialized chain (durable snapshot). |
| `input` | `{outer_context, memory}` the run started from. |
| `result` | The lossless `ReasoningResult`. |
| `started_at` / `finished_at` | Timestamps. |
| `runtime_info` | Library version + environment info. |

## Persist & reload

```python
record.save("runs/run-001.json")
loaded = RunRecord.load("runs/run-001.json")

d = record.to_dict();  RunRecord.from_dict(d)
```

Then step through it with [`care replay run-001.json`](/care/cli/generate-run/).

## See also

- [Result serialization](/carl/serialization/json/#result-serialization) — the `ReasoningResult` inside a record.
- [MAESTRO integration overview](/carl/care-integration/overview/)
