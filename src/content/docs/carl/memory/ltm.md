---
title: Long-Term Memory
description: Persist values across runs and sessions with an LTM backend.
sidebar:
  order: 3
---

Short-term memory lives for one run. **Long-term memory (LTM)** persists across
runs and sessions. Wire a backend into the context via `long_term_memory=`:

```python
from mmar_carl import ReasoningContext, InMemoryLTM, JsonFileLTM

context = ReasoningContext(
    outer_context=data,
    api=client,
    long_term_memory=JsonFileLTM("ltm.json"),   # or InMemoryLTM()
    session_id="user-42",                         # scopes LTM entries
)
```

## Backends

| Backend | Persistence |
| --- | --- |
| `InMemoryLTM` | In-process only (lost on exit). Good for tests. |
| `JsonFileLTM("path.json")` | Persisted to a JSON file across runs. |

Both implement `LTMBase` — subclass it to back LTM with your own database.

## Using it

From a step, read an LTM value with the [`$ltm.key`](/carl/chains/dynamic-references/)
reference. Programmatically:

```python
context.ltm_retrieve("preferred_tone")              # exact-key lookup (None if absent)
context.recall("past decisions about pricing", top_k=5)  # similarity search
```

`LTMBase` defines `store`, `retrieve`, `delete`, `search`, and `clear` — all
session-scoped via the `session_id` keyword (defaults to the context's
`session_id`).

:::note
`recall()` raises if no `long_term_memory` is configured; `ltm_retrieve()` simply
returns `None`.
:::

## See also

- [Memory overview](/carl/memory/overview/)
- [Dynamic references](/carl/chains/dynamic-references/) — the `$ltm.*` syntax.
