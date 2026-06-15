---
title: LLM-клиенты
description: OpenAI-совместимые и Anthropic-клиенты, интерфейс клиента и автоопределение.
sidebar:
  order: 1
---

CARL общается с LLM через клиенты, реализующие `LLMClientBase`. Передайте один
в `ReasoningContext(api=...)`.

## OpenAI-совместимый

`OpenAICompatibleClient` работает с OpenRouter, Azure OpenAI и локальными LLM
(Ollama, vLLM, LM Studio). Создаётся из `OpenAIClientConfig`:

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
    temperature=0.7,            # default
    extra_headers={"X-Title": "My App"},
))
```

Поля `OpenAIClientConfig`: `base_url`, `api_key` (обязательное), `model` (обязательное),
`temperature` (0.7), `max_tokens`, `timeout` (120 с), `verify_ssl`,
`extra_headers`, `extra_body` и [`retry_policy`](/ru/carl/llm/retries/).

## Anthropic

`AnthropicClient` — нативный клиент (строится из `AnthropicClientConfig`), который
открывает доступ к фичам, специфичным для Anthropic, недоступным через
OpenAI-совместимый путь.

```python
from mmar_carl import AnthropicClient, AnthropicClientConfig

client = AnthropicClient(AnthropicClientConfig(
    api_key="sk-ant-...",
    model="claude-3-7-sonnet-latest",   # default
    max_tokens=4096,                    # required by Anthropic
    thinking_budget=2000,               # enable extended thinking (Claude 3.7+)
    cache_system=True,                  # prompt-cache the system prompt
))
```

| Поле `AnthropicClientConfig` | По умолчанию | Назначение |
| --- | --- | --- |
| `api_key` | — (обязательное) | Ключ Anthropic (`ANTHROPIC_API_KEY` — запасной вариант из SDK). |
| `model` | `claude-3-7-sonnet-latest` | Идентификатор модели. |
| `temperature` | `0.7` | 0.0–1.0. |
| `max_tokens` | `4096` | **Обязательно** для Anthropic (неявного лимита нет). |
| `timeout` | `120.0` | Секунды. |
| `base_url` | `None` | Переопределение хоста API (gateway / VPC). |
| `extra_headers` | `{}` | Дополнительные HTTP-заголовки. |
| `thinking_budget` | `None` | Бюджет токенов для расширенного мышления. |
| `cache_system` | `False` | Помечать системные блоки `cache_control: ephemeral` для кэширования промпта. |

### Методы, специфичные для Anthropic

- **`get_response_with_thinking(prompt, *, system_prompt=None, retries=3)`** →
  `dict` со структурированным трейсом `thinking` + ответом (нужен `thinking_budget`).
- **`get_response_with_image(...)`** — нативное распознавание изображений (URL или base64).
- **`get_response_with_tools(...)`** — нативный tool-calling Anthropic. Преобразуйте
  схемы инструментов в стиле OpenAI через `openai_tools_to_anthropic(tools)`.

Отсутствие SDK или ключа вызывает `AnthropicClientError`.

## Интерфейс клиента

`LLMClientBase` определяет методы, используемые исполнителями:

| Метод | Назначение |
| --- | --- |
| `get_response(prompt)` | Одиночное завершение. |
| `get_response_with_retries(prompt, retries=…)` | С обработкой повторных попыток. |
| `get_response_with_system(prompt, system)` | С системным промптом. |
| `get_response_with_usage(prompt)` | Возвращает текст + использование токенов. |
| `get_response_with_messages(messages)` | Многоходовой (см. `ChatMessage`). |
| `get_response_with_tools(...)` | Tool-calling. |
| `stream_response(prompt)` | Стриминг токенов. |

Плюс интроспекция: `model_name`, `temperature`, `max_tokens`, `supports_streaming`.

`ChatMessage(role, content)` (`role: "system" | "user" | "assistant"`) моделирует
многоходовую историю.

## Автоопределение

Вам не обязательно создавать клиент вручную — передайте любой поддерживаемый API-объект
в `ReasoningContext(api=...)` и CARL выберет правильный клиент:

- `OpenAICompatibleClient` / `AnthropicClient`
- `LLMHub` (из `mmar-llm`), `LLMHubAPI` (из `mmar-mapi`)
- Mock-объекты, реализующие `__getitem__` или `get_response` (для тестов)

## Смотрите также

- [Повторные попытки](/ru/carl/llm/retries/) · [Запись и воспроизведение](/ru/carl/llm/record-replay/)
- [Переопределение модели на уровне шага](/ru/carl/steps/llm/#конфигурация-llm-на-уровне-шага)
