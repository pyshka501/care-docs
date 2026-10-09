---
title: Conditional-шаг
description: Направить выполнение в одну ветку по условию.
sidebar:
  order: 6
---

`ConditionalStepDescription` по порядку проверяет свои ветки на одном значении и
направляет выполнение в первую подходящую. Выбранный шаг выполняется, остальные
ветки пропускаются. Вызова LLM нет.

## ConditionalStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `branches` | `list[ConditionalBranch]` | (обязательное) | Упорядоченные ветки. Побеждает первая с истинным условием. |
| `default_step` | `int \| None` | `None` | Шаг, который запускается, если ни одна ветка не подошла. |
| `condition_context_key` | `str` | `"$history[-1]"` | [Ссылка](/ru/carl/chains/dynamic-references/) на значение, которое проверяют условия. Неразрешённая ссылка превращается в `""`. |

У каждой `ConditionalBranch` есть:

| Поле | Тип | Назначение |
| --- | --- | --- |
| `condition` | `str` | Шаблон или выражение `simpleeval` (см. ниже). |
| `next_step` | `int` | Номер шага, который запустится, если условие истинно. |

## Условия

Условие видит **только разрешённое значение**, а не синтаксис ссылки. Выберите
значение через `condition_context_key`, затем проверяйте его.

Встроенные шаблоны (сравниваются со `str(value)`):

| Шаблон | Истинно, когда значение… |
| --- | --- |
| `contains:X` | содержит подстроку `X` (с учётом регистра). |
| `equals:X` | точно равно `X` (с учётом регистра). |
| `startswith:X` / `endswith:X` | начинается / заканчивается на `X`. |
| `matches:REGEX` | соответствует регулярному выражению (`re.search`). |
| `empty` / `nonempty` | пустое или состоит из пробелов / не пустое. |

Всё остальное считается выражением `simpleeval`, где значение привязано к `value`
(и `v`). Доступные функции: `len`, `str`, `int`, `float`, `abs`, `min`, `max`,
`sum`, `bool`. Примеры: `len(value) > 5`, `int(value) >= 70`,
`'error' in value or 'fail' in value`.

:::caution
Выражение, которое бросает исключение, молча считается **ложным**. Условие вроде
`$history[-1] == 'yes'` не даёт ошибки, оно просто никогда не срабатывает: ссылки
`$...` внутри выражения недоступны. Учтите и то, что `$history[-1]` (ключ по
умолчанию) это полная запись истории, `Step N. Title` плюс `Result: ...`. Поэтому
`equals:` на ней почти никогда не срабатывает. Чтобы проверить значение
результата шага N, используйте `$metadata.step_N`.
:::

## Правила маршрутизации

- Шаги веток должны объявлять зависимость от conditional-шага
  (`dependencies=[<conditional number>]`). Иначе они могут запуститься раньше,
  чем будет принято решение.
- После решения каждый ещё не выполненный шаг, который не является выбранным и не
  зависит от него (прямо или транзитивно), записывается как пропущенный
  (`skipped=True`, `success=True`). Шаг слияния, который зависит от выбранной
  ветки, всё равно выполняется.
- Если ни одна ветка не подошла и `default_step` нет, пропускаются все шаги,
  которые напрямую зависят от conditional-шага.
- `result_data` содержит `next_step` и `matched_condition` (сработавшее условие
  или `"(default)"`).

:::caution[Известная проблема: пропускаются и посторонние ожидающие шаги]
Правило пропуска не ограничено ветками самого conditional-шага. Шаг на
независимом пути, который ещё не выполнился к моменту решения (например, шаг,
зависящий от соседа conditional-шага), тоже пропускается и уже не запустится.
Шаг, выполненный в одном батче с conditional-шагом, может к тому же появиться в
`step_results` дважды: один раз как выполненный и один раз как пропущенный. Пока
это не исправлено, завершайте независимую работу до conditional-шага (сделайте
conditional-шаг зависимым от неё) или сделайте её зависимой от всех целей веток.
:::

## Пример

```python
from mmar_carl import ConditionalStepDescription, ConditionalStepConfig, ConditionalBranch

ConditionalStepDescription(
    number=2,
    title="Route on classification",
    dependencies=[1],
    config=ConditionalStepConfig(
        condition_context_key="$metadata.step_1",
        branches=[
            ConditionalBranch(condition="equals:yes", next_step=3),
        ],
        default_step=4,
    ),
)
```

[Пример условий](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/conditions_example.py)
в репозитории (без API-ключа) собирает маршрутизатор по тональности через
`ChainBuilder`. Инструмент классифицирует текст, затем conditional-шаг направляет
его в один из трёх обработчиков по шаблонам `contains:`. В фрагменте ниже к
обработчикам добавлено `dependencies=[2]`. В файле примера этого нет, поэтому там
все три обработчика выполняются в первом батче, до решения о маршруте.

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
    .add_tool_step(number=3, title="Handle Positive", tool_name="handle_positive",
                   input_mapping={}, dependencies=[2])
    .add_tool_step(number=4, title="Handle Negative", tool_name="handle_negative",
                   input_mapping={}, dependencies=[2])
    .add_tool_step(number=5, title="Handle Neutral", tool_name="handle_neutral",
                   input_mapping={}, dependencies=[2])
    .build()
)
```

## См. также

- [Циклы](/ru/carl/steps/loops/): повторять диапазон шагов, пока выполняется условие.
- [Evaluation-шаг](/ru/carl/steps/advanced/): встроенная проверка качества со своей маршрутизацией `on_fail`.
