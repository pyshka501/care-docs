---
title: RE-PLAN Overview
description: Runtime replanning — detect trouble mid-run and roll back to a checkpoint to try again.
sidebar:
  order: 1
---

RE-PLAN lets a chain **react at runtime**: after a step, one or more *checkers*
evaluate progress and can decide to retry the step, roll back to an earlier
checkpoint and re-run, restart, or fail — all bounded by a budget so it can't loop
forever.

## Mark checkpoints

Roll-back targets are steps you mark as checkpoints:

```python
LLMStepDescription(
    number=2,
    title="Risk assessment",
    aim="Assess the risks.",
    checkpoint=True,
    checkpoint_name="risk_phase",
)
```

## Attach a policy

Configure RE-PLAN with a `ReplanPolicy` on the chain. Here a rule-based checker
retries the current step whenever an error contains "rate limit":

```python
from mmar_carl import (
    ReasoningChain, ReplanPolicy, RuleBasedReplanCheckerConfig, ReplanAction,
)

policy = ReplanPolicy(
    checkers=[
        RuleBasedReplanCheckerConfig(
            error_substrings=["rate limit"],
            action_on_match=ReplanAction.RETRY_CURRENT_STEP,
        ),
    ],
)

chain = ReasoningChain(steps=steps, replan_policy=policy)
```

Toggle it per step with `replan_enabled=True/False` (defaults to the chain policy).

## Actions

A checker's verdict requests one of these `ReplanAction` values:

| Action | Effect |
| --- | --- |
| `CONTINUE` | Proceed normally. |
| `RETRY_CURRENT_STEP` | Re-run the step that just finished. |
| `REPLAN_FROM_CHECKPOINT` | Roll back to a checkpoint and re-run from there. |
| `RESTART_CHAIN` | Start the whole chain over. |
| `FAIL` | Fail the chain immediately. |

## Policy structure

`ReplanPolicy` bundles:

| Field | Type | Purpose |
| --- | --- | --- |
| `enabled` | `bool` | Master switch (default `True`). |
| `checkers` | `list[...CheckerConfig]` | The [checkers](/carl/replan/checkers/) that vote. |
| `aggregation` | `ReplanAggregationConfig` | How votes combine (see [checkers](/carl/replan/checkers/)). |
| `trigger` | `ReplanTriggerConfig` | When to evaluate (after each step / only failures / only checkpoints / specific steps). |
| `budgets` | `ReplanBudgetConfig` | Guards against infinite replanning. |

### Budget guards

`ReplanBudgetConfig` prevents runaway loops:

| Field | Default | Purpose |
| --- | --- | --- |
| `max_replans_per_chain` | `3` | Total replan actions per run. |
| `max_replans_per_step` | `2` | Replans attributable to one step. |
| `max_visits_per_checkpoint` | — | Cap re-entries of a checkpoint. |
| `fail_on_budget_exhaustion` | — | Fail (vs continue) when the budget runs out. |

## See also

- [Checkers & aggregation](/carl/replan/checkers/)
- [RE-PLAN examples](https://github.com/Glazkoff/carl-experiments/tree/main/examples/replan) in the repo (deterministic / LLM / voting / checkpoint / budget).
