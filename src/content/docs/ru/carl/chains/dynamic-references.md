---
title: Динамические ссылки
description: Синтаксис ссылок $history / $memory / $metadata / $outer_context для связывания шагов.
sidebar:
  order: 4
---

Многие поля шагов принимают **строку-ссылку**, которую CARL разрешает на основе
контекста выполнения во время работы. Так более поздний шаг читает вывод более раннего,
значение из памяти или исходные входные данные.

## Синтаксис ссылок

| Ссылка | Разрешается в |
| --- | --- |
| `$history[-1]` | Вывод предыдущего шага по индексу (отрицательные индексы от конца). |
| `$history` | Полная текущая история как единая строка. |
| `$memory.namespace.key` | Значение из памяти в пространстве имён. `$memory.key` использует пространство имён `default`. |
| `$outer_context` | Исходные входные данные. Если они выглядят как JSON, разбираются автоматически. |
| `$metadata.path` | (Возможно вложенное) значение из метаданных контекста. |
| `$steps.path` | Вложенное значение из метаданных результатов шагов. |
| `$ltm.key` | Значение из долгосрочной памяти (если подключён LTM-бэкенд). |
| `$event.name` | Последний payload события с данным именем (см. шаги с событиями). |
| `"literal"` или `'literal'` | Строка в кавычках возвращается дословно (литерал, не ссылка). |

Всё остальное ищется как обычный ключ в метаданных контекста.

## Где используются ссылки

| Поле | На шаге | Типичное значение |
| --- | --- | --- |
| `input_mapping` | Tool | `{"data": "$history[-1]"}` |
| `argument_mapping` | MCP | `{"query": "$memory.input.query"}` |
| `value_source` | Memory (write/append) | `"$history[-1]"` |
| `condition` | Conditional branch | `"$history[-1] == 'yes'"` |
| `condition_context_key` | Conditional | `"$history[-1]"` |
| `condition_key` | [Loop](/ru/carl/steps/loops/) | `"$memory.loop.needs_retry"` |
| `input_source` | Structured output | `"$history[-1]"` |
| `input_key` | Transform | `"$history[-1]"` |

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

# Feed the previous step's output and a literal into a tool
ToolStepDescription(
    number=2,
    title="Summarise",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="summarise",
        input_mapping={
            "text": "$history[-1]",
            "topic": "$memory.input.topic",
            "style": "'concise'",          # a literal string
        },
    ),
)
```

:::tip
Предварительная валидация предупреждает, когда шаг читает ключ `$memory.*`, который
ни один предыдущий шаг не записывает — быстрый способ поймать опечатки в соединениях.
:::
