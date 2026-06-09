---
title: Рефлексия
description: Попросите цепочку проанализировать собственный запуск и предложить улучшения.
sidebar:
  order: 3
---

После запуска `chain.reflect(...)` просит LLM проанализировать, насколько хорошо цепочка
выполнила задачу — выявляя слабые шаги и конкретные предложения по улучшению.

```python
result = chain.execute(context)

reflection = chain.reflect(
    task_description="Analyze customer sentiment and extract key themes",
)
print(reflection)
```

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `task_description` | `str` | — (обязательное) | Исходная цель для оценки. |
| `context` | `ReasoningContext \| None` | `None` | По умолчанию — последний контекст выполнения. |
| `language` | `Language \| None` | `None` | По умолчанию — язык контекста. |
| `options` | `ReflectionOptions \| None` | `None` | Управляет содержимым промпта. |

Вызывает `RuntimeError`, если ни одного запуска ещё не было.

## Параметры

`ReflectionOptions` настраивает промпт рефлексии:

```python
from mmar_carl import ReflectionOptions

chain.reflect(
    task_description="...",
    options=ReflectionOptions(include_dependency_analysis=False),
)
```

Когда `include_metric_scores=True` (по умолчанию), любые оценки [метрик](/ru/carl/evaluation/metrics/)
передаются в промпт как конкретные сигналы качества — например, низкое `keyword_coverage`
на шаге побуждает модель предложить лучшие `step_context_queries`.

## Рефлексия по датасету

Объедините рефлексию с [`DatasetEvaluator`](/ru/carl/evaluation/datasets/): стратегия
выбора (`ThresholdStrategy` / `TopKWorstStrategy`) выбирает худшие кейсы, чтобы
рефлексия сосредоточилась на важных сбоях.

## Смотрите также

- [Метрики](/ru/carl/evaluation/metrics/) · [Датасеты и оценка](/ru/carl/evaluation/datasets/)
- [Пример рефлексии](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/reflection_example.py) в репозитории.
