---
title: Обзор эволюции
description: Эволюционный поиск по вариантам цепочки с ChainEvolver — мутации, кроссовер, многокритериальная приспособленность, оценка стоимости.
sidebar:
  order: 1
---

`ChainEvolver` ведёт генетический поиск по вариантам цепочки. В каждом
поколении он оценивает каждый вариант на вашем
[датасете](/ru/carl/evaluation/datasets/), оставляет лучших (`elitism`) и
получает остальных **мутацией** одного родителя или, при
`crossover_rate > 0`, **рекомбинацией** двух.

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
        aim_suffix_pool=[" Be brief."],
        sampling_n_pool=[3],                                         # обернуть шаг в голосование N сэмплов
        debate_pool=[{"roles": ["optimist", "skeptic"], "rounds": 1}],  # обернуть шаг в дебаты
        allow_collaboration_unwrap=True,                             # разрешить снимать эти обёртки
    ),
    crossover_rate=0.3,          # 30% новых потомков от двух родителей
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
| `crossover_rate` | `float` в `[0, 1]` | `0.0` | Вероятность, что потомок получен кроссовером, а не мутацией. |
| `crossover` | `ChainCrossover \| None` | `ChainCrossover()` | Оператор рекомбинации. Используется только при `crossover_rate > 0`. |
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

## Кроссовер

`ChainCrossover` берёт топологический префикс родителя A и топологический
суффикс родителя B в одной общей точке разреза, перенумеровывает шаги
`1..N` и перенаправляет висячие зависимости на последний шаг префикса. Поэтому
потомок ацикличен. Настройки уровня цепочки берутся у родителя A. Потомок
проходит `from_dict` и `to_dict`. Если это не удалось или разрез ломает
`loop_back_to`, цель ветки условного шага или `plan_source` запланированной
команды, оператор возвращает клон родителя A.

Чего кроссовер не сохраняет: смысловую согласованность двух половин и ссылки
`$memory` / `$history` через разрез (шаг суффикса может читать ключ, который
писал только отброшенный префикс). Шаги взаимодействия переходят целиком,
вместе с субагентами.

При `crossover_rate=0.0` (по умолчанию) случайные числа для кроссовера не
берутся, поэтому прогон с тем же seed повторяется в точности. Потомки
кроссовера записываются с `mutation_kind = CROSSOVER_KIND` (`"crossover"`) и
оценкой лучшего родителя в `parent_score`. Поэтому в
`format_mutation_effectiveness()` они стоят рядом с операторами мутации.

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

## См. также

- [Мутации и результаты](/ru/carl/evolution/mutation-and-results/)
- [Оценка](/ru/carl/evaluation/datasets/) — датасет и метрика, по которым идёт отбор.
- [Панель эволюции в TUI](/ru/care/tui/evolution/) — прогноз бюджета и счётчик расходов.
