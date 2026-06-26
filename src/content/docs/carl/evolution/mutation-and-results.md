---
title: Mutation & Results
description: Configure how chains mutate, and read the EvolutionResult.
sidebar:
  order: 2
---

## ChainMutator

A `ChainMutator` defines the moves the evolver can make. You supply *pools* of
candidate values; each enabled mutation kind draws from its pool.

```python
from mmar_carl import ChainMutator, MutationKind

mutator = ChainMutator(
    temperature_pool=[0.1, 0.5],
    aim_suffix_pool=[" Be brief."],
    step_template_pool=[{"step_type": "llm", "title": "Verify", "aim": "..."}],
    allow_step_deletion=True,
    enabled_kinds=[
        MutationKind.PROMPT_REWRITE,
        MutationKind.INSERT_STEP,
        MutationKind.DELETE_STEP,
    ],
)
```

| Pool / flag | Feeds mutation kind |
| --- | --- |
| `model_pool` | `MODEL_SWAP` — swap a step's model. |
| `temperature_pool` | `TEMPERATURE_SWAP` — swap a step's temperature. |
| `max_workers_pool` | `MAX_WORKERS` — change chain parallelism. |
| `aim_suffix_pool` | `PROMPT_REWRITE` — append a hint to a step's `aim`. |
| `step_template_pool` | `INSERT_STEP` — splice in a verification step. |
| `allow_step_deletion` | `DELETE_STEP` — remove a leaf step (opt-in). |

If `enabled_kinds` is omitted, it's inferred from which pools you set. Every
mutation is re-validated via `from_dict`; invalid mutations roll back transparently.

## Results

`EvolutionResult` carries:

| Field | Type | Purpose |
| --- | --- | --- |
| `best_chain_spec` | `dict` | The winning chain, serialized — rehydrate with `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Fitness of the winner. |
| `best_generation` | `int` | Generation the winner appeared in. |
| `history` | `list[GenerationStats]` | Per-generation stats. |

Per-individual detail lives in `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind`, `parent_score`, and `scores_by_metric`
(for multi-objective runs).

### Visualising a run

`EvolutionResult` has text/PNG formatters:

```python
print(result.format_score_evolution())        # best score per generation
print(result.format_pareto())                  # multi-objective frontier
print(result.format_spend_vs_quality())        # tokens vs fitness
print(result.format_mutation_effectiveness())  # which mutations helped
print(result.to_lineage_mermaid())             # parent→child tree (winner highlighted)
```

For comparing several runs, the top-level `format_runs_pareto(results, ...)` draws a
cross-run Pareto chart. In Jupyter, type `result` to render it via `_repr_markdown_`.

## See also

- [Evolution overview](/carl/evolution/overview/)
- [The Evolution dashboard in MAESTRO CARE](/care/tui/evolution/) — the TUI surfaces these same results, plus a budget preview and a live cost meter.
- Tracing & visualization (next section) for run-level diagnostics.
