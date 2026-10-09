---
title: Transform-шаг
description: Преобразование данных между шагами без вызова LLM.
sidebar:
  order: 5
---

`TransformStepDescription` преобразует данные **без** вызова LLM. Это дёшево,
быстро и детерминированно. Используйте его, чтобы форматировать, извлекать,
фильтровать или склеивать результаты предыдущих шагов.

## TransformStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `transform_type` | `"extract" \| "format" \| "aggregate" \| "filter" \| "map"` | (обязательное) | Вид преобразования. |
| `input_key` | `str` | `"$history[-1]"` | [Ссылка](/ru/carl/chains/dynamic-references/) на входные данные. Неразрешённая ссылка превращается в `""`. |
| `output_format` | `str \| None` | `None` | Шаблон для `format`. Вход доступен как `{input}`. |
| `expression` | `str \| None` | `None` | Регулярное выражение для `extract` / `filter`. |
| `map_template` | `str \| None` | `None` | Шаблон для каждого элемента в `map`. Элемент доступен как `{item}`. |

## Что делает каждый тип

| `transform_type` | Поведение |
| --- | --- |
| `extract` | `re.findall(expression, str(input))`, список совпадений. Без `expression` возвращает вход без изменений. |
| `format` | `output_format.format(input=input)`. Без `output_format` даёт `str(input)`. |
| `aggregate` | Список склеивается через перевод строки. Всё остальное превращается в `str(input)`. |
| `filter` | Оставляет элементы списка (или строки текста), для которых срабатывает `re.search(expression, ...)`. Без `expression` возвращает вход без изменений. |
| `map` | Применяет `map_template.format(item=item)` к каждому элементу списка. Не список возвращается без изменений. |

В `result_data` лежит преобразованное значение, в `result` то же значение строкой
(JSON для нестроковых значений).

:::caution
`format` знает только заполнитель `{input}`, а `map` только `{item}`. Любой
другой заполнитель (например, `{value}`) вызывает `KeyError` и роняет шаг.
Буквальные фигурные скобки нужно удваивать: `{{` и `}}`.
:::

## Пример

```python
from mmar_carl import TransformStepDescription, TransformStepConfig

TransformStepDescription(
    number=3,
    title="Format summary",
    dependencies=[2],
    config=TransformStepConfig(
        transform_type="format",
        input_key="$metadata.step_2",
        output_format="Summary: {input}",
    ),
)
```

`$metadata.step_2` это значение результата шага 2. `$history[-1]` дал бы всю
запись истории, вместе с заголовком `Step N. Title`.

## См. также

- [Сборка цепочек](/ru/carl/chains/builder/): сокращение `add_transform_step()`.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/): что принимает `input_key`.
