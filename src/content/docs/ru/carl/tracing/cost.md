---
title: Оценка стоимости
description: Предварительный расчёт использования токенов и расходов в USD перед запуском цепочки.
sidebar:
  order: 3
---

`chain.estimate_cost(...)` делает **сухой прогон**: обходит цепочку и рассчитывает
использование токенов и стоимость для каждого шага с вызовом LLM — **без единого API-вызова**.

```python
estimate = chain.estimate_cost(
    context,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},   # {model: (input_per_1k, output_per_1k)}
    default_output_tokens=512,
)
print(estimate.format_table())
```

## Параметры

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `context` | `ReasoningContext` | — | Предоставляет входные данные для расчёта. |
| `pricing` | `dict[str, tuple[float, float]] \| None` | `None` | По модели: `(input_per_1k_usd, output_per_1k_usd)`. |
| `default_output_tokens` | `int` | `512` | Предполагаемая длина вывода на шаг. |
| `char_per_token` | `int` | `4` | Эвристика для подсчёта входных токенов. |

Возвращает `CostEstimate` (со `StepCostEstimate` для каждого шага). Модели, отсутствующие
в `pricing`, отображаются отдельно, чтобы вы знали, что не учтено.

## Чтение результата

```python
print(estimate.format_table())   # per-step token / USD table
```

В Jupyter введите `estimate` — `_repr_markdown_` отрисует баннер + таблицу.

## Оценка запуска эволюции

Для расчёта расходов на полную [эволюцию](/ru/carl/evolution/overview/) (smoke +
population × generations × cases) используйте `evolver.estimate_cost(context_factory,
pricing=...)` — это умножает оценку одной цепочки на размер запуска.

## Смотрите также

- [Визуализация](/ru/carl/tracing/visualization/) — `format_cost_by_model`, таблицы профилирования.
- [Трассировка](/ru/carl/tracing/overview/) — реальное использование токенов после запуска.
