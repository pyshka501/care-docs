---
title: Обзор эволюции
description: Эволюционный поиск вариантов цепочки с помощью ChainEvolver.
sidebar:
  order: 1
---

`ChainEvolver` запускает генетический поиск по вариантам цепочки: мутирует базовую
цепочку, оценивает каждый вариант на вашем [датасете](/ru/carl/evaluation/datasets/), сохраняет
лучших и повторяет в течение нескольких поколений.

```python
from mmar_carl import ChainEvolver

evolver = ChainEvolver(
    base_chain=chain,
    dataset=dataset,
    metric=AccuracyMetric(),
    population_size=6,
    generations=3,
    elitism=2,
    checkpoint_path="evolution.json",   # atomic resume on crash
)

result = await evolver.evolve(
    context_factory=lambda case: ReasoningContext(outer_context=case.input, api=client),
)
print(result.best_score, "@ generation", result.best_generation)
best = ReasoningChain.from_dict(result.best_chain_spec)   # rehydrate the winner
```

## Конструктор

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `base_chain` | `ReasoningChain` | — | Цепочка для эволюции. |
| `dataset` | `AbstractDataset` | — | Кейсы, по которым оценивается каждый вариант. |
| `metric` | `MetricBase \| list[MetricBase]` | — | Одна метрика или несколько (многоцелевые). |
| `fitness_fn` | `Callable[[dict], float] \| None` | среднее метрик | Объединяет оценки метрик в одну приспособленность. |
| `mutator` | `ChainMutator \| None` | `None` | Какие мутации пробовать — см. [мутации](/ru/carl/evolution/mutation-and-results/). |
| `population_size` | `int` | `6` | Вариантов на поколение. |
| `generations` | `int` | `3` | Количество поколений. |
| `elitism` | `int` | `2` | Лучшие варианты, переносимые без изменений. |
| `smoke_check` | `bool` | `True` | Проверить базовую цепочку перед эволюцией. |
| `max_concurrent_individuals` | `int` | `1` | Оценивать одновременно столько вариантов. |
| `checkpoint_path` | `str \| None` | `None` | Атомарный файл контрольной точки для безопасного возобновления после сбоя. |

`evolve(context_factory)` асинхронный и возвращает
[`EvolutionResult`](/ru/carl/evolution/mutation-and-results/#результаты).

## Многоцелевая оптимизация

Передайте список метрик и `fitness_fn` для их взвешивания:

```python
evolver = ChainEvolver(
    base_chain=chain,
    dataset=dataset,
    metric=[AccuracyMetric(), BrevityMetric()],
    fitness_fn=lambda s: 0.7 * s["accuracy"] + 0.3 * s["brevity"],
    population_size=4, generations=3, elitism=1,
)
```

Имена метрик должны быть уникальными. Без `fitness_fn` приспособленность равна среднему
по всем метрикам.

## Предварительный расчёт стоимости

Оцените расходы до запуска:

```python
estimate = evolver.estimate_cost(
    context_factory,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},
)
print(estimate.format_summary())   # smoke + population × generations × cases
```

Тот же расчёт лежит в основе предпросмотра бюджета в TUI: [панель эволюции в
MAESTRO CARE](/ru/care/tui/evolution/) показывает эту оценку и счётчик расходов
в реальном времени — до запуска и во время него.

## Смотрите также

- [Мутации и результаты](/ru/carl/evolution/mutation-and-results/)
- [Оценка](/ru/carl/evaluation/datasets/) — датасет и метрика, по которым evolver выставляет оценки.
- [Панель эволюции в MAESTRO CARE](/ru/care/tui/evolution/) — запуск генетического поиска с предпросмотром бюджета и счётчиком расходов в реальном времени.
