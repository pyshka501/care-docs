---
title: Запись и воспроизведение
description: Запишите ответы LLM один раз, затем воспроизводите детерминированно без API-вызовов.
sidebar:
  order: 3
---

Обёртки-кассеты позволяют записать реальные ответы LLM один раз и воспроизводить их
детерминированно — идеально для тестов и ноутбуков, которые должны работать офлайн и быстро.

## Запись

Оберните реальный клиент; каждый ответ записывается в JSONL-кассету:

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

## Воспроизведение

Подставьте плеер — без API-ключа, без сети:

```python
from mmar_carl import PlayingLLMClient

play = PlayingLLMClient("cassette.jsonl")
ctx = ReasoningContext(outer_context="...", api=play)
await chain.execute_async(ctx)   # reads from the cassette, ~instant
```

## Как работает сопоставление

Ключ кассеты это SHA-256 от вызова: имя метода, промпт или сообщения,
system/user промпт, инструменты, модель и температура (поля со значением
`None` не учитываются). Вместе с каждой записью хранится расход токенов, и он
тоже воспроизводится. Поэтому отчёты о токенах и стоимости работают офлайн.

Если прогон запрашивает ключ, которого нет в кассете, `PlayingLLMClient`
бросает `CassetteMissError` с началом промпта. Внутри цепочки это выглядит как
упавший шаг, у которого `error_message` начинается с
`Cassette miss for method=...`. Изменившийся промпт падает громко, а не уходит
в настоящий API.

| Клиент | Конструктор |
| --- | --- |
| `RecordingLLMClient` | `(real_client, cassette_path, *, overwrite=False)` |
| `PlayingLLMClient` | `(cassette_path, *, model=None, temperature=None)` |

## Попробовать офлайн

Запишите ответы заглушки вместо платного клиента, затем воспроизведите:

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

## Смотрите также

- [LLM-клиенты](/ru/carl/llm/clients/) · [Повторные попытки](/ru/carl/llm/retries/)
