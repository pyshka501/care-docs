---
title: Обзор эволюции
description: Эволюционный поиск по вариантам цепочки с ChainEvolver — мутации, многокритериальная приспособленность, оценка стоимости — и примитивы EvoC для внешних движков эволюции.
sidebar:
  order: 1
---

`ChainEvolver` ведёт генетический поиск по вариантам цепочки. В каждом
поколении он оценивает каждый вариант на вашем
[датасете](/ru/carl/evaluation/datasets/), оставляет лучших (`elitism`) и
получает остальных **мутацией** родителя. Оператора кроссовера в 0.5.2 нет.

Пример ниже работает офлайн: вместо настоящего клиента стоит заглушка LLM.

```python
import asyncio, random
from mmar_carl import (
    ChainEvolver, ChainMutator, LLMClientBase, LLMStepDescription,
    MetricBase, DataCase, SimpleDataset, ReasoningChain, ReasoningContext,
)

class StubLLM(LLMClientBase):
    """Офлайн-заглушка: отвечает 'positive', если в тексте есть рост."""
    async def get_response(self, prompt: str) -> str:
        return "positive" if "grew" in prompt else "negative"
    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)

class ExactLabel(MetricBase):
    @property
    def name(self) -> str:
        return "exact"
    async def compute_async(self, output, *, case=None) -> float:
        return float(output.get_final_output().strip() == (case.expected if case else ""))

chain = ReasoningChain(steps=[
    LLMStepDescription(number=1, title="Read", aim="Summarise the input."),
    LLMStepDescription(number=2, title="Label", aim="Answer positive or negative.", dependencies=[1]),
])
dataset = SimpleDataset([
    DataCase(input="Revenue grew 12% YoY.", expected="positive"),
    DataCase(input="Margins collapsed.", expected="negative"),
])
client = StubLLM()

evolver = ChainEvolver(
    base_chain=chain,
    dataset=dataset,
    metric=ExactLabel(),
    mutator=ChainMutator(
        aim_suffix_pool=[" Be brief."],                                       # переписать промпт
        step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "Check the answer."}],  # вставить шаг
    ),
    population_size=4,
    generations=2,
    elitism=1,
    rng=random.Random(7),        # воспроизводимый прогон
)

async def main():
    result = await evolver.evolve(
        context_factory=lambda case: ReasoningContext(outer_context=case.input, api=client),
    )
    print(result.best_score, "@ generation", result.best_generation)
    best = ReasoningChain.from_dict(result.best_chain_spec)   # восстановить победителя
    print(result.format_mutation_effectiveness())

asyncio.run(main())
```


## Конструктор

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `base_chain` | `ReasoningChain` | — | Исходная цепочка. Она не меняется, варианты это клоны. |
| `dataset` | `AbstractDataset` | — | Кейсы, на которых оценивается каждый вариант. |
| `metric` | `MetricBase \| list[MetricBase]` | — | Одна метрика или несколько (многокритериально). |
| `fitness_fn` | `Callable[[dict[str, float]], float] \| None` | среднее метрик | Сводит оценки метрик в одну приспособленность. |
| `mutator` | `ChainMutator \| None` | `None` | Операторы мутации, см. [мутации и результаты](/ru/carl/evolution/mutation-and-results/). При `None` потомки это просто клоны. |
| `population_size` | `int` | `6` | Вариантов в поколении (≥ 1). |
| `generations` | `int` | `3` | Число поколений. `1` только оценивает начальную популяцию. |
| `elitism` | `int` | `2` | Лучшие варианты, которые переходят без изменений (не больше `population_size`). |
| `rng` | `random.Random \| None` | без seed | Передайте RNG с seed для воспроизводимых прогонов. |
| `selection_strategy` | стратегия | `ThresholdStrategy(threshold=0.0)` | Передаётся во внутренний `DatasetEvaluator`. |
| `smoke_check` | `bool` | `True` | Запустить исходную цепочку на первом кейсе и проверить метрику до эволюции. Бросает `RuntimeError` при пустом датасете, упавшем прогоне или оценке NaN. |
| `max_concurrent_individuals` | `int` | `1` | Сколько вариантов оценивать одновременно. |
| `checkpoint_path` | `str \| None` | `None` | Атомарный файл контрольной точки (вместе с состоянием RNG) для продолжения после сбоя. |

`evolve(context_factory)` асинхронный и возвращает
[`EvolutionResult`](/ru/carl/evolution/mutation-and-results/#результаты).

## Несколько критериев

Передайте список метрик и `fitness_fn`, который их взвешивает:

```python
evolver = ChainEvolver(
    base_chain=chain,
    dataset=dataset,
    metric=[AccuracyMetric(), BrevityMetric()],
    fitness_fn=lambda s: 0.7 * s["accuracy"] + 0.3 * s["brevity"],
    population_size=4, generations=3, elitism=1,
)
```

Имена метрик должны быть уникальны, иначе `ValueError`. Без `fitness_fn`
приспособленность это среднее всех оценок.

## Оценка стоимости заранее

Прикиньте расходы до запуска:

```python
estimate = evolver.estimate_cost(
    context_factory,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},   # USD за 1k входных / выходных токенов
)
print(estimate.format_summary())   # smoke + популяция × поколения × кейсы
```

`EvolutionCostEstimate` содержит `total_chain_runs`, суммы токенов,
`total_cost_usd` и `pricing_missing_models`. Он умножает
[оценку стоимости](/ru/carl/tracing/cost/) одной цепочки на размер прогона.
Мутации, которые добавляют шаги, делают реальные расходы выше.

## Примитивы EvoC

С 0.5.0 CARL поставляет и строительные блоки для **внешнего** движка эволюции
(EvoC), который правит спецификации цепочек как данные. Всё это экспорты
верхнего уровня:

| Задача | Имена |
| --- | --- |
| Каталог шагов и проверка спецификаций | `get_step_catalog`, `validate_spec`, `validate_and_build`, `auto_generate_minimal_step`, `schema_for` |
| Правка полей | `mutable_fields`, `get_field_by_path`, `set_field_by_path`, `iter_mutable_values`, `sample_field_value`, `mutate_content`, `mutable_targets` |
| Правка графа | `insert_step_at`, `remove_step`, `rewire_dependencies`, `change_step_type`, `apply_records`, `MutationRecord`, `MutationError` |
| Запросы к графу | `find_root_steps`, `find_leaf_steps`, `dependents_of`, `steps_of_type`, `deletable_steps`, `can_delete_step` |
| Заморозка | `StepDescriptionBase.frozen`, `frozen_step_numbers`; помощники мутаций соблюдают `respect_frozen=True` |
| Инструменты как данные | `CodeTool`, `CodeToolLibrary`, `validate_code_tool`, `compile_code_tool`; для запуска нужен `ReasoningContext(allow_code_tools=True)` |
| Дескрипторы запуска | `RunDescriptor`, `ComplexityDescriptor`, `extract_run_descriptor`, `extract_complexity` |
| Парето | `pareto_front`, `pareto_rank`, `dominates` |
| Датасеты | `subsample`, `split`, `select_cases`, `CaseSplit`, `CaseDiff` |

`validate_spec` проверяет и поток данных: явный вход `$steps.N` должен указывать
на объявленного предшественника (код ошибки `step_result_without_dependency`).
`ReasoningChain.from_dict` эту проверку не делает. Правки графа прогоняют её,
прежде чем принять изменение. У `IndividualMetrics` появились `id`, `parent_id`
и `mutation_records`, поэтому `to_lineage_mermaid()` может рисовать точную
родословную.

## См. также

- [Мутации и результаты](/ru/carl/evolution/mutation-and-results/)
- [Оценка](/ru/carl/evaluation/datasets/) — датасет и метрика, по которым идёт отбор.
- [Панель эволюции в TUI](/ru/care/tui/evolution/) — прогноз бюджета и счётчик расходов.
