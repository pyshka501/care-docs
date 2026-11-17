---
title: Мутации и результаты
description: Настройка ChainMutator — скалярные и структурные операторы — и чтение EvolutionResult.
sidebar:
  order: 2
---

## ChainMutator

`ChainMutator` задаёт ходы, которые может делать эволюция. Каждый вид мутации
питается пулом значений или включается флагом. Вид включён, только если его
пул не пуст или флаг равен `True`. `ChainMutator()` без аргументов ничего не
включает и возвращает клоны.

```python
from mmar_carl import ChainMutator, MutationKind

mutator = ChainMutator(
    temperature_pool=[0.1, 0.5],
    aim_suffix_pool=[" Be brief."],
    step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "Check the answer."}],
    allow_step_deletion=True,
)
print(sorted(k.value for k in mutator.enabled_kinds))
# ['delete_step', 'insert_step', 'prompt_rewrite', 'temperature_swap']
```

`enabled_kinds=[...]` сужает поиск до части видов, которые разрешают ваши
пулы.

### Операторы

В 0.5.2 у `MutationKind` шесть значений.

| Пул / флаг | `MutationKind` | Что делает |
| --- | --- | --- |
| `model_pool` | `MODEL_SWAP` | Меняет модель шага. |
| `temperature_pool` | `TEMPERATURE_SWAP` | Меняет температуру шага. |
| `max_workers_pool` | `MAX_WORKERS` | Меняет параллелизм цепочки (`int` или `"auto"`). |
| `aim_suffix_pool` | `PROMPT_REWRITE` | Добавляет подсказку к `aim` LLM-шага. |
| `step_template_pool` | `INSERT_STEP` | Вставляет шаблонный шаг перед последним. Он забирает зависимости последнего шага, а последний шаг начинает зависеть от него. |
| `allow_step_deletion` | `DELETE_STEP` | Удаляет лист (шаг, от которого никто не зависит). |

Каждый оператор правит JSON-спецификацию. Каждая спецификация после мутации
проверяется через `from_dict` и сериализуется снова. Неверная мутация
откатывается к клону. `ChainMutator` в 0.5.2 не смотрит на `frozen`, хотя в
описании самого поля сказано обратное. Замороженные шаги пропускают только
помощники графа и полей из `mmar_carl.meta` (см.
[примитивы EvoC](/ru/carl/evolution/overview/#примитивы-evoc)).

## Результаты

`EvolutionResult` содержит:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `best_chain_spec` | `dict` | Победившая цепочка в сериализованном виде. Восстанавливается через `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Приспособленность победителя. |
| `best_generation` | `int` | Поколение, где появился победитель. |
| `history` | `list[GenerationStats]` | По поколениям: `best_score`, `mean_score`, `population_scores`, `population_metrics`, `best_chain_spec`. |

Детали по особям лежат в `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind` (значение `MutationKind`),
`parent_score`, `scores_by_metric` для многокритериальных прогонов и поля
родословной `id`, `parent_id` и `mutation_records`, которые может заполнять
внешний движок.

### Визуализация прогона

```python
print(result.format_score_evolution())        # лучшая оценка по поколениям
print(result.format_pareto())                 # фронт Парето для нескольких критериев
print(result.format_spend_vs_quality())       # токены против приспособленности
print(result.format_mutation_effectiveness()) # среднее изменение оценки по оператору
print(result.to_lineage_mermaid())            # дерево родитель → потомок, победитель выделен
```

`format_runs_pareto(results, labels=...)` сравнивает несколько прогонов. В
Jupyter достаточно написать `result`, он отрисуется через `_repr_markdown_`.

## См. также

- [Обзор эволюции](/ru/carl/evolution/overview/)
- [Панель эволюции в TUI](/ru/care/tui/evolution/)
