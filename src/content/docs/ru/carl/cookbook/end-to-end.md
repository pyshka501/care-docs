---
title: Сквозной туториал
description: Мульти-шаговый агент триажа поддержки с нуля — LLM, tool, память и conditional.
sidebar:
  order: 2
---

Здесь всё связывается воедино: агент, который сортирует тикет поддержки, используя
LLM-шаг, зарегистрированный инструмент, запись в память и финальный шаг-черновик.

## 1. Опишите шаги

```python
from mmar_carl import (
    ReasoningChain, ReasoningContext, Language,
    LLMStepDescription, ToolStepDescription, ToolStepConfig,
    MemoryStepDescription, MemoryStepConfig, MemoryOperation,
    OpenAICompatibleClient, OpenAIClientConfig,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Classify severity",
        aim="Classify the ticket severity as low, medium, or high.",
        reasoning_questions="How urgent and impactful is this issue?",
        step_context_queries=["error", "outage", "deadline"],
        stage_action="Reply with a single word: low / medium / high.",
        example_reasoning="A production outage is high; a typo is low.",
    ),
    ToolStepDescription(
        number=2,
        title="Look up SLA",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="lookup_sla",
            input_mapping={"severity": "$history[-1]"},
        ),
    ),
    MemoryStepDescription(
        number=3,
        title="Record triage",
        dependencies=[2],
        config=MemoryStepConfig(
            operation=MemoryOperation.WRITE,
            memory_key="sla",
            value_source="$history[-1]",
            namespace="triage",
        ),
    ),
    LLMStepDescription(
        number=4,
        title="Draft reply",
        aim="Draft a customer reply that states the SLA from memory.",
        reasoning_questions="What should we tell the customer about timing?",
        dependencies=[3],
        step_context_queries=["customer", "request"],
        stage_action="Write a short, friendly reply mentioning the SLA.",
        example_reasoning="Setting clear expectations reduces follow-ups.",
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2)
```

## 2. Зарегистрируйте инструмент

```python
def lookup_sla(severity: str) -> str:
    table = {"high": "1 hour", "medium": "1 business day", "low": "3 business days"}
    return table.get(severity.strip().lower(), "3 business days")
```

## 3. Запустите

```python
client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context="Our checkout has been down for 20 minutes — customers can't pay!",
    api=client,
    language=Language.ENGLISH,
    system_prompt="You are a concise, helpful support engineer.",
)
context.register_tool("lookup_sla", lookup_sla)

result = chain.execute(context)
print(result.get_final_output())          # черновик ответа
print(result.success, len(result.step_results))
```

## 4. Изучите прогон

```python
print(result.format_profiling_table())    # стоимость / латентность по шагам
print(chain.to_mermaid())                  # DAG
result.trace.to_html("triage.html")        # анимированный плейбэк
```

## Куда дальше

- Добавьте [conditional-шаг](/ru/carl/steps/conditional/), чтобы эскалировать `high` на отдельный путь.
- Добавьте [метрики](/ru/carl/evaluation/metrics/) и прогоните на [датасете](/ru/carl/evaluation/datasets/).
- [Эволюционируйте](/ru/carl/evolution/overview/) цепочку для улучшения качества ответов.
- Полистайте полный [cookbook](/ru/carl/cookbook/overview/).
