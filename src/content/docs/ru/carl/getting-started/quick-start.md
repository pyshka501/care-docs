---
title: Быстрый старт
description: Установите CARL и запустите первую reasoning-цепочку за пять минут.
sidebar:
  order: 2
---

Соберите и запустите цепочку из двух шагов примерно за пять минут.

## 1. Установка

```bash
pip install mmar-carl
```

Для OpenAI-совместимых провайдеров (OpenRouter, Azure, локальные LLM):

```bash
pip install 'mmar-carl[openai]'
```

## 2. Описываем цепочку

Цепочки CARL — это списки типизированных описаний шагов. Шаги объявляют свои
`dependencies`, а DAG-исполнитель параллелит всё, что может выполняться одновременно.

```python
from mmar_carl import (
    ReasoningChain,
    LLMStepDescription,
    ReasoningContext,
    Language,
    OpenAICompatibleClient,
    OpenAIClientConfig,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Извлечь утверждения",
        aim="Выделить ключевые фактические утверждения из текста.",
        reasoning_questions="Что автор подаёт как факт?",
        stage_action="Перечислить каждое отдельное утверждение.",
        example_reasoning="Отделение фактов от мнений проясняет, что проверять.",
    ),
    LLMStepDescription(
        number=2,
        title="Оценить обоснованность",
        aim="Оценить, насколько хорошо подкреплено каждое утверждение.",
        reasoning_questions="Какие утверждения подкреплены доказательствами?",
        dependencies=[1],  # ждёт шаг 1
        stage_action="Оценить каждое: слабо / средне / сильно.",
        example_reasoning="Качество доказательств определяет уровень доверия.",
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2)
```

## 3. Запуск

```python
client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context="<ваш входной текст>",
    api=client,
    language=Language.RUSSIAN,
    system_prompt="Ты внимательный аналитик.",
)

result = chain.execute(context)
print(result.get_final_output())
```

`chain.execute(context)` выполняется синхронно. Для async / streaming используйте
`await chain.execute_async(context)` — см. [асинхронное исполнение](/ru/carl/getting-started/overview/).

## Дальше

- [Что такое CARL?](/ru/carl/getting-started/overview/) — общая картина.
- [Базовые концепции](/ru/carl/concepts/what-is-carl/) — цепочки, шаги, DAG, RAG-контекст.
