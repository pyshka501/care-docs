---
title: Debate
description: Ролевая дискуссия по кругу с синтезом судьи.
sidebar:
  order: 4
---

`DebateStepDescription` запускает дискуссию по кругу: каждая **роль** аргументирует
по очереди заданное число раундов, затем **судья** синтезирует вывод.

```python
from mmar_carl import DebateStepDescription, DebateStepConfig

DebateStepDescription(
    number=1,
    title="Debate the proposal",
    config=DebateStepConfig(
        roles=["optimist", "skeptic"],
        role_prompts={
            "optimist": "Argue for the proposal's strengths.",
            "skeptic": "Probe the proposal's weaknesses.",
        },
        rounds=2,
        judge_prompt="Weigh both sides and state the strongest conclusion.",
        output_memory_key="verdict",
    ),
)
```

## DebateStepConfig

| Поле | Назначение |
| --- | --- |
| `roles` | Роли дискутантов (в порядке очерёдности). |
| `role_prompts` | Системный промпт для каждой роли. |
| `rounds` | Сколько полных раундов по кругу. |
| `task_source` | Ссылка на тему (по умолчанию `$history[-1]`). |
| `judge_prompt` | Промпт, который судья использует для синтеза. |
| `output_memory_key` / `output_namespace` | Куда сохраняется вердикт. |
| `llm_config` | Модель по умолчанию для всех ролей + судьи. |
| `role_llm_configs` | Переопределения модели для каждой роли (разные модели для каждой роли). |

:::tip
Задайте каждой роли разную модель через `role_llm_configs` для действительно разнообразных
точек зрения.
:::

## Смотрите также

- [Parallel sampling](/ru/carl/orchestration/parallel-sampling/) — семплирование нескольких ответов и голосование.
