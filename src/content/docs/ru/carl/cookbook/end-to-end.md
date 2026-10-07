---
title: Сквозное руководство
description: Агент для разбора обращений в поддержку с нуля — LLM, инструмент, память и шаг ответа — с запуском офлайн на клиенте-заглушке.
sidebar:
  order: 2
---

Здесь всё собирается вместе: агент разбирает обращение в поддержку с помощью
LLM-шага, зарегистрированного инструмента, записи в память и финального шага
с ответом. Код ниже работает как есть, без сети: вместо модели стоит
клиент-заглушка. В продакшене подставьте настоящий клиент.

## 1. Шаги

```python
from mmar_carl import (
    ReasoningChain, ReasoningContext, Language, LLMClientBase,
    LLMStepDescription, ToolStepDescription, ToolStepConfig,
    MemoryStepDescription, MemoryStepConfig, MemoryOperation,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Classify severity",
        aim="Classify the ticket severity as low, medium, or high.",
        reasoning_questions="How urgent and impactful is this issue?",
        step_context_queries=["down", "outage", "pay"],
        stage_action="Reply with a single word: low / medium / high.",
        example_reasoning="A production outage is high; a typo is low.",
    ),
    ToolStepDescription(
        number=2,
        title="Look up SLA",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="lookup_sla",
            input_mapping={"severity": "$steps.1.result"},   # чистый ответ шага 1
        ),
    ),
    MemoryStepDescription(
        number=3,
        title="Record triage",
        dependencies=[2],
        config=MemoryStepConfig(
            operation=MemoryOperation.WRITE,
            memory_key="sla",
            value_source="$steps.2.result",
            namespace="triage",
        ),
    ),
    LLMStepDescription(
        number=4,
        title="Draft reply",
        aim="Draft a customer reply that states the SLA.",
        reasoning_questions="What should we tell the customer about timing?",
        dependencies=[3],
        stage_action="Write a short, friendly reply mentioning the SLA.",
        example_reasoning="Setting clear expectations reduces follow-ups.",
    ),
]
chain = ReasoningChain(steps=steps, max_workers=2)
```

:::tip[`$steps.N.result` или `$history[-1]`]
`$history[-1]` это последняя **запись истории**, и в ней есть заголовок шага
(`Step 1. Classify severity` / `Result: high` на языке контекста). Чтобы
передать инструменту чистый вывод шага, используйте `$steps.<n>.result`.
:::

## 2. Инструмент

```python
def lookup_sla(severity: str) -> str:
    table = {"high": "1 hour", "medium": "1 business day", "low": "3 business days"}
    return table.get(severity.strip().lower(), "3 business days")
```

## 3. Запуск

```python
class StubLLM(LLMClientBase):
    """Офлайн-заглушка: шаг 1 отвечает 'high', шаг 4 пишет ответ."""
    async def get_response(self, prompt: str) -> str:
        return "We are on it: expect an update within 1 hour." if "Draft reply" in prompt else "high"
    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)

context = ReasoningContext(
    outer_context="Our checkout has been down for 20 minutes - customers can't pay!",
    api=StubLLM(),   # в продакшене: OpenAICompatibleClient(OpenAIClientConfig(...))
    language=Language.ENGLISH,
    system_prompt="You are a concise, helpful support engineer.",
)
context.register_tool("lookup_sla", lookup_sla)

result = chain.execute(context)
print(result.get_final_output())                       # черновик ответа
print(result.success, len(result.step_results))        # True 4
print(context.memory_read("sla", namespace="triage"))  # 1 hour
```

По умолчанию `Language` русский. Для английских промптов задайте
`Language.ENGLISH`.

## 4. Разбор прогона

```python
print(result.format_profiling_table())    # задержка / токены / стоимость по шагам
print(chain.to_mermaid())                  # DAG
result.trace.to_html("triage.html")        # анимированный проигрыватель
for ev in result.trace.events:             # что получил каждый шаг
    print(ev.step_number, ev.inputs)
```

## Что дальше

- Добавьте [условный шаг](/ru/carl/steps/conditional/), чтобы отправлять `high` по другому пути.
- Добавьте [метрики](/ru/carl/evaluation/metrics/) и прогоните цепочку по [датасету](/ru/carl/evaluation/datasets/).
- [Эволюционируйте](/ru/carl/evolution/overview/) цепочку, чтобы улучшить ответы.
- Запишите настоящие ответы один раз через [запись и воспроизведение](/ru/carl/llm/record-replay/), и тесты останутся офлайн.
- Весь [сборник рецептов](/ru/carl/cookbook/overview/).
