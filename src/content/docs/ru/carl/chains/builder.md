---
title: ChainBuilder
description: Fluent-сборщик для пошаговой сборки цепочек.
sidebar:
  order: 2
---

`ChainBuilder` — fluent-альтернатива ручному созданию объектов шагов: цепочка
вызовов `.add_*()` и `.with_*()`, затем `.build()`.

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
    .with_fail_fast()
    .build()
)
```

## Методы для шагов

| Метод | Добавляет |
| --- | --- |
| `add_step(number, title, aim, reasoning_questions, stage_action, example_reasoning, …)` | LLM-шаг. Принимает также `dependencies`, `step_context_queries`, `llm_config`, `execution_mode`. |
| `add_tool_step(number, title, tool_name, input_mapping=None, …)` | Шаг инструмента (`timeout=30.0`, `tool_description=""`). |
| `add_mcp_step(number, title, server_name, tool_name, command=None, args=None, …)` | MCP-шаг через stdio (`arguments`, `argument_mapping`, `timeout=60.0`). |
| `add_memory_step(number, title, operation, memory_key, …)` | Шаг памяти (`value_source`, `default_value`, `namespace="default"`). |
| `add_transform_step(number, title, transform_type, input_key="$history[-1]", …)` | Шаг преобразования (`output_format`, `expression`, `map_template`). |
| `add_conditional_step(number, title, branches, default_step=None, condition_context_key="$history[-1]", …)` | Условный шаг. `branches` — список кортежей `(condition, next_step)` или `ConditionalBranch`. |
| `add_if_else(number, title, condition, if_true, if_false, condition_step=None, …)` | Условие на две ветки. |
| `add_switch(number, title, branches, condition_step=None, …)` | Условие на много веток. `branches` сопоставляет условия номерам шагов, `"default"` — запасную ветку. |
| `add_while_loop(body_steps, condition_key, max_iterations=10, start_number=None)` | Тело цикла, которое повторяется, пока условие истинно. См. [циклы](/ru/carl/steps/loops/). |
| `add_until_loop(body_steps, condition_key, max_iterations=10, start_number=None)` | Тело цикла, которое повторяется, пока условие не станет истинным. |
| `add_chain_tool(definition)` | Определение [цепочки-инструмента](/ru/carl/steps/chain-tools/). |

Методы `add_*` для шагов принимают `dependencies` (кроме `add_if_else` и
`add_switch`, у них `condition_step`), `checkpoint`, `checkpoint_name` и
у большинства `replan_enabled`. Все возвращают `self`.

Для остальных типов шагов (agent, code, command, wait, map, Claude Code, Codex,
шаги оркестрации и др.) сокращений `add_*` нет. Создайте их как типизированные
объекты и добавьте в `builder.steps` или передайте список прямо в
`ReasoningChain`:

```python
from mmar_carl import WaitStepDescription, WaitStepConfig, AfterWaitCondition

builder = ChainBuilder().add_tool_step(number=1, title="Kick off", tool_name="start_job")
builder.steps.append(
    WaitStepDescription(
        number=2,
        title="Give the job a minute",
        dependencies=[1],
        config=WaitStepConfig(condition=AfterWaitCondition(seconds=60)),
    )
)
chain = builder.build()
```

## Методы настройки

| Метод | Задаёт |
| --- | --- |
| `with_max_workers(n)` | Число параллельных воркеров (`int` или `"auto"`). |
| `with_fail_fast(enabled=True)` | Остановку после первого окончательного сбоя. См. [управление запуском](/ru/carl/chains/run-controls/). |
| `with_timeout(seconds)` | Таймаут цепочки. |
| `with_search_config(config)` | Стратегию извлечения контекста. |
| `with_default_llm_config(cfg)` | LLM-настройки по умолчанию для LLM-шагов. |
| `with_replan_policy(policy)` | Политику RE-PLAN. |
| `with_progress(enable=True)` | Логирование прогресса. |
| `with_metadata(**kv)` | Метаданные цепочки. |
| `with_trace_name(name)` / `with_session_id(id)` | Идентификаторы трассировки. |
| `with_prompt_template(t)` | Свой шаблон промпта. |

В конце вызовите `.build()` и получите `ReasoningChain`. Проверки те же, что в
конструкторе.

## См. также

- [Генерация цепочки по описанию](/ru/carl/chains/from-description/).
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) для `input_mapping` / `value_source`.
