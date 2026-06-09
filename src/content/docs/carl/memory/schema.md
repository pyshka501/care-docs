---
title: Memory Schema
description: Validate memory writes against a type schema to catch wiring bugs early.
sidebar:
  order: 4
---

Pass a `memory_schema` to the context to type-check memory writes. When a step
writes to a declared `(namespace, key)` pair with the wrong type, CARL raises a
`MemorySchemaError` instead of silently storing bad data.

```python
from mmar_carl import ReasoningContext

context = ReasoningContext(
    outer_context=data,
    api=client,
    memory_schema={
        "results": {
            "score": float,
            "label": str,
            "tags": (list, tuple),   # a tuple of types = a union
        },
    },
)
```

## How it works

- The schema is `{namespace: {key: type_spec}}`.
- On every `memory_write` / `memory_append` to a **declared** pair, CARL runs
  `validate_memory_write` and raises `MemorySchemaError` (a `TypeError` subclass)
  on a mismatch.
- Pairs **not** in the schema pass through unchecked — you only validate what you
  declare.
- `type_spec` can be a single type or a tuple of types (a union).

This pairs well with the pre-execution check that warns when a step reads a
`$memory.*` key no prior step writes — together they catch most memory wiring
bugs before they cost you an LLM call.

## See also

- [Memory overview](/carl/memory/overview/)
- [Memory steps](/carl/steps/memory/)
