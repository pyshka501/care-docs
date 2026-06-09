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
context.ltm_retrieve("preferred_tone")              # exact-key lookup (None if absent)
context.recall("past decisions about pricing", top_k=5)  # similarity search
```

`LTMBase` определяет `store`, `retrieve`, `delete`, `search` и `clear` — все
с областью видимости сессии через ключевое слово `session_id` (по умолчанию `session_id` контекста).

:::note
`recall()` вызывает исключение, если не настроена `long_term_memory`; `ltm_retrieve()` просто
возвращает `None`.
:::

## Смотрите также

- [Обзор памяти](/ru/carl/memory/overview/)
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — синтаксис `$ltm.*`.
