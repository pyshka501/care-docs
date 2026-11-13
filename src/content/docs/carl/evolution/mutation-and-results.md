---
title: Mutation & Results
description: Configure ChainMutator — scalar and structural operators — and read the EvolutionResult.
sidebar:
  order: 2
---

## ChainMutator

A `ChainMutator` defines the moves the evolver can make. Each mutation kind
is fed by a pool of candidate values or switched on by a flag. A kind is
enabled only when its pool is non-empty or its flag is `True`;
`ChainMutator()` with no arguments enables nothing and returns clones.

```python
from mmar_carl import ChainMutator, MutationKind

mutator = ChainMutator(
    temperature_pool=[0.1, 0.5],
    aim_suffix_pool=[" Be brief."],
    step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "Check the answer."}],
    allow_step_deletion=True,
)
print(sorted(k.value for k in mutator.enabled_kinds))
# ['delete_step', 'insert_step', 'prompt_rewrite', 'temperature_swap']
```

Pass `enabled_kinds=[...]` to restrict the search to a subset of the kinds
your pools allow.

### Operators

`MutationKind` has six values in 0.5.2.

| Pool / flag | `MutationKind` | What it does |
| --- | --- | --- |
| `model_pool` | `MODEL_SWAP` | Set a step's model. |
| `temperature_pool` | `TEMPERATURE_SWAP` | Set a step's temperature. |
| `max_workers_pool` | `MAX_WORKERS` | Change chain parallelism (`int` or `"auto"`). |
| `aim_suffix_pool` | `PROMPT_REWRITE` | Append a hint to an LLM step's `aim`. |
| `step_template_pool` | `INSERT_STEP` | Insert a template step before the last step; it takes over the last step's dependencies and the last step then depends on it. |
| `allow_step_deletion` | `DELETE_STEP` | Remove a leaf step (one nothing depends on). |

Every operator edits the JSON spec. Every mutated spec is re-validated with
`from_dict` and re-serialized; an invalid mutation rolls back to a clone.
`ChainMutator` does not check `frozen` in 0.5.2, although the field's own
description says it does. Only the graph and field helpers of `mmar_carl.meta`
skip frozen steps (see [EvoC primitives](/carl/evolution/overview/#evoc-primitives)).

## Results

`EvolutionResult` carries:

| Field | Type | Purpose |
| --- | --- | --- |
| `best_chain_spec` | `dict` | The winning chain, serialized; rehydrate with `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Fitness of the winner. |
| `best_generation` | `int` | Generation the winner appeared in. |
| `history` | `list[GenerationStats]` | Per generation: `best_score`, `mean_score`, `population_scores`, `population_metrics`, `best_chain_spec`. |

Per-individual detail lives in `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind` (a `MutationKind` value),
`parent_score`, `scores_by_metric` for multi-objective runs, and the lineage
fields `id`, `parent_id` and `mutation_records` that an external engine can
fill in.

### Visualising a run

```python
print(result.format_score_evolution())        # best score per generation
print(result.format_pareto())                 # multi-objective frontier
print(result.format_spend_vs_quality())       # tokens vs fitness
print(result.format_mutation_effectiveness()) # mean score change per operator
print(result.to_lineage_mermaid())            # parent → child tree, winner highlighted
```

`format_runs_pareto(results, labels=...)` compares several runs. In Jupyter,
type `result` to render it via `_repr_markdown_`.

## See also

- [Evolution overview](/carl/evolution/overview/)
- [Evolution dashboard in the TUI](/care/tui/evolution/)
