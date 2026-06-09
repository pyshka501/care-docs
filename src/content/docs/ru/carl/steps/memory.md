---
title: Memory-шаг
description: Чтение, запись, добавление, удаление и перечисление значений в общей памяти с пространствами имён.
sidebar:
  order: 4
---

`MemoryStepDescription` выполняет операцию над хранилищем памяти с пространствами имён —
полезно для сохранения промежуточных результатов, которые читают последующие шаги.

## MemoryStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `operation` | `MemoryOperation` | — (обязательное) | `read` / `write` / `append` / `delete` / `list`. |
| `memory_key` | `str` | — (обязательное) | Ключ в хранилище памяти. |
| `value_source` | `str \| None` | `None` | Откуда берётся значение при `write`/`append` (например, `"$history[-1]"`). |
| `default_value` | `Any` | `None` | Возвращается при `read`, если ключ отсутствует. |
| `namespace` | `str` | `"default"` | Пространство имён для изоляции. |

Память организована по схеме **пространство_имён → ключ**. Читать её в других местах можно через
[ссылку](/ru/carl/chains/dynamic-references/) `$memory.namespace.key`.

## Пример: запись и чтение

```python
from mmar_carl import MemoryStepDescription, MemoryStepConfig, MemoryOperation

# Step 3 stores step 2's output under results/analysis
MemoryStepDescription(
    number=3,
    title="Store result",
    dependencies=[2],
    config=MemoryStepConfig(
        operation=MemoryOperation.WRITE,
        memory_key="analysis",
        value_source="$history[-1]",
        namespace="results",
    ),
)

# A later step reads it back
MemoryStepDescription(
    number=5,
    title="Retrieve result",
    config=MemoryStepConfig(
        operation=MemoryOperation.READ,
        memory_key="analysis",
        namespace="results",
        default_value="(missing)",
    ),
)
```

:::note
При **параллельном** выполнении каждый шаг получает copy-on-write-представление памяти.
Записи параллельных «братьев» **не видны** друг другу — только последующим батчам.
:::

## Смотрите также

- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — чтение памяти через `$memory.*`.
- [Построение цепочек](/ru/carl/chains/builder/) — сокращение `add_memory_step()`.
