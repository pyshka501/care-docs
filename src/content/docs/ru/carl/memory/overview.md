---
title: Обзор памяти
description: Три слоя памяти, чтение и запись, управление историей.
sidebar:
  order: 1
---

CARL предоставляет цепочке три слоя состояния:

1. **Кратковременная память** — хранилище ключ/значение с пространствами имён в контексте
   (`context.memory[namespace][key]`). Живёт один запуск.
2. **Метаданные сессии** — произвольный `context.metadata` для пользовательских расширений.
3. **Долгосрочная память (LTM)** — опциональный бэкенд между сессиями; см. [LTM](/ru/carl/memory/ltm/).

Плюс **история** — плоский список выводов шагов в порядке выполнения.

## Чтение и запись кратковременной памяти

Внутри цепочки используйте [memory-шаг](/ru/carl/steps/memory/) (`read` / `write` /
`append` / `delete` / `list`). Программно контекст предоставляет те же операции:

```python
context.memory_write("analysis", value, namespace="results")
context.memory_read("analysis", namespace="results", default=None)
context.memory_append("log", entry, namespace="events")
context.memory_delete("analysis", namespace="results")
context.memory_list(namespace="results")   # -> list of keys
```

Все принимают `namespace="default"`, если не передать другое. Читайте память обратно в ссылках на шаги
через [`$memory.namespace.key`](/ru/carl/chains/dynamic-references/).

:::caution
При [параллельном выполнении](/ru/carl/async/overview/) каждый шаг получает copy-on-write-представление
памяти — записи видны только **последующим** батчам, но не параллельным «братьям». См. [copy-on-write](/ru/carl/memory/cow/).
:::

## Управление историей

`context.history` — список выводов шагов; `context.get_current_history()`
возвращает его как единую строку. Для длинных цепочек ограничьте её, чтобы не раздувать контекст:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `max_history_entries` | `int` | `0` | Максимальное количество хранимых записей (`0` = без ограничений). |
| `trim_strategy` | `"oldest" \| "compress"` | `"oldest"` | `oldest` удаляет самые старые записи (FIFO); `compress` убирает подробные заголовки шагов, сохраняя содержимое результатов. |

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    max_history_entries=20,
    trim_strategy="compress",
)
```

## Смотрите также

- [Copy-on-write изоляция](/ru/carl/memory/cow/)
- [Долгосрочная память](/ru/carl/memory/ltm/)
- [Валидация схемы памяти](/ru/carl/memory/schema/)
