---
title: Cost Estimation
description: Project token usage and USD spend before running a chain.
sidebar:
  order: 3
---

`chain.estimate_cost(...)` does a **dry run**: it walks the chain and projects
token usage and cost per LLM-calling step — without making a single API call.

```python
estimate = chain.estimate_cost(
    context,
    pricing={"qwen/qwen3-8b": (0.00002, 0.00006)},   # {model: (input_per_1k, output_per_1k)}
    default_output_tokens=512,
)
print(estimate.format_table())
```

## Parameters

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `context` | `ReasoningContext` | — | Provides the input the estimate is sized against. |
| `pricing` | `dict[str, tuple[float, float]] \| None` | `None` | Per-model `(input_per_1k_usd, output_per_1k_usd)`. |
| `default_output_tokens` | `int` | `512` | Assumed output length per step. |
| `char_per_token` | `int` | `4` | Heuristic for input token counting. |

It returns a `CostEstimate` (with a `StepCostEstimate` per step). Models missing
from `pricing` are reported so you know what's uncounted.

## Reading it

```python
print(estimate.format_table())   # per-step token / USD table
```

In Jupyter, type `estimate` — `_repr_markdown_` renders a banner + table.

## Estimating an evolution run

To project the spend of a whole [evolution](/carl/evolution/overview/) (smoke +
population × generations × cases), use `evolver.estimate_cost(context_factory,
pricing=...)` instead — it multiplies a single chain estimate by the run size.

## See also

- [Visualization](/carl/tracing/visualization/) — `format_cost_by_model`, profiling tables.
- [Tracing](/carl/tracing/overview/) — real token usage after a run.
