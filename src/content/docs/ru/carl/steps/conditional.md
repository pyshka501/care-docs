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

## Шаблоны условий

Помимо обычных выражений `simpleeval`, условия ветвей принимают набор встроенных
сокращённых шаблонов (сопоставляются с разрешённым значением `condition_context_key`):

| Шаблон | Совпадает, когда значение… |
| --- | --- |
| `contains:X` | содержит подстроку `X`. |
| `equals:X` | в точности равно `X` (с учётом регистра). |
| `startswith:X` / `endswith:X` | начинается / заканчивается на `X`. |
| `matches:REGEX` | соответствует регулярному выражению. |
| `empty` / `nonempty` | пусто / непусто (с учётом пробельных символов). |

Всё остальное вычисляется как выражение `simpleeval`, где `value` привязано к
разрешённому входу — например, `len(value) > 5`, `int(value) >= 70` или
`'error' in value or 'fail' in value`.

## Пример

[Пример условий](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py)
из репозитория (без API-ключа) строит маршрутизатор тональности с помощью
`ChainBuilder`: инструмент классифицирует текст, затем conditional-шаг направляет
выполнение к одному из трёх обработчиков по шаблонам `contains:`.

```python
chain = (
    ChainBuilder()
    .add_tool_step(number=1, title="Classify Sentiment",
                   tool_name="classify_text", input_mapping={"text": "$outer_context"})
    .add_conditional_step(
        number=2, title="Route by Sentiment",
        condition_context_key="$metadata.step_1",
        branches=[("contains:positive", 3), ("contains:negative", 4), ("contains:neutral", 5)],
        default_step=5, dependencies=[1],
    )
    .add_tool_step(number=3, title="Handle Positive", tool_name="handle_positive", input_mapping={})
    .add_tool_step(number=4, title="Handle Negative", tool_name="handle_negative", input_mapping={})
    .add_tool_step(number=5, title="Handle Neutral", tool_name="handle_neutral", input_mapping={})
    .build()
)
```

В `result_data` conditional-шага записываются `matched_condition` (условие
победившей ветви или `"(default)"`) и `next_step` (шаг, к которому он направил
выполнение).

## Смотрите также

- [Циклы](/ru/carl/steps/loops/) — повторный запуск диапазона шагов до выполнения условия.
- [Пример условной маршрутизации](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) в репозитории.
