---
title: Мутации и результаты
description: Настройка ChainMutator — скалярные, структурные операторы и операторы топологии взаимодействия — и чтение EvolutionResult.
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
    sampling_n_pool=[3, 5],
)
print(sorted(k.value for k in mutator.enabled_kinds))
```

`enabled_kinds=[...]` сужает поиск до части видов, которые разрешают ваши
пулы.

### Скалярные и структурные операторы

| Пул / флаг | `MutationKind` | Что делает |
| --- | --- | --- |
| `model_pool` | `MODEL_SWAP` | Меняет модель шага. |
| `temperature_pool` | `TEMPERATURE_SWAP` | Меняет температуру шага. |
| `max_workers_pool` | `MAX_WORKERS` | Меняет параллелизм цепочки (`int` или `"auto"`). |
| `aim_suffix_pool` | `PROMPT_REWRITE` | Добавляет подсказку к `aim` LLM-шага. |
| `step_template_pool` | `INSERT_STEP` | Вставляет шаблонный шаг перед последним. Он забирает зависимости последнего шага, а последний шаг начинает зависеть от него. |
| `allow_step_deletion` | `DELETE_STEP` | Удаляет лист (шаг, от которого никто не зависит). |

### Операторы топологии взаимодействия

Они меняют то, **как** шаги работают вместе. Это возможно потому, что
субагенты сериализуются (формат цепочки 11). Обёрнутый шаг переживает цикл
`to_dict()` / `from_dict()` внутри эволюции.

| Пул / флаг | `MutationKind` | Что делает |
| --- | --- | --- |
| `sampling_n_pool` (значения ≥ 2) | `WRAP_IN_SAMPLING` | Превращает LLM-шаг в `parallel_sampling`, исходный шаг становится `base_step`. |
| `debate_pool` | `WRAP_IN_DEBATE` | Превращает LLM-шаг в `debate`. Каждый элемент это частичный `DebateStepConfig` минимум с двумя `roles`. Промпт судьи по умолчанию берётся из `aim`. |
| `allow_handoff_wrap` | `WRAP_IN_HANDOFF` | Превращает LLM-шаг в `agent_handoff` над подцепочкой из одного шага. |
| `supervisor_role_pool` | `SPLIT_TO_SUPERVISOR` | Превращает LLM-шаг в `supervisor` над подцепочками-специалистами. Каждый элемент сопоставляет имена агентов и уточнение цели (минимум два агента). |
| `human_gate_prompt_pool` | `INSERT_HUMAN_GATE` | Вставляет шаг проверки `human_input` перед финальным шагом. |
| `allow_collaboration_unwrap` | `UNWRAP_COLLABORATION` | Сворачивает шаг взаимодействия обратно во внутренний шаг. Отказывается, если внутри больше одного шага. |

Каждый оператор правит JSON-спецификацию и сохраняет `number` и
`dependencies` заменённого шага. Остальной DAG не меняется. Каждая
спецификация после мутации проверяется через `from_dict` и сериализуется
снова. Неверная мутация (или превышение глубины вложенности 8) откатывается
к клону.

:::caution[Шагу проверки нужен провайдер]
Цепочке с шагом от `INSERT_HUMAN_GATE` нужен
`context.on_human_input_requested` во время оценки. Без провайдера шаг
заканчивается статусом `unavailable`, и вариант считается упавшим.
:::

## Результаты

`EvolutionResult` содержит:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `best_chain_spec` | `dict` | Победившая цепочка в сериализованном виде. Восстанавливается через `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Приспособленность победителя. |
| `best_generation` | `int` | Поколение, где появился победитель. |
| `history` | `list[GenerationStats]` | По поколениям: `best_score`, `mean_score`, `population_scores`, `population_metrics`, `best_chain_spec`. |

Детали по особям лежат в `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind` (значение `MutationKind` или
`"crossover"`), `parent_score` и `scores_by_metric` для многокритериальных
прогонов.

### Визуализация прогона

```python
print(result.format_score_evolution())        # лучшая оценка по поколениям
print(result.format_pareto())                 # фронт Парето для нескольких критериев
print(result.format_spend_vs_quality())       # токены против приспособленности
print(result.format_mutation_effectiveness()) # среднее изменение оценки по оператору, включая кроссовер
print(result.to_lineage_mermaid())            # дерево родитель → потомок, победитель выделен
```

`format_runs_pareto(results, labels=...)` сравнивает несколько прогонов. В
Jupyter достаточно написать `result`, он отрисуется через `_repr_markdown_`.

## См. также

- [Обзор эволюции](/ru/carl/evolution/overview/)
- [Многоагентные шаги](/ru/carl/orchestration/overview/) — что строят операторы взаимодействия.
- [Панель эволюции в TUI](/ru/care/tui/evolution/)
