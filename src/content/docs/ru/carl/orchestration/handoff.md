---
title: Handoff
description: Делегирование полной под-цепочке с изолированным контекстом.
sidebar:
  order: 3
---

`AgentHandoffStepDescription` запускает полную под-цепочку внутри родительского запуска. Под-цепочка
получает изолированный `ReasoningContext`, производный от родительского, с входными данными,
разрешёнными из памяти/истории родителя; её результат объединяется обратно через
`output_memory_key`.

```python
from mmar_carl import AgentHandoffStepDescription, AgentHandoffStepConfig

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={"input.topic": "$memory.input.topic"},
        output_memory_key="research_result",
    ),
)
```

## AgentHandoffStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `input_mapping` | `{}` | Отображение ключей памяти под-цепочки ← ссылок родителя. |
| `output_memory_key` | — | Куда сохраняется финальный вывод под-цепочки. |
| `output_namespace` | — | Пространство имён для вывода. |
| `propagate_failure` | `True` | Приводит ли неудача под-цепочки к неудаче этого шага. |
| `inherit_tools` | — | Передавать ли инструменты родителя в под-цепочку. |
| `timeout` | `None` | Таймаут под-цепочки. |

Полный `ReasoningResult` под-цепочки всегда доступен по адресу
`step_result.result_data["sub_result"]`. `sub_chain` существует только во время выполнения (не сериализуется).

## Supervisor vs. handoff

- **Handoff** — делегирование одной **фиксированной** под-цепочке.
- **[Supervisor](/ru/carl/orchestration/supervisor/)** — позволить LLM **выбрать** среди нескольких.
