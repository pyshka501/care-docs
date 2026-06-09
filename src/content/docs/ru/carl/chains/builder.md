---
title: ChainBuilder
description: Fluent-построитель для сборки цепочек шаг за шагом.
sidebar:
  order: 2
---

`ChainBuilder` — fluent-альтернатива ручному созданию объектов шагов:
цепочка вызовов `.add_*()` и `.with_*()`, затем `.build()`.

## Пример

```python
from mmar_carl import ChainBuilder

chain = (
    ChainBuilder()
    .add_step(
        number=1,
        title="Analysis",
        aim="Analyze the data.",
        reasoning_questions="What patterns exist?",
        stage_action="Extract insights.",
        example_reasoning="Pattern analysis reveals trends.",
    )
    .add_tool_step(
        number=2,
        title="Calculate",
        tool_name="my_calculator",
        input_mapping={"value": "$history[-1]"},
        dependencies=[1],
    )
    .add_memory_step(
        number=3,
        title="Store",
        operation="write",
        memory_key="result",
        value_source="$history[-1]",
        dependencies=[2],
    )
    .with_max_workers(2)
    .build()
)
```

## Методы добавления шагов

| Метод | Добавляет |
| --- | --- |
| `add_step(number, title, aim, reasoning_questions, stage_action, example_reasoning, …)` | LLM-шаг. Также принимает `dependencies`, `step_context_queries`, `llm_config`, `execution_mode`. |
| `add_tool_step(number, title, tool_name, input_mapping=…, …)` | Tool-шаг (`timeout=30.0`). |
| `add_mcp_step(number, title, server_name, tool_name, …)` | MCP-шаг (`timeout=60.0`). |
| `add_memory_step(number, title, operation, memory_key, …)` | Memory-шаг (`namespace="default"`). |
| `add_transform_step(number, title, transform_type, input_key="$history[-1]", …)` | Transform-шаг. |
| `add_conditional_step(...)` | Шаг с условным ветвлением. |

Каждый метод `add_*` принимает `dependencies`, `checkpoint`, `checkpoint_name` и
`replan_enabled`, а также возвращает `self` для цепочки вызовов.

## Методы конфигурации

| Метод | Устанавливает |
| --- | --- |
| `with_max_workers(n)` | Параллельные воркеры (`int` или `"auto"`). |
| `with_search_config(config)` | Стратегию извлечения контекста. |
| `with_default_llm_config(cfg)` | Конфигурацию LLM по умолчанию для всех LLM-шагов. |
| `with_timeout(seconds)` | Таймаут цепочки. |
| `with_replan_policy(policy)` | Политику RE-PLAN. |
| `with_progress(enable=True)` | Логирование прогресса. |
| `with_metadata(**kv)` | Произвольные метаданные. |
| `with_trace_name(name)` / `with_session_id(id)` | Идентификаторы трассировки. |
| `with_prompt_template(t)` | Пользовательский шаблон промпта. |

Завершите вызовом `.build()` → `ReasoningChain`.

## Смотрите также

- [Генерация цепочки из текста](/ru/carl/chains/from-description/).
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) для `input_mapping` / `value_source`.
