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

Ключ кассеты — `sha256(method + prompt/messages + model + temperature)`. Если запрос
просит ключ, которого нет в кассете, `PlayingLLMClient` вызывает `CassetteMissError`
(с превью промпта) — так дрейфующий промпт падает громко, вместо тихого вызова реального API.

| Клиент | Конструктор |
| --- | --- |
| `RecordingLLMClient` | `(real_client, cassette_path, overwrite=False)` |
| `PlayingLLMClient` | `(cassette_path, model=None, temperature=None)` |

## Смотрите также

- [LLM-клиенты](/ru/carl/llm/clients/) · [Повторные попытки](/ru/carl/llm/retries/)
