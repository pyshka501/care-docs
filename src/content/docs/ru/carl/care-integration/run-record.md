---
title: RunRecord
description: Долговечная, воспроизводимая запись одного выполнения цепочки.
sidebar:
  order: 3
---

`RunRecord` собирает всё об одном выполнении — снимок цепочки, вход, (без потерь) результат
и тайминги — в единую JSON-сериализуемую запись. Именно её MAESTRO хранит как историю прогонов
и именно её читает обратно [`care replay`](/ru/care/cli/generate-run/).

## Захват прогона

```python
from datetime import datetime, timezone
from mmar_carl import RunRecord

started = datetime.now(timezone.utc)
result = await chain.execute_async(context)

record = RunRecord.from_run(
    chain=chain,
    context=context,
    result=result,
    started_at=started,
    chain_id="my-chain",        # optional
    chain_version="v3",         # optional
)
```

`from_run` делает снимок `chain.to_dict()`, захватывает `outer_context` + память +
метаданные контекста (отбрасывая внутренние для фреймворка ключи с префиксом `__`) и
проставляет `finished_at = now()`, если вы не передали его.

## Поля

| Поле | Значение |
| --- | --- |
| `chain_id` / `chain_version` | Идентичность выполненной цепочки (опционально). |
| `chain_dict` | Полная сериализованная цепочка (долговечный снимок). |
| `input` | `{outer_context, memory}`, с которых начался прогон. |
| `result` | Результат `ReasoningResult` без потерь. |
| `started_at` / `finished_at` | Временные метки. |
| `runtime_info` | Версия библиотеки + информация об окружении. |

## Сохранение и перезагрузка

```python
record.save("runs/run-001.json")
loaded = RunRecord.load("runs/run-001.json")

d = record.to_dict();  RunRecord.from_dict(d)
```

Затем пройдите по нему с помощью [`care replay run-001.json`](/ru/care/cli/generate-run/).

## Смотрите также

- [Сериализация результата](/ru/carl/serialization/json/#result-serialization) — `ReasoningResult` внутри записи.
- [Обзор интеграции с MAESTRO](/ru/carl/care-integration/overview/)
