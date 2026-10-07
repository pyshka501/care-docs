---
title: Mutation & Results
description: Configure ChainMutator — scalar, structural and collaboration-topology operators — and read the EvolutionResult.
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
    sampling_n_pool=[3, 5],
)
print(sorted(k.value for k in mutator.enabled_kinds))
```

Pass `enabled_kinds=[...]` to restrict the search to a subset of the kinds
your pools allow.

### Scalar and structural operators

| Pool / flag | `MutationKind` | What it does |
| --- | --- | --- |
| `model_pool` | `MODEL_SWAP` | Set a step's model. |
| `temperature_pool` | `TEMPERATURE_SWAP` | Set a step's temperature. |
| `max_workers_pool` | `MAX_WORKERS` | Change chain parallelism (`int` or `"auto"`). |
| `aim_suffix_pool` | `PROMPT_REWRITE` | Append a hint to an LLM step's `aim`. |
| `step_template_pool` | `INSERT_STEP` | Insert a template step before the last step; it takes over the last step's dependencies and the last step then depends on it. |
| `allow_step_deletion` | `DELETE_STEP` | Remove a leaf step (one nothing depends on). |

### Collaboration-topology operators

These change **how** steps collaborate. They work because sub-agents are
serialized (chain format 11), so a wrapped step survives the evolver's
`to_dict()` / `from_dict()` cycle.

| Pool / flag | `MutationKind` | What it does |
| --- | --- | --- |
| `sampling_n_pool` (values ≥ 2) | `WRAP_IN_SAMPLING` | Turn an LLM step into a `parallel_sampling` step with the original as `base_step`. |
| `debate_pool` | `WRAP_IN_DEBATE` | Turn an LLM step into a `debate`. Each entry is a partial `DebateStepConfig` with at least two `roles`; the judge prompt defaults to the step's `aim`. |
| `allow_handoff_wrap` | `WRAP_IN_HANDOFF` | Turn an LLM step into an `agent_handoff` over a one-step sub-chain. |
| `supervisor_role_pool` | `SPLIT_TO_SUPERVISOR` | Turn an LLM step into a `supervisor` over specialist sub-chains. Each entry maps agent names to an aim directive (at least two agents). |
| `human_gate_prompt_pool` | `INSERT_HUMAN_GATE` | Insert a `human_input` review step before the final step. |
| `allow_collaboration_unwrap` | `UNWRAP_COLLABORATION` | Collapse a collaboration step back to its inner step. Refused when the step wraps more than one step. |

Every operator edits the JSON spec and keeps the replaced step's `number` and
`dependencies`, so the rest of the DAG is untouched. Every mutated spec is
re-validated with `from_dict` and re-serialized; an invalid mutation (or one
that would exceed the 8-level nesting limit) rolls back to a clone.

:::caution[Human gates need a provider]
A chain with an `INSERT_HUMAN_GATE` step needs
`context.on_human_input_requested` during evaluation. Without a provider the
step ends as `unavailable` and the variant scores as failed.
:::

## Results

`EvolutionResult` carries:

| Field | Type | Purpose |
| --- | --- | --- |
| `best_chain_spec` | `dict` | The winning chain, serialized; rehydrate with `ReasoningChain.from_dict(...)`. |
| `best_score` | `float` | Fitness of the winner. |
| `best_generation` | `int` | Generation the winner appeared in. |
| `history` | `list[GenerationStats]` | Per generation: `best_score`, `mean_score`, `population_scores`, `population_metrics`, `best_chain_spec`. |

Per-individual detail lives in `IndividualMetrics`: `score`, `wall_time_s`,
`total_tokens`, `llm_calls`, `mutation_kind` (a `MutationKind` value or
`"crossover"`), `parent_score`, and `scores_by_metric` for multi-objective
runs.

### Visualising a run

```python
print(result.format_score_evolution())        # best score per generation
print(result.format_pareto())                 # multi-objective frontier
print(result.format_spend_vs_quality())       # tokens vs fitness
print(result.format_mutation_effectiveness()) # mean score change per operator, incl. crossover
print(result.to_lineage_mermaid())            # parent → child tree, winner highlighted
```

`format_runs_pareto(results, labels=...)` compares several runs. In Jupyter,
type `result` to render it via `_repr_markdown_`.

## See also

- [Evolution overview](/carl/evolution/overview/)
- [Multi-agent steps](/carl/orchestration/overview/) — what the collaboration operators build.
- [Evolution dashboard in the TUI](/care/tui/evolution/)
