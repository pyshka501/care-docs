---
title: Transform-шаг
description: Преобразование данных между шагами без вызова LLM.
sidebar:
  order: 5
---

`TransformStepDescription` преобразует данные **без** вызова LLM — дёшево, быстро
и детерминированно. Подходит для форматирования, извлечения или агрегации предыдущего вывода.

## TransformStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `transform_type` | `"extract" \| "format" \| "aggregate" \| "filter" \| "map"` | — (обязательное) | Вид преобразования. |
| `input_key` | `str` | `"$history[-1]"` | Откуда берётся входное значение. |
| `output_format` | `str \| None` | `None` | Шаблон вывода (для `format`). |
| `expression` | `str \| None` | `None` | Выражение для `extract` / `filter`. |
| `map_template` | `str \| None` | `None` | Шаблон для каждого элемента в `map`. |

## Пример

```python
from mmar_carl import TransformStepDescription, TransformStepConfig

TransformStepDescription(
    number=3,
    title="Format summary",
    dependencies=[2],
    config=TransformStepConfig(
        transform_type="format",
        input_key="$history[-1]",
        output_format="Summary: {value}",
    ),
)
```

## Смотрите также

- [Построение цепочек](/ru/carl/chains/builder/) — сокращение `add_transform_step()`.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — что принимает `input_key`.
