---
title: Parallel Sampling
description: Run one LLM step N times in parallel and pick a winner by majority vote or by an LLM judge.
sidebar:
  order: 5
---

`ParallelSamplingStepDescription` runs `n_samples` copies of a template LLM step
(`base_step`) concurrently against the same context, then picks one winner. Only
the winner goes into history; all successful samples stay in `result_data`.

```python
import re

from mmar_carl import (
    LLMStepDescription,
    ParallelSamplingAggregation,
    ParallelSamplingStepConfig,
    ParallelSamplingStepDescription,
    VoteNormalization,
)

def final_answer(text: str) -> str:
    match = re.search(r"Final answer:\s*(.+)", text)
    return match.group(1) if match else text

ParallelSamplingStepDescription(
    number=2,
    title="Answer with voting",
    dependencies=[1],
    base_step=LLMStepDescription(
        number=2,
        title="_sample",
        aim="Answer the question. End with 'Final answer: <number>'.",
    ),
    config=ParallelSamplingStepConfig(
        n_samples=5,
        aggregation=ParallelSamplingAggregation.MAJORITY_VOTE,
        answer_extractor=final_answer,
        vote_normalization=VoteNormalization.AGGRESSIVE,
    ),
)
```

`base_step` is a required `LLMStepDescription`. Every sample runs the same base
step, including its `llm_config`, so all samples use one model. To compare
different models, run several LLM steps in parallel instead (see the
[LLM council example](https://github.com/Glazkoff/carl/blob/main/examples/agents/llm_council_example.py)).

## ParallelSamplingStepConfig

| Field | Default | Meaning |
| --- | --- | --- |
| `n_samples` | `5` | Number of samples, `>= 2`. |
| `aggregation` | `MAJORITY_VOTE` | How the winner is chosen (below). |
| `judge_prompt` | `""` | Judge template for `BEST_OF_N` / `LLM_JUDGE`. Placeholders `{n}` and `{candidates}` (a numbered list). Empty uses a built-in prompt that asks for the number only. |
| `normalize_for_vote` | `True` | Master switch. `False` compares samples byte for byte and ignores `vote_normalization`. |
| `vote_normalization` | `VoteNormalization.BASIC` | Canonical form before counting: `NONE` (raw), `BASIC` (`strip().lower()`), `AGGRESSIVE` (case-fold, collapse whitespace, strip surrounding punctuation). |
| `answer_extractor` | `None` | Callable `str -> str` applied to each sample before normalization, for example a final-answer or number extractor. If it raises, the raw sample is used. Not serialized. |
| `strict` | `False` | Turn every aggregation fallback into a step failure. |

## Aggregation

| `ParallelSamplingAggregation` | Winner |
| --- | --- |
| `MAJORITY_VOTE` (`"majority_vote"`) | The most common canonical form. The step returns the raw text of the first sample with that form. Ties go to the first occurrence. |
| `BEST_OF_N` (`"best_of_n"`) | An LLM judge replies with a candidate number; that raw candidate wins. |
| `LLM_JUDGE` (`"llm_judge"`) | Same code path as `BEST_OF_N`. |

The judge call uses the context's LLM client (`context.api`) with 2 retries. It
does not use the base step's `llm_config`.

## Fallbacks are recorded, not silent

Every run stores `result_data["aggregation_outcome"]`:

| Outcome | Meaning |
| --- | --- |
| `voted` | At least two samples shared the winning form. |
| `vote_degenerate_fallback_first` | Every sample was unique, so the "vote" returned sample 0. |
| `judged` | The judge reply held a valid candidate number. |
| `judge_unparseable_fallback_first` | The judge replied, but no valid number was found; the first candidate is returned. |
| `judge_error_fallback_vote` | The judge call raised; the winner comes from a majority vote and `judge_error` holds the message. |

Any outcome other than `voted` or `judged` emits a warning (`warnings.warn` and the
`mmar_carl` logger). With `strict=True` the step fails instead, and
`result_data` still carries the candidates and the outcome.

On free-form prose a plain vote almost always degenerates, because no two essays
are identical. Supply an `answer_extractor` so the vote counts answers, not texts.

## Result

`step_result.result` is the winning raw sample. The typed view:

```python
s = step_result.as_parallel_samples()
s.n_samples, s.n_successes, s.aggregation, s.candidates
s.aggregation_outcome
s.vote_distribution     # canonical form -> count, most common first
s.vote_winning_count
s.vote_total
s.vote_degenerate       # True when no two samples agreed
s.model_extra           # judge_reply, judge_selected_index, judge_error when present
```

Vote keys are filled for majority votes and for the judge-error fallback. Failed
samples are dropped; if all samples fail, the step fails. Token usage is summed
over all samples. After sampling, one `parallel_sampling.sample` intra-step event
per sample goes to `context.on_step_event`.

## Serialization

`to_dict()` writes `base_step` as a nested step dict (format 11). Chains saved at
format 10 or earlier load with a `__placeholder__` base step that you must replace.
`answer_extractor` is never serialized and loads as `None`.

## See also

- [Debate](/carl/orchestration/debate/): roles that argue instead of independent samples.
- [Evaluation](/carl/evaluation/metrics/): measure whether voting helps on your data.
