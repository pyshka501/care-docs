---
title: Reflection
description: Have the chain analyse its own run and suggest improvements.
sidebar:
  order: 3
---

After a run, `chain.reflect(...)` asks an LLM to analyse how well the chain
accomplished the task — surfacing weak steps and concrete suggestions.

```python
result = chain.execute(context)

reflection = chain.reflect(
    task_description="Analyze customer sentiment and extract key themes",
)
print(reflection)
```

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `task_description` | `str` | — (required) | The original goal to judge against. |
| `context` | `ReasoningContext \| None` | `None` | Defaults to the last execution context. |
| `language` | `Language \| None` | `None` | Defaults to the context language. |
| `options` | `ReflectionOptions \| None` | `None` | Controls what goes into the prompt. |

It makes one LLM call through the context's client.

It raises `RuntimeError` if no run has happened yet.

## Options

`ReflectionOptions` tunes the reflection prompt:

```python
from mmar_carl import ReflectionOptions

chain.reflect(
    task_description="...",
    options=ReflectionOptions(include_dependency_analysis=False),
)
```

`ReflectionOptions` fields (all `include_*` default to `True`):
`include_chain_structure`, `include_step_definitions`,
`include_execution_metrics`, `include_dependency_analysis`,
`include_metric_scores`, `extra_feedback`, `max_output_preview_chars` (500),
`max_result_preview_chars` (300), `language`, `dataset_report` (a
`DatasetEvaluationReport` to include).

When `include_metric_scores=True` (default), any [metric](/carl/evaluation/metrics/)
scores are fed into the prompt as concrete quality signals — e.g. a low
`keyword_coverage` on a step nudges the model to suggest better
`step_context_queries`.

## Reflection over a dataset

Pair reflection with [`DatasetEvaluator`](/carl/evaluation/datasets/): a
`SelectionStrategy` (`ThresholdStrategy` / `TopKWorstStrategy`) picks the
worst-scoring cases so you reflect on the failures that matter.

## See also

- [Metrics](/carl/evaluation/metrics/) · [Datasets & evaluation](/carl/evaluation/datasets/)
- [Reflection example](https://github.com/Glazkoff/carl/blob/main/examples/evaluation/reflection_example.py) in the repo.
