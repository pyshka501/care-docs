---
title: Датасеты и оценка
description: Пакетная оценка цепочки по датасету и чтение отчёта.
sidebar:
  order: 2
---

`DatasetEvaluator` прогоняет цепочку по каждому кейсу датасета, оценивает каждый вывод
метрикой и формирует отчёт с результатами по кейсам и худшими кейсами для рефлексии.

## Создание датасета

Датасет выдаёт объекты `DataCase` (поле `input` обязательное; необязательные `label`,
`expected`, `metadata`):

```python
from mmar_carl import DataCase, SimpleDataset

dataset = SimpleDataset([
    DataCase(input="Revenue grew 12% YoY.", expected="positive", label="case_01"),
    DataCase(input="Margins collapsed.",     expected="negative", label="case_02"),
])
```

`DataFrameDataset(df, input_col=..., expected_col=...)` оборачивает pandas DataFrame
(нужен `pip install 'mmar-carl[pandas]'`). Для пользовательских источников создайте подкласс
`AbstractDataset` и реализуйте `__iter__`.

## Запуск оценки

```python
from mmar_carl import DatasetEvaluator, ThresholdStrategy, ReasoningContext

evaluator = DatasetEvaluator(
    chain=chain,
    dataset=dataset,
    metric=MyMetric(),
    strategy=ThresholdStrategy(threshold=0.5),   # pick problem cases
)

report = await evaluator.evaluate_async(
    context_factory=lambda case: ReasoningContext(outer_context=case.input, api=client),
)
```

`context_factory` преобразует каждый `DataCase` в `ReasoningContext` — здесь вы подключаете
`case.input` (и другие поля) к цепочке. Кейсы выполняются **последовательно** для соблюдения лимитов запросов.

### Стратегии выбора

Выберите кейсы, помечаемые как «проблемы» для дальнейшей работы:

| Стратегия | Выбирает |
| --- | --- |
| `ThresholdStrategy(threshold=…)` | кейсы с оценкой ниже порога. |
| `TopKWorstStrategy(k=…)` | `k` кейсов с наименьшими оценками. |

## Чтение отчёта

`DatasetEvaluationReport` содержит оценки по кейсам, результаты шагов, задержки и
оценки метрик на уровне шагов — плюс форматтеры для вывода (без `[viz]`):

```python
print(report.format_failure_heatmap())      # cases × steps grid of ✓ / ✗
print(report.format_score_distribution())   # min / Q1 / median / Q3 / max box plot
print(report.format_latency_histogram())    # per-step sparkline + p50/p95/max
print(report.format_cost_trend(pricing=...)) # per-run cost with regression flag
```

В ячейке Jupyter просто введите `report` — `_repr_markdown_` отрисует баннер +
таблицы + диаграммы.

Есть и `format_step_metric_heatmap()`: сетка кейсы × шаги с оценками метрик
шагов.

`DatasetEvaluator` принимает одну метрику. Каждый кейс получает свежий
контекст из `context_factory`, но клиент внутри может быть общим:
исполнитель не закрывает клиент, которым не владеет. Один
`OpenAICompatibleClient` может обслуживать всю оценку.

## EvalSuite — несколько метрик против `expected`

`EvalSuite` оценивает цепочку на датасете сразу несколькими метриками.
Обычно это встроенные метрики сравнения с `DataCase.expected`. Он считает
долю прошедших и распределение оценок по каждой метрике. Два отчёта можно
сравнить, чтобы поймать регрессии.

```python
from mmar_carl import EvalSuite, ExactMatchMetric, ContainsMetric

suite = EvalSuite(chain, dataset)
suite.add_metric(ExactMatchMetric())                    # pass_threshold=1.0
suite.add_metric(ContainsMetric(), pass_threshold=1.0)
report = await suite.run(lambda case: ReasoningContext(outer_context=case.input, api=client))

diff = previous_report.diff(report)   # EvalSuiteDiff: изменения оценок, ухудшившиеся / улучшившиеся кейсы
```

Кейсы здесь тоже идут последовательно.

## Смотрите также

- [Метрики](/ru/carl/evaluation/metrics/)
- [Пример датасетного оценщика](https://github.com/Glazkoff/carl/blob/main/examples/evaluation/dataset_evaluator_example.py) в репозитории.
