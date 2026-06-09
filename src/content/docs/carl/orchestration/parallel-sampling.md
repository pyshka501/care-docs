---
title: Parallel Sampling
description: Sample N answers in parallel and vote or judge the best (LLM council).
sidebar:
  order: 5
---

`ParallelSamplingStepDescription` runs the same reasoning **N times** and aggregates
the candidates — majority vote or an LLM judge. This is the "LLM council" pattern.

```python
from mmar_carl import (
    ParallelSamplingStepDescription, ParallelSamplingStepConfig, ParallelSamplingAggregation,
)

ParallelSamplingStepDescription(
    number=1,
    title="Sample answers",
    aim="Answer the question.",
    config=ParallelSamplingStepConfig(
        n_samples=5,
        aggregation=ParallelSamplingAggregation.MAJORITY_VOTE,
    ),
)
```

## ParallelSamplingStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `n_samples` | — | How many candidates to sample. |
| `aggregation` | — | How to pick a winner (below). |
| `judge_prompt` | `""` | Prompt for the `best_of_n` / `llm_judge` judge. |
| `normalize_for_vote` | — | Normalise text before majority comparison. |

### Aggregation strategies

| `ParallelSamplingAggregation` | Picks the winner by… |
| --- | --- |
| `MAJORITY_VOTE` | most common response (exact / normalised match). |
| `BEST_OF_N` | an LLM judge selects the best candidate. |
| `LLM_JUDGE` | alias for `best_of_n` with an explicit `judge_prompt`. |

:::tip
Run the council across different models by combining sampling with per-step
`llm_config` — see the [LLM council example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py).
:::

## See also

- [Debate](/carl/orchestration/debate/) — structured argument instead of independent samples.
