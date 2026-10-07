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
context.ltm_retrieve("preferred_tone")   # exact-key lookup (None if absent)
context.recall("pricing", top_k=5)       # search, see below
```

`LTMBase` defines `store`, `retrieve`, `delete`, `keys`, `search` and
`clear`, all scoped by a `session_id` keyword. Two contexts with the same
`session_id` share one LTM scope.

`search()` / `recall()` is a **substring scan** in the built-in backends: an
entry matches when its JSON-serialised value contains the query (score `1.0`)
or contains it ignoring case (score `0.5`). It is not semantic search.
Override `search()` in your own `LTMBase` subclass to plug in a vector store.

```python
ctx = ReasoningContext(outer_context="...", api=client,
                       long_term_memory=InMemoryLTM(), session_id="u1")
ctx.long_term_memory.store("tone", "formal", session_id="u1")
ctx.recall("FORM")   # [{"key": "tone", "value": "formal", "score": 0.5}]
```

:::note
`recall()` raises if no `long_term_memory` is configured; `ltm_retrieve()` simply
returns `None`.
:::

## See also

- [Memory overview](/carl/memory/overview/)
- [Dynamic references](/carl/chains/dynamic-references/) — the `$ltm.*` syntax.
