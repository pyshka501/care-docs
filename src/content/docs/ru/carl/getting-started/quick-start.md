---
title: Быстрый старт
description: Установите CARL и запустите первую цепочку рассуждений — сначала без сети с клиентом-заглушкой, затем с настоящей моделью.
sidebar:
  order: 2
---

Соберём и запустим цепочку из двух шагов. Первый вариант работает без сети с
клиентом-заглушкой, так что настройку можно проверить без API-ключа.

## 1. Установка

```bash
pip install 'mmar-carl==0.5.0'
```

OpenAI-совместимый клиент входит в базовый пакет. Нужен Python 3.12+.

## 2. Опишите цепочку

Цепочка — это список типизированных шагов. Шаги объявляют `dependencies`, а
DAG-исполнитель запускает параллельно всё, что можно.

```python
from mmar_carl import (
    Language,
    LLMClientBase,
    LLMStepDescription,
    ReasoningChain,
    ReasoningContext,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Extract claims",
        aim="Pull out the key factual claims from the text.",
        reasoning_questions="What does the author assert as fact?",
        stage_action="List each distinct claim.",
        example_reasoning="Separating claims from opinion clarifies what to verify.",
    ),
    LLMStepDescription(
        number=2,
        title="Assess strength",
        aim="Judge how well-supported each claim is.",
        reasoning_questions="Which claims are backed by evidence?",
        dependencies=[1],  # waits for step 1
        stage_action="Rate each claim weak / moderate / strong.",
        example_reasoning="Evidence quality determines how much to trust a claim.",
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2)
```

## 3. Запуск без сети

Моделью может служить любой объект, реализующий `LLMClientBase`. Эта заглушка
возвращает готовый ответ:

```python
class EchoClient(LLMClientBase):
    """Offline stand-in for a real LLM."""

    async def get_response(self, prompt: str) -> str:
        return f"(stub answer to a {len(prompt)}-char prompt)"

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


context = ReasoningContext(
    outer_context="Coffee was first cultivated in Yemen. It is the best drink.",
    api=EchoClient(),
    language=Language.ENGLISH,
    system_prompt="You are a careful analyst.",
)

result = chain.execute(context)
print(result.success)               # True
print(result.get_final_output())    # (stub answer to a …-char prompt)
for sr in result.step_results:
    print(sr.step_number, sr.step_title, sr.success)
```

Язык по умолчанию русский: он влияет на формулировки промптов и истории. Для
английского задайте `language=Language.ENGLISH` явно.

Для юнит-тестов есть `ChainTestHarness` (экспортируется из `mmar_carl`): он
делает то же самое, но с ответами по номеру шага и проверками.

## 4. Запуск с настоящей моделью

Замените заглушку на OpenAI-совместимый клиент:

```python
from mmar_carl import OpenAICompatibleClient, OpenAIClientConfig

client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context="<your input text here>",
    api=client,
    language=Language.ENGLISH,
    system_prompt="You are a careful analyst.",
)

result = chain.execute(context)
print(result.get_final_output())
```

`chain.execute(context)` работает синхронно. В асинхронном коде используйте
`await chain.execute_async(context)`. См. [асинхронное исполнение](/ru/carl/async/overview/).

## Что дальше

- [Что такое CARL?](/ru/carl/getting-started/overview/): общая картина и extras.
- [Основные понятия](/ru/carl/concepts/what-is-carl/): цепочки, шаги, DAG, контекст.
- [Обзор шагов](/ru/carl/steps/overview/): все 25 типов шагов.
- [Управление запуском](/ru/carl/chains/run-controls/): fail-fast, пауза, отмена.
