---
title: Conditional-шаг
description: Переход к шагу на основе условного выражения.
sidebar:
  order: 6
---

`ConditionalStepDescription` вычисляет одно или несколько условий и направляет выполнение
к целевому шагу. Запускается шаг победившей ветви; нижестоящие шаги проигравших ветвей
пропускаются (настоящая маршрутизация).

## ConditionalStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `branches` | `list[ConditionalBranch]` | — (обязательное) | Упорядоченные ветви; побеждает первая, условие которой истинно. |
| `default_step` | `int \| None` | `None` | Шаг для запуска, если ни одна ветвь не совпала. |
| `condition_context_key` | `str` | `"$history[-1]"` | Значение, против которого вычисляются условия. |

Каждый `ConditionalBranch` имеет:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `condition` | `str` | Выражение, вычисляемое против контекста (использует `simpleeval`). |
| `next_step` | `int` | Номер шага для запуска, если условие истинно. |

## Пример

```python
from mmar_carl import ConditionalStepDescription, ConditionalStepConfig, ConditionalBranch

ConditionalStepDescription(
    number=2,
    title="Route on classification",
    dependencies=[1],
    config=ConditionalStepConfig(
        branches=[
            ConditionalBranch(condition="$history[-1] == 'yes'", next_step=3),
        ],
        default_step=4,
    ),
)
```

Выражения условий могут использовать [динамические ссылки](/ru/carl/chains/dynamic-references/)
(`$history[-1]`, `$memory.ns.key`, …) для проверки предыдущего вывода.

## Смотрите также

- [Циклы](/ru/carl/steps/loops/) — повторный запуск диапазона шагов до выполнения условия.
- [Пример условной маршрутизации](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) в репозитории.
