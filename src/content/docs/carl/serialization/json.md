---
title: JSON Serialization
description: Save, load, and version chains as JSON.
sidebar:
  order: 1
---

Chains round-trip to JSON so you can persist, share, and reload them.

```python
chain.save("my_chain.json")                 # write to disk
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict();   ReasoningChain.from_dict(d)
s = chain.to_json();   ReasoningChain.from_json(s)
```

`from_dict` runs full validation (cycles, dependency references, reference-syntax
warnings).

## Typed vs legacy on load

`from_dict(data, use_typed_steps=False)` rebuilds legacy `StepDescription` objects
by default. Pass `use_typed_steps=True` (or use `from_dict_typed(data)`) to rebuild
the [typed step classes](/carl/steps/overview/) instead — preferred for new code.

## Versioning & compatibility

`to_dict()` stamps two fields:

- `format_version: int` — bumped when the wire shape changes.
- `carl_version: str` — informational (the `mmar-carl` version that wrote it).

The compatibility contract:

| Situation | Behaviour |
| --- | --- |
| **Read older** | A chain saved at `format_version = N` stays loadable on every CARL that ships `FORMAT_VERSION ≥ N`. |
| **Read newer** | A newer wire format raises `ChainFormatNewerError(required, this)` — MAESTRO catches it and prompts the user to upgrade. |
| **Unknown step type** | Fails loudly rather than silently dropping the step. |

## Runtime-only fields

Some fields are intentionally **not** serialized because they hold live objects:
`sub_chain` (handoff), `agents` (supervisor), `metrics`, `cache.key_fn`, and the
callbacks on `ReasoningContext`. Re-attach these in code after loading.

## Result serialization

Results round-trip too — persist an execution losslessly and reload it later
(this is what [`RunRecord`](/carl/care-integration/run-record/) wraps):

```python
result = chain.execute(context)

result.save("result.json")                 # lossless by default
loaded = ReasoningResult.load("result.json")

d = result.to_dict(full=True)              # full=True keeps every step's detail
ReasoningResult.from_dict(d)
s = result.to_json();  ReasoningResult.from_json(s)
```

Per-step results serialize individually via
`StepExecutionResult.to_dict(truncate=False)` / `from_dict` — `truncate` controls
whether long step outputs are clipped.

## See also

- [Migration: legacy → typed steps](/carl/serialization/migration/)
- [ReasoningChain](/carl/chains/overview/) · [RunRecord](/carl/care-integration/run-record/)
