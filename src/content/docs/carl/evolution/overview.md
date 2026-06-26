---
title: Evolution Overview
description: Evolutionary search over chain variants with ChainEvolver.
sidebar:
  order: 1
---

`ChainEvolver` runs a genetic search over variants of a chain: it mutates a base
chain, scores each variant on your [dataset](/carl/evaluation/datasets/), keeps the
fittest, and repeats for a few generations.

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

## Constructor

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `base_chain` | `ReasoningChain` | — | The chain to evolve. |
| `dataset` | `AbstractDataset` | — | Cases each variant is scored on. |
| `metric` | `MetricBase \| list[MetricBase]` | — | One metric, or several (multi-objective). |
| `fitness_fn` | `Callable[[dict], float] \| None` | mean of metrics | Composes per-metric scores into one fitness. |
| `mutator` | `ChainMutator \| None` | `None` | What mutations to try — see [mutation](/carl/evolution/mutation-and-results/). |
| `population_size` | `int` | `6` | Variants per generation. |
| `generations` | `int` | `3` | Number of generations. |
| `elitism` | `int` | `2` | Top variants carried over unchanged. |
| `smoke_check` | `bool` | `True` | Validate the base chain before evolving. |
| `max_concurrent_individuals` | `int` | `1` | Evaluate this many variants at once. |
| `checkpoint_path` | `str \| None` | `None` | Atomic checkpoint file for crash-safe resume. |

`evolve(context_factory)` is async and returns an
[`EvolutionResult`](/carl/evolution/mutation-and-results/#results).

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

Metric names must be unique. With no `fitness_fn`, fitness is the mean of all
metric scores.

## Cost preflight

Project the spend before running:

```python
estimate = evolver.estimate_cost(
    context_factory,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},
)
print(estimate.format_summary())   # smoke + population × generations × cases
```

The same projection drives the budget preview in the TUI: the
[Evolution dashboard in MAESTRO CARE](/care/tui/evolution/) shows this estimate
and a live cost meter before and during a run.

## See also

- [Mutation & results](/carl/evolution/mutation-and-results/)
- [Evaluation](/carl/evaluation/datasets/) — the dataset + metric the evolver scores on.
- [The Evolution dashboard in MAESTRO CARE](/care/tui/evolution/) — run a GA with a budget preview and a live cost meter.
