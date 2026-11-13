---
title: Evolution Overview
description: Evolutionary search over chain variants with ChainEvolver — mutation, multi-objective fitness, cost preflight — and the EvoC primitives for external evolution engines.
sidebar:
  order: 1
---

`ChainEvolver` runs a genetic search over variants of a chain. Each generation
it scores every variant on your [dataset](/carl/evaluation/datasets/), keeps
the best (`elitism`), and breeds the rest by **mutating** a parent. There is
no crossover operator in 0.5.2.

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
        aim_suffix_pool=[" Be brief."],                                       # prompt rewrite
        step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "Check the answer."}],  # insert a step
    ),
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

## EvoC primitives

Since 0.5.0 CARL also ships the building blocks for an **external** evolution
engine (EvoC) that edits chain specs as data. They are top-level exports:

| Need | Names |
| --- | --- |
| Step catalog and spec checks | `get_step_catalog`, `validate_spec`, `validate_and_build`, `auto_generate_minimal_step`, `schema_for` |
| Field-level edits | `mutable_fields`, `get_field_by_path`, `set_field_by_path`, `iter_mutable_values`, `sample_field_value`, `mutate_content`, `mutable_targets` |
| Graph edits | `insert_step_at`, `remove_step`, `rewire_dependencies`, `change_step_type`, `apply_records`, `MutationRecord`, `MutationError` |
| Graph queries | `find_root_steps`, `find_leaf_steps`, `dependents_of`, `steps_of_type`, `deletable_steps`, `can_delete_step` |
| Freezing | `StepDescriptionBase.frozen`, `frozen_step_numbers`; mutation helpers honour `respect_frozen=True` |
| Tools as data | `CodeTool`, `CodeToolLibrary`, `validate_code_tool`, `compile_code_tool`; running them needs `ReasoningContext(allow_code_tools=True)` |
| Run descriptors | `RunDescriptor`, `ComplexityDescriptor`, `extract_run_descriptor`, `extract_complexity` |
| Pareto | `pareto_front`, `pareto_rank`, `dominates` |
| Datasets | `subsample`, `split`, `select_cases`, `CaseSplit`, `CaseDiff` |

`validate_spec` also checks dataflow: an explicit `$steps.N` input must point
at a declared predecessor (error code `step_result_without_dependency`).
`ReasoningChain.from_dict` does not run this check. Graph edits run it before
they accept a change. `IndividualMetrics` gained `id`, `parent_id` and `mutation_records`, so
`to_lineage_mermaid()` can draw exact lineage.

## See also

- [Mutation & results](/carl/evolution/mutation-and-results/)
- [Evaluation](/carl/evaluation/datasets/) — the dataset and metric the evolver scores on.
- [Evolution dashboard in the TUI](/care/tui/evolution/) — budget preview and live cost meter.
