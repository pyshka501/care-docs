---
title: Map-шаг
description: Вызывает один зарегистрированный инструмент для каждого элемента JSON-массива с ограниченным параллелизмом и таймаутами на элемент и собирает все результаты в порядке входа.
sidebar:
  order: 18
---

`MapStepDescription` берёт JSON-массив из контекста и вызывает один зарегистрированный
инструмент по одному разу на каждый элемент. Вызовы идут параллельно до заданного
предела. Каждый элемент получает свой результат, и шаг возвращает их все в порядке
входа. Поведение задаётся через `MapStepConfig`. Шаг не вызывает LLM.

Map — шаг параллельной обработки данных с одной фиксированной операцией. Это не
универсальный цикл, не маршрутизатор и не способ менять граф во время выполнения.

## Минимальный пример

```python
import asyncio
import json

from mmar_carl import (
    MapStepConfig,
    MapStepDescription,
    ReasoningChain,
    ReasoningContext,
)


async def score(item: dict, index: int, threshold: int) -> dict:
    if item["value"] < 0:
        raise ValueError("negative value")
    await asyncio.sleep(0.01 * (3 - index))  # later items finish first
    return {"name": item["name"], "pass": item["value"] >= threshold}


async def main() -> None:
    rows = [
        {"name": "alpha", "value": 7},
        {"name": "beta", "value": -1},
        {"name": "gamma", "value": 3},
    ]
    context = ReasoningContext(outer_context=json.dumps(rows), api=None)
    context.memory_write("threshold", 5, namespace="input")
    context.register_tool("score", score)

    chain = ReasoningChain(steps=[
        MapStepDescription(
            number=1,
            title="Score rows",
            config=MapStepConfig(
                items_source="$outer_context",
                tool_name="score",
                item_parameter="item",
                index_parameter="index",
                input_mapping={"threshold": "$memory.input.threshold"},
                max_items=100,
                max_concurrency=2,
                item_timeout_seconds=1,
                output_memory_key="scores",
            ),
        ),
    ])

    result = await chain.execute_async(context)
    step = result.step_results[0]
    outcome = step.as_map_outcome()
    print(step.success, step.error_message)
    print(outcome.total_items, outcome.completed_items, outcome.failed_items)
    for item in outcome.items:
        print(item.index, item.status.value, item.output, item.error_message)
    print(context.memory_read("scores", namespace="map")["completed_items"])


asyncio.run(main())
```

Вывод:

```text
False MapStep completed with 1 non-completed item(s)
3 2 1
0 completed {'name': 'alpha', 'pass': True} None
1 failed None negative value
2 completed {'name': 'gamma', 'pass': False} None
2
```

CARL также пишет в лог `UserWarning`, потому что ни один предыдущий шаг не
записывает `$memory.input.threshold`. Здесь значение записано до запуска.

Один элемент упал, поэтому шаг не успешен. Два других элемента всё равно отработали,
и сводный результат со всеми тремя исходами всё равно записан в память.

Ещё один рабочий пример:
[`examples/orchestration/map_step_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/map_step_example.py).

## Поля

`MapStepConfig`:

| Поле | Тип | По умолчанию | Правила |
| --- | --- | --- | --- |
| `items_source` | `str` | обязательно | Ссылка, которая должна разрешаться в JSON-массив. Допустимые формы: ровно `$outer_context` либо `$memory.*`, `$steps.*`, `$metadata.*`, `$event.*`. Всё остальное (`$history`, литералы) отклоняется. |
| `tool_name` | `str` | обязательно | Зарегистрированный инструмент, который вызывается для каждого элемента. Непустой. |
| `item_parameter` | `str` | `"item"` | Именованный аргумент, в который передаётся текущий элемент. Должен быть корректным идентификатором Python и не ключевым словом. |
| `index_parameter` | `str \| None` | `None` | Необязательный именованный аргумент, в который передаётся индекс входа с нуля. Те же правила. Должен отличаться от `item_parameter`. |
| `input_mapping` | `dict[str, str]` | `{}` | Общие именованные аргументы. Ключи подчиняются тем же правилам для идентификаторов. Значения используют те же формы ссылок, что и `items_source`. Ключи не могут повторять `item_parameter` или `index_parameter`. |
| `max_items` | `int` | `1000` | `>= 1`. Более длинный массив роняет шаг до любого вызова. |
| `max_concurrency` | `int` | `8` | `1..256`. Сколько вызовов может идти одновременно. |
| `item_timeout_seconds` | `float` | `30.0` | `> 0` и конечное. Действует для каждого элемента отдельно. |
| `output_memory_key` | `str \| None` | `None` | Ключ для сводного результата. Непустой. |
| `output_namespace` | `str` | `"map"` | Пространство имён памяти для `output_memory_key`. Непустое. |

Если `items_source` равен `$outer_context` и внешний контекст — JSON-строка, она
сначала разбирается, как в примере.

## Как выполняется

1. **Разрешение один раз.** `items_source` и каждое значение `input_mapping`
   разрешаются один раз, до всех вызовов. Оба должны быть совместимы с JSON. Они
   копируются через JSON, поэтому элементы никогда не делят изменяемые объекты с
   памятью CARL.
2. **Проверка границ.** Источник не массив, значение не JSON, больше `max_items`
   элементов или незарегистрированный инструмент роняют весь шаг. Ни один инструмент
   не вызывается.
3. **Разветвление.** Для каждого элемента CARL вызывает инструмент с общими
   аргументами плюс `item_parameter=<element>` и, если задан,
   `index_parameter=<index>`. Асинхронные инструменты ожидаются через await,
   синхронные работают в рабочем потоке. Одновременно активно не больше
   `max_concurrency` вызовов.
4. **Сбор всего.** Каждый вызов заканчивается как `completed`, `failed`, `timed_out`
   или `cancelled`. Сбой одного не останавливает соседей. Результат, который не
   сериализуется в JSON, делает элемент `failed` с `error_type="NonJsonResult"`.
5. **Сводка.** Результаты сортируются по индексу входа, а не по порядку завершения.
   Если задан `output_memory_key`, сводка записывается в память один раз, **даже
   если некоторые элементы упали**.

Пустой массив завершается успешно без вызова инструмента.

## Результат

Типизированный результат читается через `StepExecutionResult.as_map_outcome()`.
Метод возвращает `MapOutcome`:

| Поле | Значение |
| --- | --- |
| `items` | `list[MapItemOutcome]` в порядке входа. |
| `total_items` | Число элементов. |
| `completed_items`, `failed_items`, `timed_out_items`, `cancelled_items` | Счётчики по статусам. В сумме всегда дают `total_items`. |
| `max_concurrency` | Заданная граница. |
| `enforcement_gaps` | Известные ограничения, встреченные во время запуска (см. ниже). |

У каждого `MapItemOutcome` есть:

| Поле | Значение |
| --- | --- |
| `index` | Индекс входа с нуля. |
| `status` | `MapItemStatus`: `completed`, `failed`, `timed_out` или `cancelled`. |
| `success` | `True` ровно тогда, когда `status` равен `completed`. |
| `output` | JSON-результат. Только для `completed`. |
| `error_type`, `error_message` | Обязательны для всех остальных статусов, например `ValueError`, `TimeoutError`, `CancelledError`, `NonJsonResult`. |
| `execution_time` | Время на этот элемент в секундах. |

Шаг успешен, только если **каждый** элемент в статусе `completed` (пустой массив
тоже считается). Во всех остальных случаях `success=False`, а `error_message` равен
`MapStep completed with N non-completed item(s)`. Сводный JSON всё равно лежит в
`result` и `result_data`, и запись в историю всё равно добавляется.

`cancelled` используется только при отмене запуска хостом. Отмена останавливает
ещё не начатые элементы и отменяет идущие асинхронные вызовы. Каждый элемент всё
равно получает результат. Если запуск отменён, у результата шага `skipped=True`.

### Память при сбоях элементов

Упавший шаг обычно не вносит изменений в память. Map — исключение. Когда он работает
в параллельном пакете и некоторые элементы падают, исполнитель всё равно фиксирует
одну сводку под `output_namespace` / `output_memory_key` и больше ничего из снимка
этого шага.

## Ограничения

- **Синхронные инструменты нельзя убить.** После таймаута или отмены синхронный
  инструмент продолжает работать в своём потоке. Сводка записывает это в
  `enforcement_gaps`, например `sync tool 'check' may continue after timeout`.
  Используйте асинхронные инструменты, если нужна настоящая отмена.
- **Нет в V1:** повторы, filter, reduce, fail-fast, запись в память по элементам,
  выбор инструмента для каждого элемента, вложенные цепочки и изменения графа.
- **`cache` не отклоняется** на этом шаге. Попадание в кэш возвращает сохранённую
  сводку без вызова инструмента и без записи `output_memory_key`. См.
  [кэширование](/ru/carl/steps/caching/).

## Preflight и сериализация

- `ReasoningChain.required_tools()` включает `tool_name`, поэтому
  [preflight](/ru/carl/care-integration/preflight/) сообщает об отсутствующем
  инструменте в `missing_tools`.
- Тип в формате цепочки — `"map"`. Он появился в формате цепочки с
  `format_version` 8. Цепочки, сохранённые CARL 0.5.0, имеют `format_version` 11.
  См. [миграцию](/ru/carl/serialization/migration/).
- Весь конфиг проходит круг через `to_dict()` / `from_dict()` без потерь.
- У `ChainBuilder` нет хелпера `add_map_step`. Создавайте `MapStepDescription`
  напрямую.

## См. также

- [Tool-шаг](/ru/carl/steps/tool/): один вызов одного инструмента.
- [Agent-шаг](/ru/carl/steps/agent/): модель сама решает, какие инструменты вызывать.
- [Parallel sampling](/ru/carl/orchestration/parallel-sampling/): многократный запуск
  одного LLM-шага.
- [Циклы](/ru/carl/steps/loops/) для последовательных итераций.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/).
