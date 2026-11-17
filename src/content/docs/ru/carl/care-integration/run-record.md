---
title: RunRecord
description: Долговечная запись одного прогона цепочки, которую можно воспроизвести.
sidebar:
  order: 3
---

`RunRecord` собирает один прогон в объект, который сериализуется в JSON:
снимок цепочки, вход, полный результат и время. Команда Maestro
`maestro replay` читает такие файлы (см.
[генерация и запуск](/ru/care/cli/generate-run/)).

## Записать прогон

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
    chain_id="my-chain",        # необязательно
    chain_version="v3",         # необязательно
)
```

`from_run` сохраняет `chain.to_dict()`, берёт `outer_context`, память и
метаданные контекста (без служебных ключей с префиксом `__`) и ставит
`finished_at` на текущий момент, если его не передали.

## Поля

| Поле | Смысл |
| --- | --- |
| `chain_id` / `chain_version` | Идентичность цепочки (необязательно). |
| `chain_dict` | Сериализованная цепочка. Ограничения те же, что у [JSON-сериализации](/ru/carl/serialization/json/#что-не-сериализуется). |
| `input` | `outer_context`, `memory` и `context_metadata`, с которых начался прогон. |
| `result` | `ReasoningResult` в полной форме. |
| `started_at` / `finished_at` | Отметки времени. |
| `runtime_info` | Версия библиотеки и сведения о среде. |

:::note
В `input` нет `runtime_input`. Хост, который запускает цепочки со
структурированным входом (как Maestro), должен сам хранить этот вход, если
хочет перезапустить запись с теми же данными.
:::

## Сохранить и загрузить

```python
record.save("runs/run-001.json")
loaded = RunRecord.load("runs/run-001.json")

d = record.to_dict();  RunRecord.from_dict(d)
s = record.to_json();  RunRecord.from_json(s)
```

## В Maestro

Приложение хранит свои квитанции исполнения (хеши цепочки и входа,
ограниченное превью шагов), а не файлы `RunRecord`. См.
[Прогоны](/ru/care/app/runs/). `maestro replay` принимает и файл `RunRecord`,
и просто `ReasoningResult`.

## См. также

- [Сериализация результатов](/ru/carl/serialization/json/#сериализация-результатов)
- [Интеграция с Maestro](/ru/carl/care-integration/overview/)
