---
title: Долгосрочная память
description: Сохранение значений между запусками и сессиями с помощью LTM-бэкенда.
sidebar:
  order: 3
---

Кратковременная память живёт один запуск. **Долгосрочная память (LTM)** сохраняется между
запусками и сессиями. Подключите бэкенд в контекст через `long_term_memory=`:

```python
from mmar_carl import ReasoningContext, InMemoryLTM, JsonFileLTM

context = ReasoningContext(
    outer_context=data,
    api=client,
    long_term_memory=JsonFileLTM("ltm.json"),   # or InMemoryLTM()
    session_id="user-42",                         # scopes LTM entries
)
```

## Бэкенды

| Бэкенд | Персистентность |
| --- | --- |
| `InMemoryLTM` | Только в процессе (теряется при выходе). Подходит для тестов. |
| `JsonFileLTM("path.json")` | Сохраняется в JSON-файл между запусками. |

Оба реализуют `LTMBase` — создайте подкласс для подключения LTM к вашей собственной базе данных.

## Использование

Из шага читайте значение LTM через [ссылку](/ru/carl/chains/dynamic-references/) `$ltm.key`.
Программно:

```python
context.ltm_retrieve("preferred_tone")   # поиск по точному ключу (None, если нет)
context.recall("pricing", top_k=5)       # поиск, см. ниже
```

`LTMBase` определяет `store`, `retrieve`, `delete`, `keys`, `search` и
`clear`. Все они работают в области `session_id`. Два контекста с одним
`session_id` делят одну область LTM.

`search()` / `recall()` во встроенных хранилищах это **поиск подстроки**.
Запись подходит, если её значение в JSON содержит запрос (оценка `1.0`) или
содержит его без учёта регистра (оценка `0.5`). Это не семантический поиск.
Чтобы подключить векторное хранилище, переопределите `search()` в своём
подклассе `LTMBase`.

```python
ctx = ReasoningContext(outer_context="...", api=client,
                       long_term_memory=InMemoryLTM(), session_id="u1")
ctx.long_term_memory.store("tone", "formal", session_id="u1")
ctx.recall("FORM")   # [{"key": "tone", "value": "formal", "score": 0.5}]
```

:::note
`recall()` вызывает исключение, если не настроена `long_term_memory`; `ltm_retrieve()` просто
возвращает `None`.
:::

## Смотрите также

- [Обзор памяти](/ru/carl/memory/overview/)
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — синтаксис `$ltm.*`.
