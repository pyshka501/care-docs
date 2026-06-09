---
title: LLM-шаг
description: Шаги reasoning по типу chain-of-thought — тип шага CARL по умолчанию.
sidebar:
  order: 2
---

`LLMStepDescription` — тип шага по умолчанию: шаг reasoning по типу chain-of-thought,
подкреплённый вызовом LLM.

## Поля

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `aim` | `str` | `""` (**обязательное, непустое**) | Основная цель шага. |
| `reasoning_questions` | `str` | `""` | Ключевые вопросы, на которые должен ответить шаг. |
| `stage_action` | `str` | `""` | Конкретное действие для выполнения. |
| `example_reasoning` | `str` | `""` | Пример экспертного рассуждения, которое вы хотите получить. |
| `step_context_queries` | `list[ContextQuery \| str]` | `[]` | RAG-подобные запросы, извлекающие нужный контекст из `outer_context` в промпт этого шага. |
| `llm_config` | `LLMStepConfig \| None` | `None` | Переопределение модели / temperature / режима на уровне шага. |
| `retry_max` | `int \| None` | `None` | Количество попыток для этого шага (`None` = значение по умолчанию из контекста). |
| `timeout` | `float \| None` | `None` | Таймаут шага в секундах. |

Плюс все [общие поля](/ru/carl/steps/overview/#поля-общие-для-всех-шагов).

:::tip
`aim`, `reasoning_questions`, `stage_action` и `example_reasoning` принимают
**список** так же, как и строку — список приводится к блоку `"- item\n- item"`.
Это делает цепочки, сгенерированные LLM-планировщиком, более устойчивыми.
:::

## Базовый пример

```python
from mmar_carl import LLMStepDescription

LLMStepDescription(
    number=1,
    title="Assess data quality",
    aim="Assess the quality and completeness of the input data.",
    reasoning_questions="What data patterns and anomalies are present?",
    step_context_queries=["missing values", "data consistency"],
    stage_action="Evaluate reliability and flag issues.",
    example_reasoning="High-quality data enables reliable downstream analysis.",
)
```

## Конфигурация LLM на уровне шага

Переопределите модель, температуру или другие параметры для одного шага с помощью
`LLMStepConfig`:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `model` | `str \| None` | `None` | Идентификатор модели (например, `anthropic/claude-3.5-sonnet`). |
| `temperature` | `float \| None` | `None` | 0.0–2.0. |
| `max_tokens` | `int \| None` | `None` | Ограничение вывода. |
| `timeout` | `float \| None` | `None` | Таймаут на уровне шага. |
| `token_budget_warning` | `int \| None` | `None` | Предупреждение при превышении шагом этого количества токенов. |
| `execution_mode` | `ExecutionMode` | `FAST` | `FAST` или `SELF_CRITIC`. |
| `use_message_history` | `bool` | `False` | Отправлять структурированные многоходовые сообщения вместо плоского промпта. |

```python
from mmar_carl import LLMStepDescription, LLMStepConfig

LLMStepDescription(
    number=2,
    title="Deep analysis",
    aim="Perform a rigorous analysis.",
    llm_config=LLMStepConfig(model="anthropic/claude-3.5-sonnet", temperature=0.2),
)
```

## Режимы выполнения

- **`FAST`** (по умолчанию) — один проход LLM.
- **`SELF_CRITIC`** — шаг генерирует ответ, прогоняет его через одного или нескольких
  оценщиков и перегенерирует до `self_critic_max_revisions` раз, пока оценщики не одобрят.

```python
from mmar_carl import ExecutionMode

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm"],
    self_critic_max_revisions=2,
    self_critic_instruction="Reject answers that aren't backed by the data.",
)
```

## Смотрите также

- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — связывание выводов шагов между собой.
- [Извлечение контекста](/ru/carl/concepts/what-is-carl/#rag-извлечение-контекста) — как работает `step_context_queries`.
