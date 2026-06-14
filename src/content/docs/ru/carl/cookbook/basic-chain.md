---
title: "Пример: базовая цепочка"
description: Настоящая 4-шаговая цепочка анализа из репозитория — явные шаги, зависимости, параллелизм, выполнение.
sidebar:
  order: 3
---

[`basic_chain_example.py`](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/basic_chain_example.py)
из репозитория строит 4-шаговую цепочку, анализирующую квартальный отчёт: извлечь метрики →
(проанализировать достижения ‖ оценить риски) → синтезировать сводку. Шаги 2 и 3 выполняются
параллельно (оба зависят только от шага 1); шаг 4 ждёт оба.

## Цепочка

```python
from mmar_carl import (
    LLMStepDescription, ReasoningChain, ReasoningContext, Language,
    OpenAICompatibleClient, OpenAIClientConfig,
)

steps = [
    LLMStepDescription(
        number=1,
        title="Financial Metrics Extraction",
        aim="Extract and organize key financial metrics from the report",
        reasoning_questions="What are the main financial figures? How do they compare YoY?",
        stage_action="Identify and list all financial metrics with their values",
        example_reasoning="Revenue of $2.5M with 15% growth indicates strong performance",
        step_context_queries=["Revenue", "Profit", "EBITDA"],
    ),
    LLMStepDescription(
        number=2,
        title="Achievement Analysis",
        aim="Analyze the key achievements and their business impact",
        reasoning_questions="What were the main achievements? What is their strategic value?",
        stage_action="Evaluate each achievement's contribution to business growth",
        example_reasoning="New product line contributes 16% of total revenue",
        step_context_queries=["Achievements", "product", "market"],
        dependencies=[1],
    ),
    LLMStepDescription(
        number=3,
        title="Risk Assessment",
        aim="Identify and assess challenges and risks",
        reasoning_questions="What challenges exist? What is their potential impact?",
        stage_action="Analyze each challenge and estimate risk severity",
        example_reasoning="Supply chain issues may affect Q1 delivery targets",
        step_context_queries=["Challenges", "disruptions", "cost"],
        dependencies=[1],  # runs in parallel with step 2
    ),
    LLMStepDescription(
        number=4,
        title="Executive Summary",
        aim="Synthesize findings into an actionable executive summary",
        reasoning_questions="What are the key takeaways? What actions are recommended?",
        stage_action="Create a concise summary with recommendations",
        example_reasoning="Strong performance despite challenges → focus on supply chain",
        dependencies=[2, 3],  # waits for both analysis steps
    ),
]

chain = ReasoningChain(steps=steps, max_workers=2, enable_progress=True)
```

## Запуск

```python
client = OpenAICompatibleClient(OpenAIClientConfig(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
    model="qwen/qwen3-coder",
))

context = ReasoningContext(
    outer_context=report_text,
    api=client,
    language=Language.ENGLISH,
    system_prompt="You are a senior business analyst. Provide clear, actionable insights.",
)

result = await chain.execute_async(context)
print(result.get_final_output())
print(f"completed {len(result.get_successful_steps())}/{len(chain.steps)} steps "
      f"in {result.total_execution_time:.2f}s")
```

## Инспекция зависимостей

Объект цепочки может сообщить свой план выполнения до запуска:

```python
chain.get_execution_plan()       # batches in topological order
chain.get_step_dependencies()    # {step_number: [deps]}
```

## Смотрите также

- Тот же пример также показывает флюентную форму [`ChainBuilder`](/ru/carl/chains/builder/) и [сериализацию](/ru/carl/serialization/json/).
- [Индекс Cookbook](/ru/carl/cookbook/overview/) · [Сквозной туториал](/ru/carl/cookbook/end-to-end/)
