---
title: Record & Replay
description: Record LLM responses once, then replay deterministically with zero API calls.
sidebar:
  order: 3
---

Cassette wrappers let you record real LLM responses once and replay them
deterministically — perfect for tests and notebooks that must run offline and fast.

## Record

Wrap a real client; every response is written to a JSONL cassette:

```python
from mmar_carl import (
    RecordingLLMClient, OpenAICompatibleClient, OpenAIClientConfig, ReasoningContext,
)

real = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1", api_key="sk-or-v1-...", model="qwen/qwen3-coder",
))
rec = RecordingLLMClient(real, "cassette.jsonl", overwrite=True)

ctx = ReasoningContext(outer_context="...", api=rec)
await chain.execute_async(ctx)   # makes real calls, records them
```

## Replay

Swap in the player — no API key, no network:

```python
from mmar_carl import PlayingLLMClient

play = PlayingLLMClient("cassette.jsonl")
ctx = ReasoningContext(outer_context="...", api=play)
await chain.execute_async(ctx)   # reads from the cassette, ~instant
```

## How matching works

The cassette key is `sha256(method + prompt/messages + model + temperature)`. If a
run asks for a key that isn't in the cassette, `PlayingLLMClient` raises
`CassetteMissError` (with a prompt preview) — so a drifted prompt fails loudly
instead of silently calling a real API.

| Client | Constructor |
| --- | --- |
| `RecordingLLMClient` | `(real_client, cassette_path, overwrite=False)` |
| `PlayingLLMClient` | `(cassette_path, model=None, temperature=None)` |

## See also

- [LLM clients](/carl/llm/clients/) · [Retries](/carl/llm/retries/)
