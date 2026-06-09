---
title: Повторные попытки
description: Политика повторных попыток с учётом статуса ответа, ограниченным откатом и джиттером.
sidebar:
  order: 2
---

По умолчанию методы с повторными попытками повторяют **любое** исключение до 3 раз с
откатом `2 ** attempt` — это значит, что быстро падающий 401 (неверный API-ключ) тратит
более 7 секунд, прежде чем всплыть. `RetryPolicy` исправляет это: повторяет только
временные ошибки с ограниченным откатом и джиттером.

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig, RetryPolicy

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
    retry_policy=RetryPolicy(
        max_attempts=5,
        backoff="exponential",
        initial_delay_s=0.5,
        max_delay_s=10.0,
    ),
))
```

## Поля

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `max_attempts` | `int` | `3` | Всего попыток (начальная + повторные); 1–20. |
| `retry_on_status` | `list[int]` | `[429, 500, 502, 503, 504]` | HTTP-статусы, требующие повторной попытки. |
| `backoff` | `"constant" \| "exponential"` | `"exponential"` | Рост задержки между попытками. |
| `initial_delay_s` | `float` | `1.0` | Задержка перед первой повторной попыткой. |
| `max_delay_s` | `float` | `30.0` | Ограничение на любую отдельную задержку. |
| `jitter` | `bool` | `True` | Умножить каждую задержку на `0.5 + random()*0.5`, чтобы избежать эффекта «стада». |

:::caution
**401, 403, 404, 422 намеренно не повторяются** — ошибки авторизации/валидации
постоянные, поэтому повтор просто тратит бюджет. Они прерываются немедленно.
:::

Политика подключается через `OpenAIClientConfig.retry_policy` и управляет
методами с поддержкой повторных попыток (`get_response_with_retries`, `get_response_with_usage`, …).

## Смотрите также

- [LLM-клиенты](/ru/carl/llm/clients/) · [Запись и воспроизведение](/ru/carl/llm/record-replay/)
