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

## Example

The repo's [token-usage example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/token_usage_example.py)
(mock client, no API key) walks three granularities: a pre-flight estimate, the
**actual** per-step token usage after a run, and aggregation across a batch.

```python
# 1. Pre-flight — no LLM calls made.
estimate = chain.estimate_cost(ctx, pricing=PRICING)
print(estimate.format_table())

# 2. Actuals — after execution, read per-step + chain-total usage.
result = await chain.execute_async(ctx)
for sr in result.step_results:
    print(sr.step_number, sr.token_usage)   # {"prompt", "completion", "total"} per step
print(result.token_usage)                   # chain totals
print(result.get_profiling_summary())       # peak/history bytes + total time
```

Actual usage requires a client that reports it (e.g. via
`get_response_with_usage`); chain totals are also available as the
`result.token_usage_by_step` property. Set
[`token_budget_warning`](/carl/steps/llm/#per-step-llm-config) on a step's
`LLMStepConfig` to warn when a step exceeds a token budget.

## See also

- [Visualization](/carl/tracing/visualization/) — `format_cost_by_model`, profiling tables.
- [Tracing](/carl/tracing/overview/) — real token usage after a run.
