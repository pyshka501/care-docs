---
title: Мутации и результаты
description: Настройка мутаций цепочек и чтение EvolutionResult.
sidebar:
  order: 2
---

## ChainMutator

`ChainMutator` определяет ходы, которые может делать evolver. Вы задаёте *пулы*
кандидатных значений; каждый включённый вид мутации берёт значения из своего пула.

```python
from mmar_carl import ChainMutator, MutationKind

mutator = ChainMutator(
    temperature_pool=[0.1, 0.5],
    aim_suffix_pool=[" Be brief."],
    step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "..."}],
    allow_step_deletion=True,
    enabled_kinds=[
        MutationKind.PROMPT_REWRITE,
        MutationKind.INSERT_STEP,
        MutationKind.DELETE_STEP,
    ],
)
```

| Пул / флаг | Питает вид мутации |
| --- | --- |
| `model_pool` | `MODEL_SWAP` — заменить модель шага. |
| `temperature_pool` | `TEMPERATURE_SWAP` — заменить температуру шага. |
| `max_workers_pool` | `MAX_WORKERS` — изменить параллелизм цепочки. |
| `aim_suffix_pool` | `PROMPT_REWRITE` — добавить подсказку в `aim` шага. |
| `step_template_pool` | `INSERT_STEP` — вставить шаг верификации. |
| `allow_step_deletion` | `DELETE_STEP` — удалить листовой шаг (требует явного включения). |

Если `enabled_kinds` не указан, он выводится из установленных пулов. Каждая мутация
перепроверяется через `from_dict`; невалидные мутации прозрачно откатываются.

## Результаты

`EvolutionResult` содержит:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `best_chain_spec` | `dict` | Победившая цепочка, сериализованная — восстановить через `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Приспособленность победителя. |
| `best_generation` | `int` | Поколение, в котором появился победитель. |
| `history` | `list[GenerationStats]` | Статистика по поколениям. |

Детали по особям находятся в `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind`, `parent_score` и `scores_by_metric`
(для многоцелевых запусков).

### Визуализация запуска

`EvolutionResult` имеет форматтеры для текста/PNG:

```python
print(result.format_score_evolution())        # best score per generation
print(result.format_pareto())                  # multi-objective frontier
print(result.format_spend_vs_quality())        # tokens vs fitness
print(result.format_mutation_effectiveness())  # which mutations helped
print(result.to_lineage_mermaid())             # parent→child tree (winner highlighted)
```

Для сравнения нескольких запусков верхнеуровневый `format_runs_pareto(results, ...)` рисует
межзапусковый граф Парето. В Jupyter введите `result` для рендеринга через `_repr_markdown_`.

## Смотрите также

- [Обзор эволюции](/ru/carl/evolution/overview/)
- [Панель эволюции в MAESTRO CARE](/ru/care/tui/evolution/) — TUI показывает те же результаты, а также предпросмотр бюджета и счётчик расходов в реальном времени.
- Трассировка и визуализация (следующий раздел) для диагностики запусков.
