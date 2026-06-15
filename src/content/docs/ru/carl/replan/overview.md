---
title: Обзор RE-PLAN
description: Перепланирование во время выполнения — обнаружение проблем на ходу и откат к контрольной точке для повторной попытки.
sidebar:
  order: 1
---

RE-PLAN позволяет цепочке **реагировать во время выполнения**: после шага один или
несколько *чекеров* оценивают прогресс и могут решить повторить шаг, откатиться к
более ранней контрольной точке и запустить всё заново, перезапустить с начала или
завершить неудачей — всё в рамках бюджета, чтобы не зациклиться навсегда.

## Отмечаем контрольные точки

Цели отката — это шаги, которые вы отмечаете как контрольные точки:

```python
LLMStepDescription(
    number=2,
    title="Risk assessment",
    aim="Assess the risks.",
    checkpoint=True,
    checkpoint_name="risk_phase",
)
```

## Подключаем политику

Настройте RE-PLAN с помощью `ReplanPolicy` на цепочке. Здесь основанный на правилах чекер
повторяет текущий шаг каждый раз, когда ошибка содержит "rate limit":

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

Переключайте на уровне шага с помощью `replan_enabled=True/False` (по умолчанию — политика цепочки).

## Действия

Вердикт чекера запрашивает одно из значений `ReplanAction`:

| Действие | Эффект |
| --- | --- |
| `CONTINUE` | Продолжить в обычном режиме. |
| `RETRY_CURRENT_STEP` | Повторить только что завершившийся шаг. |
| `REPLAN_FROM_CHECKPOINT` | Откатиться к контрольной точке и запустить заново оттуда. |
| `RESTART_CHAIN` | Начать всю цепочку сначала. |
| `FAIL` | Немедленно завершить цепочку неудачей. |

## Структура политики

`ReplanPolicy` объединяет:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `enabled` | `bool` | Главный переключатель (по умолчанию `True`). |
| `checkers` | `list[...CheckerConfig]` | [Чекеры](/ru/carl/replan/checkers/), которые голосуют. |
| `aggregation` | `ReplanAggregationConfig` | Как объединяются голоса (см. [чекеры](/ru/carl/replan/checkers/)). |
| `trigger` | `ReplanTriggerConfig` | Когда проводить оценку (после каждого шага / только при неудачах / только на контрольных точках / для конкретных шагов). |
| `budgets` | `ReplanBudgetConfig` | Защита от бесконечного перепланирования. |

### Ограничение бюджета

`ReplanBudgetConfig` предотвращает бесконечные циклы:

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `max_replans_per_chain` | `3` | Всего действий RE-PLAN за запуск. |
| `max_replans_per_step` | `2` | Перепланирований, связанных с одним шагом. |
| `max_visits_per_checkpoint` | — | Ограничение повторных входов в контрольную точку. |
| `fail_on_budget_exhaustion` | — | Завершить неудачей (вместо продолжения) при исчерпании бюджета. |

## Пример

[Детерминированный пример RE-PLAN](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_deterministic_example.py)
из репозитория (mock-клиент, без API-ключа) запускает цепочку из 3 шагов для
служебной записки. Шаг 2 на первой попытке выдаёт `NEEDS_REPLAN`; основанный на
правилах чекер находит эту подстроку, повторяет шаг с обратной связью, и вторая
попытка завершается успешно.

```python
from mmar_carl import ReplanPolicy, RuleBasedReplanCheckerConfig, ReplanAction

policy = ReplanPolicy(
    enabled=True,
    checkers=[
        RuleBasedReplanCheckerConfig(
            name="risk_quality_guard",
            result_substrings=["NEEDS_REPLAN"],
            action_on_match=ReplanAction.RETRY_CURRENT_STEP,
            feedback_on_match=["Add explicit mitigation ownership and concrete risks."],
        )
    ],
)

chain = ReasoningChain(steps=steps, max_workers=1, replan_policy=policy)
result = chain.execute(context)

for event in result.replan_events:
    print(event.step_number, event.final_action, event.rollback_target)
```

`result.replan_events` фиксирует каждое решение RE-PLAN — шаг, выбранное
действие, подсчёт голосов чекеров (`event.aggregation`) и цель отката, если она есть.

## Смотрите также

- [Чекеры и агрегация](/ru/carl/replan/checkers/)
- [Примеры RE-PLAN](https://github.com/Glazkoff/carl-experiments/tree/main/examples/replan) в репозитории (детерминированный / LLM / голосование / контрольная точка / бюджет).
