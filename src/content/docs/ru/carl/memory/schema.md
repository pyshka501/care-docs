---
title: Схема памяти
description: Валидация записей в память по схеме типов для раннего обнаружения ошибок соединений.
sidebar:
  order: 4
---

Передайте `memory_schema` в контекст для проверки типов записей в память. Когда шаг
пишет в объявленную пару `(namespace, key)` с неправильным типом, CARL вызывает
`MemorySchemaError` вместо тихого сохранения некорректных данных.

```python
from mmar_carl import ReasoningContext

context = ReasoningContext(
    outer_context=data,
    api=client,
    memory_schema={
        "results": {
            "score": float,
            "label": str,
            "tags": (list, tuple),   # a tuple of types = a union
        },
    },
)
```

## Как это работает

- Схема имеет вид `{namespace: {key: type_spec}}`.
- При каждом `memory_write` / `memory_append` в **объявленную** пару CARL запускает
  `validate_memory_write` и вызывает `MemorySchemaError` (подкласс `TypeError`)
  при несоответствии.
- Пары, **не** указанные в схеме, проходят без проверки — вы валидируете только то, что объявили.
- `type_spec` может быть одним типом или кортежем типов (объединение).

Это хорошо сочетается с предварительной проверкой, которая предупреждает, когда шаг читает
ключ `$memory.*`, не записанный ни одним предыдущим шагом, — вместе они ловят большинство
ошибок в соединениях памяти до выполнения любого LLM-вызова.

## Смотрите также

- [Обзор памяти](/ru/carl/memory/overview/)
- [Memory-шаги](/ru/carl/steps/memory/)
