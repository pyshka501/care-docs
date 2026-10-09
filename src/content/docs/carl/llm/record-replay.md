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

The cassette key is a SHA-256 of the call: method name, prompt or messages,
system/user prompt, tools, model and temperature (fields that are `None` are
left out). Token usage is stored with each entry and replayed, so cost and
token reports work offline.

If a run asks for a key that isn't in the cassette, `PlayingLLMClient` raises
`CassetteMissError` with a prompt preview. Inside a chain this shows up as a
failed step whose `error_message` starts with `Cassette miss for method=...`;
a drifted prompt fails loudly instead of calling a real API.

| Client | Constructor |
| --- | --- |
| `RecordingLLMClient` | `(real_client, cassette_path, *, overwrite=False)` |
| `PlayingLLMClient` | `(cassette_path, *, model=None, temperature=None)` |

## Try it offline

Record from a stub instead of a paid client, then replay:

```python
import asyncio, os, tempfile
from mmar_carl import (LLMClientBase, LLMStepDescription, ReasoningChain, ReasoningContext,
                       RecordingLLMClient, PlayingLLMClient)

class StubLLM(LLMClientBase):
    async def get_response(self, prompt): return "recorded answer"
    async def get_response_with_retries(self, prompt, retries=3): return "recorded answer"

chain = ReasoningChain(steps=[LLMStepDescription(number=1, title="Answer", aim="Answer briefly.")])
path = os.path.join(tempfile.mkdtemp(), "cassette.jsonl")

async def main():
    rec = RecordingLLMClient(StubLLM(), path, overwrite=True)
    await chain.execute_async(ReasoningContext(outer_context="q", api=rec))
    replay = await chain.execute_async(ReasoningContext(outer_context="q", api=PlayingLLMClient(path)))
    print(replay.get_final_output())     # recorded answer
    drifted = await chain.execute_async(ReasoningContext(outer_context="other", api=PlayingLLMClient(path)))
    print(drifted.success)               # False: cassette miss

asyncio.run(main())
```

## See also

- [LLM clients](/carl/llm/clients/) · [Retries](/carl/llm/retries/)
