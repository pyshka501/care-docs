---
title: Selection Step
description: Pick items from a list by score, sample, filter or keep all, without an LLM call.
sidebar:
  order: 22
---

`SelectionStepDescription` (`step_type: "selection"`, new in 0.5.0) picks items
from a collection. It makes no LLM call. Typical uses: keep the top-k
candidates, sample parents for an evolutionary loop, filter a shortlist before
a vote.

## Example

```python
from mmar_carl import (
    Language, ReasoningChain, ReasoningContext,
    SelectionStepConfig, SelectionStepDescription,
)

chain = ReasoningChain(steps=[
    SelectionStepDescription(
        number=1,
        title="Keep the best two",
        config=SelectionStepConfig(
            source="$outer_context.candidates",
            strategy="top_k",
            count=2,
            score_key="score",
            output_key="finalists",          # → $memory.default.finalists
        ),
    ),
    SelectionStepDescription(
        number=2,
        title="Drop weak candidates",
        config=SelectionStepConfig(
            source="$outer_context.candidates",
            strategy="filter",
            predicate="item['score'] >= 0.5",
        ),
    ),
])

context = ReasoningContext(
    outer_context="Pick finalists",
    runtime_input={"candidates": [
        {"id": "a", "score": 0.4},
        {"id": "b", "score": 0.9},
        {"id": "c", "score": 0.7},
    ]},
    api=client,                    # not called by selection steps
    language=Language.ENGLISH,
)
result = chain.execute(context)
# step 1 → [{'id': 'b', 'score': 0.9}, {'id': 'c', 'score': 0.7}]
# step 2 → [{'id': 'b', 'score': 0.9}, {'id': 'c', 'score': 0.7}]
```

## SelectionStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `source` | `str` | `"$history[-1]"` | [Reference](/carl/chains/dynamic-references/) to the collection. A list or tuple is used as is, `None` becomes `[]`, any other value becomes a one-item list. |
| `strategy` | `str` | `"top_k"` | `top_k`, `bottom_k`, `weighted`, `random`, `filter` or `all`. |
| `count` | `int` | `1` | How many items to pick (≥ 1). Ignored by `filter` and `all`. |
| `score_key` | `str \| None` | `None` | Dict key with each item's score, for `top_k` / `bottom_k` / `weighted`. `None` treats each item as its own number. A missing or non-numeric score counts as `0.0`. |
| `predicate` | `str \| None` | `None` | For `filter`: a `simpleeval` expression over `item` (alias `x`). Items where it is truthy are kept; an expression that raises drops the item. |
| `seed` | `int \| None` | `None` | RNG seed for `weighted` and `random`. Set it for reproducible runs. |
| `output_key` | `str \| None` | `None` | Also write the selection to memory under this key. |
| `namespace` | `str` | `"default"` | Memory namespace for `output_key`. |

## Strategies

| Strategy | Picks |
| --- | --- |
| `top_k` | The `count` highest scores. |
| `bottom_k` | The `count` lowest scores. |
| `weighted` | `count` items without replacement, with probability proportional to the score (negative scores count as 0; all-zero weights fall back to uniform). |
| `random` | `count` items uniformly, without replacement. |
| `filter` | Every item where `predicate` holds. Without a predicate, everything. |
| `all` | The whole collection. |

## Result

- `result_data` is the selection. With `count=1` the scored and random
  strategies return **a single item**, not a one-item list. `filter`, `all`
  and `count > 1` return a list. An empty source gives `None` for a
  single-item pick and `[]` otherwise.
- `result` is the same value as text (JSON for non-strings).
- The history entry is tagged `[SELECTION: <strategy>]`.

Read the selection downstream with `$steps.N.result_data` or, with
`output_key`, with `$memory.<namespace>.<key>`.

## See also

- [Transform step](/carl/steps/transform/): reshape data without an LLM call.
- [Parallel sampling](/carl/orchestration/parallel-sampling/): pick among N model answers by vote or judge.
- [Evolution](/carl/evolution/overview/).
