---
title: RunRecord
description: A durable, replayable record of one chain execution.
sidebar:
  order: 3
---

A `RunRecord` bundles one execution into a single JSON-serialisable object:
the chain snapshot, the input, the full result and the timing. Maestro's
`maestro replay` command reads such files back (see
[generate & run](/care/cli/generate-run/)).

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

`from_run` stores `chain.to_dict()`, captures `outer_context` and memory plus
the context metadata (dropping framework-internal `__`-prefixed keys), and
sets `finished_at` to now if you don't pass it.

## Fields

| Field | Meaning |
| --- | --- |
| `chain_id` / `chain_version` | Identity of the executed chain (optional). |
| `chain_dict` | The serialized chain. Subject to the same limits as [JSON serialization](/carl/serialization/json/#what-is-not-serialized). |
| `input` | `outer_context`, `memory` and `context_metadata` the run started from. |
| `result` | The `ReasoningResult`, serialized in full form. |
| `started_at` / `finished_at` | Timestamps. |
| `runtime_info` | Library version and environment info. |

:::note
`input` does not include `runtime_input`. A host that runs chains with
structured input (as Maestro does) has to store that input itself if it wants
to re-run the record with the same data.
:::

## Persist & reload

```python
record.save("runs/run-001.json")
loaded = RunRecord.load("runs/run-001.json")

d = record.to_dict();  RunRecord.from_dict(d)
s = record.to_json();  RunRecord.from_json(s)
```

## In Maestro

The desktop app keeps its own execution receipts (chain and input digests,
a bounded per-step preview) rather than `RunRecord` files; see
[Runs](/care/app/runs/). `maestro replay` accepts a `RunRecord` file as well
as a bare `ReasoningResult`.

## See also

- [Result serialization](/carl/serialization/json/#result-serialization)
- [Maestro integration overview](/carl/care-integration/overview/)
