---
title: Metrics
description: Score step and chain outputs with built-in or custom metrics.
sidebar:
  order: 1
---

A **metric** turns a step or chain output into a numeric score. Attach metrics to
steps or to the chain; the scores land in the execution result (and feed
[reflection](/carl/evaluation/reflection/) and [dataset evaluation](/carl/evaluation/datasets/)).

## Attaching metrics

```python
LLMStepDescription(number=1, title="Summarise", aim="Summarise the text.",
                   metrics=[WordCountMetric()])           # step-level

chain = ReasoningChain(steps=steps, metrics=[CoverageMetric()])  # chain-level
```

A step metric receives a `StepExecutionResult`; a chain metric receives a
`ReasoningResult`.

## Built-in match metrics

For exact/expected-output checks, CARL ships ready-made metrics (great with
[datasets](/carl/evaluation/datasets/) and the `EvalSuite`):

```python
from mmar_carl import (
    ExactMatchMetric, CaseInsensitiveMatchMetric, ContainsMetric, RegexMatchMetric,
)
```

| Metric | Passes when the output… |
| --- | --- |
| `ExactMatchMetric` | equals the expected value. |
| `CaseInsensitiveMatchMetric` | equals it ignoring case. |
| `ContainsMetric` | contains the expected substring. |
| `RegexMatchMetric` | matches the expected regex. |

## Custom metrics

Subclass `MetricBase` — implement a `name` property and an async `compute_async`
returning a float. The score can be anything (word count, LLM-judge rating,
similarity…):

```python
from mmar_carl import MetricBase
from mmar_carl.models.results import ReasoningResult

class WordCountMetric(MetricBase):
    @property
    def name(self) -> str:
        return "word_count"

    async def compute_async(self, output) -> float:
        text = output.get_final_output() if isinstance(output, ReasoningResult) else output.result
        return float(len(text.split()))
```

:::note
`WordCountMetric` and an LLM-judge metric are shown in the repo's
[metrics example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py) —
they're custom metrics, not library imports.
:::

## Example

The repo's [metrics example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py)
runs with a mock LLM client (no API key) and defines four custom metrics —
`WordCountMetric`, `SentenceLengthMetric`, `KeywordCoverageMetric`, and a
`MockLLMJudgeMetric` (an async, I/O-shaped stand-in for an LLM-as-a-judge). It
attaches them at both granularities and reads the scores back off the result.

```python
steps = [
    LLMStepDescription(
        number=1, title="Data Overview", aim="Summarise the dataset",
        metrics=[WordCountMetric(), SentenceLengthMetric()],
    ),
    LLMStepDescription(
        number=2, title="Trend Analysis", aim="Identify revenue trends",
        dependencies=[1],
        metrics=[KeywordCoverageMetric(["growth", "revenue"]), MockLLMJudgeMetric()],
    ),
]

# Chain-level metrics run on the final step's output.
chain = ReasoningChain(steps=steps, metrics=[KeywordCoverageMetric(["recommend"])])
result = await chain.execute_async(context)

for sr in result.step_results:
    print(sr.step_number, sr.metrics)   # per-step scores → StepExecutionResult.metrics
print(result.metrics)                   # chain-level scores → ReasoningResult.metrics
```

Per-step scores land in `StepExecutionResult.metrics`; chain-level scores in
`ReasoningResult.metrics`. A metric that raises never aborts execution — the
score is simply omitted.

### Case-aware metrics

When evaluating a [dataset](/carl/evaluation/datasets/), a metric can opt in to
per-case ground truth by declaring a `case` parameter — CARL's `call_metric_async`
passes the current `DataCase`:

```python
async def compute_async(self, output, *, case=None) -> float:
    expected = case.expected if case else ""
    return 1.0 if output.get_final_output().strip() == expected else 0.0
```

## See also

- [Datasets & evaluation](/carl/evaluation/datasets/)
- [Reflection](/carl/evaluation/reflection/)
