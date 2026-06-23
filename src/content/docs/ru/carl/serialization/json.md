---
title: JSON-сериализация
description: Сохранение, загрузка и версионирование цепочек как JSON.
sidebar:
  order: 1
---

Цепочки сериализуются в JSON и обратно — для сохранения, обмена и перезагрузки.

```python
chain.save("my_chain.json")                 # запись на диск
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict();   ReasoningChain.from_dict(d)
s = chain.to_json();   ReasoningChain.from_json(s)
```

`from_dict` выполняет полную валидацию (циклы, ссылки на зависимости,
предупреждения по синтаксису ссылок).

## Типизированный vs legacy при загрузке

`from_dict(data, use_typed_steps=False)` по умолчанию восстанавливает legacy-объекты
`StepDescription`. Передайте `use_typed_steps=True` (или используйте
`from_dict_typed(data)`), чтобы восстановить [типизированные классы шагов](/ru/carl/steps/overview/)
— предпочтительно для нового кода.

## Версионирование и совместимость

`to_dict()` проставляет два поля:

- `format_version: int` — увеличивается при изменении формата.
- `carl_version: str` — информационное (версия `mmar-carl`, которая записала файл).

Контракт совместимости:

| Ситуация | Поведение |
| --- | --- |
| **Чтение старого** | Цепочка, сохранённая с `format_version = N`, остаётся загружаемой на любой CARL с `FORMAT_VERSION ≥ N`. |
| **Чтение нового** | Более новый формат вызывает `ChainFormatNewerError(required, this)` — MAESTRO ловит это и предлагает обновиться. |
| **Неизвестный тип шага** | Падает явно, а не молча отбрасывает шаг. |

## Поля только для рантайма

Некоторые поля намеренно **не** сериализуются, так как держат живые объекты:
`sub_chain` (handoff), `agents` (supervisor), `metrics`, `cache.key_fn` и колбэки
`ReasoningContext`. Переподключите их в коде после загрузки.

## Сериализация результата

Результаты тоже сериализуются туда и обратно — можно сохранить выполнение без
потерь и перезагрузить его позже (именно это оборачивает
[`RunRecord`](/ru/carl/care-integration/run-record/)):

```python
result = chain.execute(context)

result.save("result.json")                 # lossless by default
loaded = ReasoningResult.load("result.json")

d = result.to_dict(full=True)              # full=True keeps every step's detail
ReasoningResult.from_dict(d)
s = result.to_json();  ReasoningResult.from_json(s)
```

Результаты по отдельным шагам сериализуются индивидуально через
`StepExecutionResult.to_dict(truncate=False)` / `from_dict` — `truncate` управляет
тем, обрезаются ли длинные выводы шагов.

## Смотрите также

- [Миграция: legacy → типизированные шаги](/ru/carl/serialization/migration/)
- [ReasoningChain](/ru/carl/chains/overview/) · [RunRecord](/ru/carl/care-integration/run-record/)
