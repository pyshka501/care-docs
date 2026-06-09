---
title: Checkers & Aggregation
description: The deterministic, LLM, and registered checkers — and how their votes combine.
sidebar:
  order: 2
---

A RE-PLAN policy runs one or more **checkers** after a step. Each returns a verdict
(an action + reason + confidence); the policy's **aggregation** combines them into
one decision.

## Rule-based checker

Deterministic rules on the step's error/result text — fast and free.

```python
from mmar_carl import RuleBasedReplanCheckerConfig, ReplanAction

RuleBasedReplanCheckerConfig(
    name="rule_based",
    error_substrings=["rate limit", "timeout"],   # match against the error
    result_substrings=["I don't know"],           # match against the output
    action_on_failure=ReplanAction.RETRY_CURRENT_STEP,        # step failed
    action_on_match=ReplanAction.REPLAN_FROM_CHECKPOINT,      # a substring matched
    confidence=0.9,
)
```

Key fields: `trigger_on_failed_step`, `error_substrings`, `result_substrings`,
`action_on_failure`, `action_on_match`, `rollback_target_on_failure` /
`rollback_target_on_match`, `feedback_on_failure` / `feedback_on_match`.

## LLM checker

Asks an LLM whether (and how) to replan — flexible, costs a call.

```python
from mmar_carl import LLMReplanCheckerConfig

LLMReplanCheckerConfig(
    name="llm_replan",
    model="anthropic/claude-3.5-sonnet",  # optional per-checker override
    history_entries=6,                    # how much history to show the judge
    error_entries=4,
    retries=1,
)
```

It also takes a custom `prompt_template`, `temperature`, `max_tokens`, and
`parse_error_action` (what to do if the LLM's reply can't be parsed).

## Registered checker

Reference a checker you registered in code with
`context.register_replan_checker(name, checker)`:

```python
from mmar_carl import RegisteredReplanCheckerConfig

RegisteredReplanCheckerConfig(name="my_custom_checker")
```

## Aggregation

When a policy has several checkers, `ReplanAggregationConfig` decides the outcome:

```python
from mmar_carl import ReplanAggregationConfig, ReplanAggregationStrategy

ReplanAggregationConfig(
    strategy=ReplanAggregationStrategy.K_OF_N,
    k=2,                              # need 2 checkers to agree
    action_selection="priority",     # or "highest_confidence"
)
```

| Strategy | Replans when… |
| --- | --- |
| `ANY` | any checker votes to replan. |
| `ALL` | every checker votes to replan. |
| `K_OF_N` | at least `k` checkers vote to replan. |
| `MANDATORY_PLUS_K_OF_REST` | all `mandatory_checkers` agree **and** `k` of the rest do. |

`action_selection` decides which action wins when checkers disagree —
`"priority"` (by action severity) or `"highest_confidence"`.

## See also

- [RE-PLAN overview](/carl/replan/overview/) — policy, triggers, budgets, checkpoints.
