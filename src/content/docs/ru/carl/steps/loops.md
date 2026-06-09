---
title: Циклы
description: Повторный запуск диапазона шагов до выполнения условия с ограничением числа итераций.
sidebar:
  order: 8
---

Любой шаг может вернуться к более раннему шагу, образуя тело цикла. Прикрепите
`loop_back_to` и `loop_config` к **последнему** шагу цикла.

После успешного завершения последнего шага исполнитель вычисляет
`loop_config.condition_key`; пока оно остаётся истинным (и бюджет итераций
не исчерпан), тело цикла — шаги от `loop_back_to` до последнего включительно — сбрасывается
и запускается снова.

## LoopConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `condition_key` | `str` | `""` | [Ссылка на контекст](/ru/carl/chains/dynamic-references/) (`$memory.ns.key`, `$history[-1]`, `$outer_context`), разрешённое значение которой приводится к `bool`. Пустая строка = «цикл всегда» вплоть до `max_iterations`. |
| `max_iterations` | `int` | `10` | Ограничение бюджета — максимальное число повторных выполнений тела цикла (≥ 1). |
| `negate_condition` | `bool` | `False` | `False` = while-цикл (продолжать, пока истинно). `True` = until-цикл (продолжать, пока ложно). |

:::caution
`condition_key` — это **ссылка**, а не произвольное выражение: её *разрешённое
значение* приводится к булеву. Пусть более ранний шаг запишет флаг (например,
`$memory.loop.needs_retry`) вместо того, чтобы встраивать логику в строку условия.
:::

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, LoopConfig

# Steps 1–2 form the loop body; step 2 drives iteration.
ToolStepDescription(
    number=2,
    title="Refine answer",
    config=ToolStepConfig(tool_name="refiner", input_mapping={}),
    loop_back_to=1,
    loop_config=LoopConfig(
        condition_key="$memory.loop.needs_retry",  # truthy → loop again
        max_iterations=5,
    ),
)
```

Для until-цикла (выполнять, пока флаг не станет истинным) установите `negate_condition=True`.

## Смотрите также

- [Пример цикла](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py) в репозитории.
- [Conditional-шаг](/ru/carl/steps/conditional/) для однократного ветвления.
