---
title: Метаданные MAESTRO
description: Прикрепите типизированное происхождение к цепочке и повторно инициализируйте контекст из него.
sidebar:
  order: 4
---

MAESTRO проставляет типизированный блок происхождения в `chain.metadata["care"]`, чтобы
сохранённая цепочка помнила задачу, для которой была сгенерирована, прикреплённые файлы,
кто её создал, и её теги. Вы можете читать/писать его двумя методами `ReasoningChain`.

## Запись и чтение

```python
from mmar_carl import CareChainMetadata, CareContextFile

# kwargs form (handy in code / tests)
chain.set_care_metadata(
    task_description="Summarise the quarterly report",
    context_files=[CareContextFile(path="report.pdf", size_bytes=20480)],
    display_name="Quarterly summariser",
    tags=["finance", "summary"],
)

# or hand over a ready model (CARE's usual path)
chain.set_care_metadata(meta=CareChainMetadata(task_description="..."))

meta = chain.get_care_metadata()   # -> CareChainMetadata | None
```

Передайте **либо** `meta=`, **либо** отдельные kwargs — смешивание вызывает `ValueError`.
`get_care_metadata()` возвращает `None`, когда у цепочки нет блока `care` (т.е. она не
была создана инструментом с поддержкой MAESTRO).

### Поля CareChainMetadata

`task_description`, `context_files` (список `CareContextFile{path, size_bytes}`),
`generated_by`, `mage_metadata` (dict), `display_name`, `description`, `tags`.
Ключ пространства имён — `CARE_METADATA_NAMESPACE` (`"care"`).

## Повторная инициализация контекста из сохранённой цепочки

`ReasoningContext.from_chain_inputs` строит свежий контекст из метаданных MAESTRO цепочки —
точка входа «перезапустить из библиотеки»:

```python
context = ReasoningContext.from_chain_inputs(
    chain,
    api=client,
    outer_context=None,             # falls back to the saved task_description
    load_files_from_metadata=True,  # re-read the attached context_files
)
result = await chain.execute_async(context)
```

Передайте `files={...}`, чтобы переопределить содержимое файлов, или `outer_context=`,
чтобы переопределить вход; любые дополнительные `**kwargs` (например, `language=`,
`system_prompt=`) пробрасываются дальше.

## Смотрите также

- [Preflight](/ru/carl/care-integration/preflight/) · [RunRecord](/ru/carl/care-integration/run-record/)
- [JSON-сериализация](/ru/carl/serialization/json/) — метаданные MAESTRO проходят round-trip вместе с цепочкой.
