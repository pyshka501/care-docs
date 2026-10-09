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

Отсутствие SDK или ключа вызывает `AnthropicClientError`. У
`AnthropicClientConfig` нет `retry_policy`, его методы с повторами используют
простые повторы.

## Интерфейс клиента

`LLMClientBase` определяет методы, которые вызывают исполнители. Абстрактные
только `get_response` и `get_response_with_retries`, остальные реализованы
поверх них.

| Метод | Назначение |
| --- | --- |
| `get_response(prompt)` | Одиночное завершение. |
| `get_response_with_retries(prompt, retries=…)` | С обработкой повторных попыток. |
| `get_response_with_system(prompt, system)` | С системным промптом. |
| `get_response_with_usage(prompt)` | Возвращает текст + использование токенов. |
| `get_response_with_messages(messages)` | Многоходовой (см. `ChatMessage`). |
| `get_response_with_tools(...)` | Tool-calling. |
| `get_response_with_tools_and_usage(...)` | Tool-calling плюс расход токенов: `(content, tool_calls, usage)`. Базовая реализация возвращает пустой usage, `OpenAICompatibleClient` и `AnthropicClient` возвращают настоящие счётчики. Шаги agent используют его для бюджета токенов. |
| `stream_response(prompt)` | Стриминг токенов. |

Плюс интроспекция: `model_name`, `temperature`, `max_tokens`, `supports_streaming`.

`ChatMessage(role, content)` (`role: "system" | "user" | "assistant"`) моделирует
многоходовую историю.

## Свои клиенты и заглушки

`ReasoningContext(api=...)` берёт объект как есть, никакого автоопределения
или обёрток нет. Исполнители вызывают на нём методы `LLMClientBase`, поэтому
передавайте подкласс `LLMClientBase`. Для тестов и офлайн-примеров заглушке
нужны только два абстрактных метода:

```python
from mmar_carl import LLMClientBase

class StubLLM(LLMClientBase):
    async def get_response(self, prompt: str) -> str:
        return "ok"
    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)
```

Переопределите `model_name`, если хотите видеть модель в трассе.

## Кто закрывает клиент

Клиентом из `api` владеет вызывающий код. CARL выполняет каждый шаг на копии
контекста. Когда шаг заканчивается, копия вызывает
`ReasoningContext.close_derived_clients()`. Он закрывает только клиенты,
которые контекст создал для переопределений `llm_config` в шагах. Общий
клиент `api` остаётся открытым, поэтому несколько цепочек могут одновременно
работать с одним `OpenAICompatibleClient` (например, при оценке на датасете).

Закройте его сами, когда закончите: `await context.close()` закрывает `api`
(если это `OpenAICompatibleClient`) и производные клиенты.

## Смотрите также

- [Повторные попытки](/ru/carl/llm/retries/) · [Запись и воспроизведение](/ru/carl/llm/record-replay/)
- [Переопределение модели на уровне шага](/ru/carl/steps/llm/#настройки-llm-для-шага)
