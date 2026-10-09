---
title: Циклы
description: Повторять диапазон шагов, пока выполняется условие, с ограничением на число итераций.
sidebar:
  order: 8
---

Любой шаг может вернуться к более раннему шагу и так образовать тело цикла.
Задайте `loop_back_to` и `loop_config` на **последнем** шаге цикла.

После успешного завершения последнего шага исполнитель разрешает
`loop_config.condition_key`. Пока значение истинно и бюджет итераций не
исчерпан, тело цикла (все шаги с номерами от `loop_back_to` до последнего
включительно) сбрасывается и выполняется снова. Упавший последний шаг цикл не
запускает.

## LoopConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `condition_key` | `str` | `""` | [Ссылка на контекст](/ru/carl/chains/dynamic-references/) (`$metadata.step_N`, `$memory.ns.key`, `$history[-1]`, `$outer_context`, …). Её значение приводится к `bool`. Пусто = повторять всегда, до `max_iterations`. |
| `max_iterations` | `int` | `10` | Ограничитель: максимум повторных выполнений тела цикла (≥ 1). |
| `negate_condition` | `bool` | `False` | `False` = цикл while (продолжать, пока истинно). `True` = цикл until (продолжать, пока ложно). |

:::caution
`condition_key` это **ссылка**, а не выражение. Её значение приводится к булеву
типу, а неразрешённая ссылка считается ложной. Пусть флаг производит отдельный
шаг (инструмент, возвращающий `True`/`False`, который читают через
`$metadata.step_N`, или значение, записанное в `$memory.loop.needs_retry`).
Не кладите логику в строку условия. Учтите, что `$history[-1]` это непустая
строка, поэтому она всегда истинна.
:::

Когда бюджет исчерпан, цепочка просто идёт дальше после последнего шага цикла.
Достижение `max_iterations` не ошибка.

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, LoopConfig

# Steps 1–2 form the loop body; step 2 drives iteration.
ToolStepDescription(
    number=2,
    title="Refine answer",
    dependencies=[1],
    config=ToolStepConfig(tool_name="refiner", input_mapping={}),
    loop_back_to=1,
    loop_config=LoopConfig(
        condition_key="$memory.loop.needs_retry",  # truthy → loop again
        max_iterations=5,
    ),
)
```

Для цикла until (выполнять, пока флаг не станет истинным) задайте
`negate_condition=True`.

## Помощники циклов в ChainBuilder

`ChainBuilder.add_while_loop(body_steps, condition_key, max_iterations=10, start_number=None)`
и `add_until_loop(...)` оборачивают ручной API. Они перенумеровывают шаги тела,
начиная со `start_number` (по умолчанию следующий свободный номер), ставят
`loop_back_to` на последний шаг и добавляют `LoopConfig`. `add_while_loop`
продолжает, пока значение истинно. `add_until_loop` ставит
`negate_condition=True` и продолжает, пока значение не станет истинным.

:::note
Помощники не добавляют `dependencies` между шагами тела. Шаги тела без
зависимостей выполняются параллельно в одном батче. Если порядок внутри тела
важен, задайте зависимости сами, по номерам, которые назначит помощник.
:::

[Пример цикла](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/loop_until_example.py)
в репозитории (без API-ключа) показывает исследовательский цикл. Он продолжает
поиск, пока не наберётся достаточно фактов:

```python
body = [
    ToolStepDescription(number=0, title="Search Facts",
                        config=ToolStepConfig(tool_name="search_facts", input_mapping={})),
    ToolStepDescription(number=0, title="Evaluate Research",
                        config=ToolStepConfig(tool_name="evaluate_research", input_mapping={})),
    ToolStepDescription(number=0, title="Check Done",
                        config=ToolStepConfig(tool_name="check_done", input_mapping={})),
]

chain = (
    ChainBuilder()
    .add_until_loop(body_steps=body, condition_key="$metadata.step_3", max_iterations=10)
    .build()
)
```

В примере есть ещё цикл повторов до успеха, ручной API `loop_back_to` /
`loop_config` и разбор очереди через `add_while_loop`.

## История цикла

Каждый перезапуск записывает предыдущий проход в
`context.metadata["loop_iteration_history"]` по ключу `"<loop_back_to>-<tail>"`
(например, `"1-3"`). Каждая запись имеет вид `{"iteration": n, "results": [...]}`
с выгруженными результатами шагов этого прохода. В `ReasoningResult.step_results`
остаются только результаты последнего прохода.

За один батч перезапускается не больше одного цикла.

## См. также

- [Conditional-шаг](/ru/carl/steps/conditional/) для однократного ветвления.
- [Кэширование](/ru/carl/steps/caching/): мемоизация шагов тела цикла, которые видят одни и те же входы.
