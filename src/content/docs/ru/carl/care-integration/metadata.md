---
title: Метаданные цепочки
description: Блок metadata["care"] — задача, файлы, теги и контракт входа Maestro — и повторная подготовка контекста из него.
sidebar:
  order: 4
---

У цепочки есть свободный словарь `metadata`, он сохраняется вместе с JSON.
Maestro хранит свои данные под ключом `care` (`CARE_METADATA_NAMESPACE`):
задачу, для которой цепочка создана, прикреплённые файлы, отображаемое имя,
теги и контракт входа.

## Типизированный доступ

```python
from mmar_carl import CareChainMetadata, CareContextFile

chain.set_care_metadata(
    task_description="Summarise the quarterly report",
    context_files=[CareContextFile(path="report.pdf", size_bytes=20480)],
    display_name="Quarterly summariser",
    tags=["finance", "summary"],
)
# или: chain.set_care_metadata(meta=CareChainMetadata(task_description="..."))

meta = chain.get_care_metadata()   # -> CareChainMetadata | None
```

Передайте либо `meta=`, либо именованные поля. Смешивание даёт `ValueError`.
`get_care_metadata()` возвращает `None`, если блока `care` нет.

Поля `CareChainMetadata`: `task_description`, `context_files`
(`CareContextFile{path, sha256, size_bytes}`), `generated_by`,
`mage_metadata`, `display_name`, `description`, `tags`.

:::caution
`set_care_metadata()` **заменяет** весь блок `care` типизированными полями.
Ключи, которых нет в `CareChainMetadata`, пропадают, в том числе
`runtime_input_schema` Maestro. Непереданные именованные поля тоже
сбрасываются (проверено на 0.5.0). Чтобы поменять одно значение в цепочке из
Maestro, правьте `chain.metadata["care"]` напрямую.
:::

## Контракт входа Maestro

Цепочки, которые Maestro сгенерировал или сохранил, содержат JSON Schema
(Draft 2020-12, схема объекта) в `metadata["care"]["runtime_input_schema"]`.
Перед запуском Maestro проверяет по ней вход пользователя и передаёт результат
как `ReasoningContext.runtime_input`. Шаги читают поля через
`$outer_context.<field>`. Сам CARL этот ключ не читает. Это соглашение хоста,
которое путешествует вместе с цепочкой. См.
[обзор интеграции](/ru/carl/care-integration/overview/#как-maestro-запускает-цепочку).

## Подготовить контекст из сохранённой цепочки

`ReasoningContext.from_chain_inputs` строит контекст из блока `care`. Это
точка входа «перезапустить из библиотеки» для CLI и TUI:

```python
context = ReasoningContext.from_chain_inputs(
    chain,
    api=client,
    outer_context=None,             # тогда берётся сохранённый task_description
    load_files_from_metadata=True,  # заново прочитать context_files
)
result = await chain.execute_async(context)
```

`files={...}` переопределяет содержимое файлов, `outer_context=` — вход.
Остальные именованные аргументы (`language=`, `system_prompt=`,
`runtime_input=`, …) уходят в конструктор `ReasoningContext`.

## См. также

- [Preflight](/ru/carl/care-integration/preflight/) · [RunRecord](/ru/carl/care-integration/run-record/)
- [JSON-сериализация](/ru/carl/serialization/json/) — `metadata` сохраняется вместе с цепочкой.
