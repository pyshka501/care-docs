---
title: Datasets & Evaluation
description: Batch-evaluate a chain over a dataset and read the report.
sidebar:
  order: 2
---

`DatasetEvaluator` runs a chain over every case in a dataset, scores each output
with a metric, and reports per-case results plus the worst cases for reflection.

## Build a dataset

A dataset yields `DataCase` objects (`input` required; optional `label`,
`expected`, `metadata`):

```python
from mmar_carl import DataCase, SimpleDataset

dataset = SimpleDataset([
    DataCase(input="Revenue grew 12% YoY.", expected="positive", label="case_01"),
    DataCase(input="Margins collapsed.",     expected="negative", label="case_02"),
])
```

`DataFrameDataset(df, input_col=..., expected_col=...)` wraps a pandas DataFrame
(needs `pip install 'mmar-carl[pandas]'`). For custom sources, subclass
`AbstractDataset` and implement `__iter__`.

## Run the evaluation

```python
from mmar_carl import DatasetEvaluator, ThresholdStrategy, ReasoningContext

evaluator = DatasetEvaluator(
    chain=chain,
    dataset=dataset,
    metric=MyMetric(),
    strategy=ThresholdStrategy(threshold=0.5),   # pick problem cases
)

report = await evaluator.evaluate_async(
    context_factory=lambda case: ReasoningContext(outer_context=case.input, api=client),
)
```

`context_factory` converts each `DataCase` into a `ReasoningContext` — that's where
you wire `case.input` (and any other fields) into the chain. Cases run
**sequentially** to stay within rate limits.

### Selection strategies

Pick which cases are flagged as "problems" for follow-up:

| Strategy | Selects |
| --- | --- |
| `ThresholdStrategy(threshold=…)` | cases scoring below the threshold. |
| `TopKWorstStrategy(k=…)` | the `k` lowest-scoring cases. |

## Reading the report

`DatasetEvaluationReport` carries per-case scores, step outcomes, latencies, and
step-level metric scores — plus printable formatters (no `[viz]` needed):

```python
print(report.format_failure_heatmap())      # cases × steps grid of ✓ / ✗
print(report.format_score_distribution())   # min / Q1 / median / Q3 / max box plot
print(report.format_latency_histogram())    # per-step sparkline + p50/p95/max
print(report.format_cost_trend(pricing=...)) # per-run cost with regression flag
```

In a Jupyter cell, just type `report` — `_repr_markdown_` renders a banner +
tables + diagrams.

## EvalSuite — golden-output regression

For docs/examples regression, `EvalSuite` is a lightweight golden-output harness:
record expected outputs once, then diff future runs (`EvalSuiteReport` /
`EvalSuiteDiff`).

## See also

- [Metrics](/carl/evaluation/metrics/)
- [Dataset evaluator example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/dataset_evaluator_example.py) in the repo.
