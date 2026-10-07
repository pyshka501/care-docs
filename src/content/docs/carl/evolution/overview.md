---
title: Evolution Overview
description: Evolutionary search over chain variants with ChainEvolver — mutation, crossover, multi-objective fitness, cost preflight.
sidebar:
  order: 1
---

`ChainEvolver` runs a genetic search over variants of a chain. Each generation
it scores every variant on your [dataset](/carl/evaluation/datasets/), keeps
the best (`elitism`), and breeds the rest by **mutating** one parent or, with
`crossover_rate > 0`, **recombining** two parents.

The example below runs offline: a stub LLM client stands in for a real one.

```python
import asyncio, random
from mmar_carl import (
    ChainEvolver, ChainMutator, LLMClientBase, LLMStepDescription,
    MetricBase, DataCase, SimpleDataset, ReasoningChain, ReasoningContext,
)

class StubLLM(LLMClientBase):
    """Offline stand-in: answers 'positive' for anything mentioning growth."""
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
        sampling_n_pool=[3],                                         # wrap a step in N-sample voting
        debate_pool=[{"roles": ["optimist", "skeptic"], "rounds": 1}],  # wrap a step in a debate
        allow_collaboration_unwrap=True,                             # allow undoing those wraps
    ),
    crossover_rate=0.3,          # 30% of bred children come from two parents
    population_size=4,
    generations=2,
    elitism=1,
    rng=random.Random(7),        # reproducible run
)

async def main():
    result = await evolver.evolve(
        context_factory=lambda case: ReasoningContext(outer_context=case.input, api=client),
    )
    print(result.best_score, "@ generation", result.best_generation)
    best = ReasoningChain.from_dict(result.best_chain_spec)   # rehydrate the winner
    print(result.format_mutation_effectiveness())

asyncio.run(main())
```

## Constructor

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `base_chain` | `ReasoningChain` | — | The chain to evolve. It is never modified; variants are clones. |
| `dataset` | `AbstractDataset` | — | Cases each variant is scored on. |
| `metric` | `MetricBase \| list[MetricBase]` | — | One metric, or several (multi-objective). |
| `fitness_fn` | `Callable[[dict[str, float]], float] \| None` | mean of metrics | Combines per-metric scores into one fitness. |
| `mutator` | `ChainMutator \| None` | `None` | Mutation operators — see [mutation & results](/carl/evolution/mutation-and-results/). With `None` children are plain clones. |
| `crossover_rate` | `float` in `[0, 1]` | `0.0` | Probability that a bred child comes from crossover instead of mutation. |
| `crossover` | `ChainCrossover \| None` | `ChainCrossover()` | The recombination operator; used only when `crossover_rate > 0`. |
| `population_size` | `int` | `6` | Variants per generation (≥ 1). |
| `generations` | `int` | `3` | Generations. `1` evaluates the initial population only. |
| `elitism` | `int` | `2` | Best variants carried over unchanged (clamped to `population_size`). |
| `rng` | `random.Random \| None` | unseeded | Pass a seeded RNG for reproducible runs. |
| `selection_strategy` | strategy | `ThresholdStrategy(threshold=0.0)` | Passed to the internal `DatasetEvaluator`. |
| `smoke_check` | `bool` | `True` | Run the base chain on the first case and check the metric before evolving; raises `RuntimeError` on an empty dataset, a failed run or a NaN score. |
| `max_concurrent_individuals` | `int` | `1` | Evaluate this many variants at once. |
| `checkpoint_path` | `str \| None` | `None` | Atomic checkpoint file (including RNG state) for crash-safe resume. |

`evolve(context_factory)` is async and returns an
[`EvolutionResult`](/carl/evolution/mutation-and-results/#results).

## Crossover

`ChainCrossover` splices a topological prefix of parent A onto a topological
suffix of parent B at one shared cut point, renumbers the steps `1..N`, and
re-points dangling dependencies at the last prefix step, so the child is
acyclic. Chain-level settings come from parent A. The child is round-tripped
through `from_dict` and `to_dict`; if that fails, or if the cut would break a
`loop_back_to`, a conditional branch target or a planned command's
`plan_source`, the operator returns a clone of parent A.

What crossover does not preserve: semantic coherence of the two halves, and
`$memory` / `$history` references across the cut (a suffix step may read a
key that only the discarded prefix wrote). Collaboration steps cross over
intact, with their sub-agents.

With `crossover_rate=0.0` (the default) no random number is drawn for
crossover, so an existing seeded run reproduces exactly. Children made by
crossover are recorded with `mutation_kind = CROSSOVER_KIND` (`"crossover"`)
and the better parent's score as `parent_score`, so they show up next to the
mutation operators in `format_mutation_effectiveness()`.

## Multi-objective

Pass a list of metrics plus a `fitness_fn` that weights them:

```python
evolver = ChainEvolver(
    base_chain=chain,
    dataset=dataset,
    metric=[AccuracyMetric(), BrevityMetric()],
    fitness_fn=lambda s: 0.7 * s["accuracy"] + 0.3 * s["brevity"],
    population_size=4, generations=3, elitism=1,
)
```

Metric names must be unique (`ValueError` otherwise). Without `fitness_fn`,
fitness is the mean of all metric scores.

## Cost preflight

Project the spend before running:

```python
estimate = evolver.estimate_cost(
    context_factory,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},   # USD per 1k input / output tokens
)
print(estimate.format_summary())   # smoke + population × generations × cases
```

`EvolutionCostEstimate` lists `total_chain_runs`, token totals,
`total_cost_usd` and `pricing_missing_models`. It multiplies a single-chain
[cost estimate](/carl/tracing/cost/) by the run size; mutations that add steps
make the real spend higher.

## See also

- [Mutation & results](/carl/evolution/mutation-and-results/)
- [Evaluation](/carl/evaluation/datasets/) — the dataset and metric the evolver scores on.
- [Evolution dashboard in the TUI](/care/tui/evolution/) — budget preview and live cost meter.
