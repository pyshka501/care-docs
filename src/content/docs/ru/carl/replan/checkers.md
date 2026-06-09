---
title: Чекеры и агрегация
description: Детерминированные, LLM и зарегистрированные чекеры — и как их голоса объединяются.
sidebar:
  order: 2
---

Политика RE-PLAN запускает один или несколько **чекеров** после шага. Каждый возвращает
вердикт (действие + причина + уверенность); **агрегация** политики объединяет их в
одно решение.

## Чекер на основе правил

Детерминированные правила по тексту ошибки/результата шага — быстро и бесплатно.

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

Ключевые поля: `trigger_on_failed_step`, `error_substrings`, `result_substrings`,
`action_on_failure`, `action_on_match`, `rollback_target_on_failure` /
`rollback_target_on_match`, `feedback_on_failure` / `feedback_on_match`.

## LLM-чекер

Спрашивает у LLM, нужно ли перепланировать (и как) — гибко, требует вызова.

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

Также принимает пользовательский `prompt_template`, `temperature`, `max_tokens` и
`parse_error_action` (что делать, если ответ LLM нельзя разобрать).

## Зарегистрированный чекер

Ссылается на чекер, зарегистрированный в коде через
`context.register_replan_checker(name, checker)`:

```python
from mmar_carl import RegisteredReplanCheckerConfig

RegisteredReplanCheckerConfig(name="my_custom_checker")
```

## Агрегация

Когда в политике несколько чекеров, `ReplanAggregationConfig` определяет исход:

```python
from mmar_carl import ReplanAggregationConfig, ReplanAggregationStrategy

ReplanAggregationConfig(
    strategy=ReplanAggregationStrategy.K_OF_N,
    k=2,                              # need 2 checkers to agree
    action_selection="priority",     # or "highest_confidence"
)
```

| Стратегия | Перепланирует, когда… |
| --- | --- |
| `ANY` | любой чекер голосует за перепланирование. |
| `ALL` | все чекеры голосуют за перепланирование. |
| `K_OF_N` | как минимум `k` чекеров голосуют за перепланирование. |
| `MANDATORY_PLUS_K_OF_REST` | все `mandatory_checkers` согласны **и** `k` из остальных тоже. |

`action_selection` определяет, какое действие побеждает при разногласии чекеров —
`"priority"` (по серьёзности действия) или `"highest_confidence"`.

## Смотрите также

- [Обзор RE-PLAN](/ru/carl/replan/overview/) — политика, триггеры, бюджеты, контрольные точки.
