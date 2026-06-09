---
title: Supervisor
description: Позвольте LLM маршрутизировать задачу в одну из N специализированных под-цепочек.
sidebar:
  order: 2
---

`SupervisorStepDescription` просит LLM выбрать **одного** специалиста для задачи,
затем запускает под-цепочку этого специалиста. Специалисты регистрируются по имени в
поле `agents`, существующем только во время выполнения.

```python
from mmar_carl import SupervisorStepDescription, SupervisorStepConfig

SupervisorStepDescription(
    number=1,
    title="Route to specialist",
    agents={"pdf": pdf_chain, "search": search_chain, "code": code_chain},
    config=SupervisorStepConfig(
        routing_prompt=(
            "Pick ONE specialist for the task. Reply with just the name.\n"
            "Specialists: {agents}\n\nTask: {task}"
        ),
        output_memory_key="specialist_result",
    ),
)
```

В `routing_prompt` можно использовать заполнители `{agents}` (доступные имена) и `{task}`.

## SupervisorStepConfig

| Поле | Назначение |
| --- | --- |
| `routing_prompt` | Промпт, который LLM использует для выбора специалиста. |
| `task_source` | Ссылка на текст задачи (по умолчанию `$history[-1]`). |
| `fallback_agent` | Имя агента при неудаче маршрутизации. |
| `input_mapping` | Входные данные, передаваемые в выбранную под-цепочку. |
| `output_memory_key` / `output_namespace` | Куда сохраняется результат. |
| `propagate_failure` | Приводит ли неудача под-цепочки к неудаче этого шага. |
| `inherit_tools` | Передавать ли зарегистрированные инструменты родителя в под-цепочку. |
| `llm_config` | Переопределение модели на уровне шага для вызова маршрутизации. |

:::note
`agents` существует только во время выполнения (не сериализуется) — ключи — это имена,
из которых выбирает маршрутизатор.
:::

## Смотрите также

- [Handoff](/ru/carl/orchestration/handoff/) — делегирование единственной фиксированной под-цепочке.
- [Пример маршрутизации supervisor](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) в репозитории.
