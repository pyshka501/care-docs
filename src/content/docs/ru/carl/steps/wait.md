---
title: Wait-шаг
description: Приостанавливает одну ветку работающей цепочки до срабатывания таймера или прихода именованного события, не блокируя цикл событий.
sidebar:
  order: 17
---

`WaitStepDescription` ждёт внутри работающего процесса CARL. Шаг завершается, когда
выполнено его условие: относительный таймер, абсолютное время, именованное событие
или первое из нескольких таких условий. Поведение задаётся через `WaitStepConfig`.
Шаг не вызывает ни LLM, ни инструменты.

Ожидание асинхронное. Оно не блокирует цикл событий, не занимает рабочий поток и не
опрашивает состояние. Другие шаги в том же параллельном пакете продолжают работать.

:::caution[Только внутри процесса]
Ожидание живёт только в текущем процессе. Если процесс завершится, ожидание
потеряется. Нет ни сохранения состояния, ни планировщика, ни API возобновления, ни
доставки ровно один раз. Ожидание, которое должно пережить перезапуск, нужно строить
в приложении-хосте.
:::

## Минимальный пример

Синхронный инструмент загружает данные и отправляет `data_ready`. Wait-шаг в том же
параллельном пакете просыпается по этому событию или сдаётся через 5 секунд.

```python
import asyncio
import time

from mmar_carl import (
    AfterWaitCondition,
    AnyOfWaitCondition,
    EventWaitCondition,
    ReasoningChain,
    ReasoningContext,
    ToolStepConfig,
    ToolStepDescription,
    WaitStepConfig,
    WaitStepDescription,
)

context = ReasoningContext(outer_context="", api=None)


def load_data() -> str:
    # A sync tool runs in a worker thread; emit_event is safe from there.
    time.sleep(0.2)
    context.emit_event("data_ready", {"rows": 3})
    return "loaded"


context.register_tool("load_data", load_data)

chain = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Load data",
        config=ToolStepConfig(tool_name="load_data"),
    ),
    # No dependency on step 1: both steps run in the same parallel batch.
    WaitStepDescription(
        number=2,
        title="Wait for data or give up",
        config=WaitStepConfig(
            condition=AnyOfWaitCondition(conditions=[
                EventWaitCondition(name="data_ready"),
                AfterWaitCondition(seconds=5),
            ]),
            output_memory_key="data_wait",
        ),
    ),
])

result = asyncio.run(chain.execute_async(context))
outcome = result.step_results[1].as_wait_outcome()
print(outcome.trigger, outcome.condition_index, outcome.name, outcome.payload)
print(round(outcome.elapsed_seconds, 1))
print(context.memory_read("data_wait", namespace="wait")["trigger"])
```

Вывод:

```text
event 0 data_ready {'rows': 3}
0.2
event
```

## Поля

`WaitStepConfig`:

| Поле | Тип | По умолчанию | Правила |
| --- | --- | --- | --- |
| `condition` | `WaitCondition` | обязательно | Одна из четырёх моделей условий ниже. |
| `output_memory_key` | `str \| None` | `None` | Если задан, результат записывается под этим ключом в пространство имён памяти `wait`. Пробелы по краям обрезаются, пустая строка отклоняется. |

Пространство имён всегда `wait`, его нельзя настроить.

### Условия

`WaitCondition` — объединение Pydantic с тегом `type`. В JSON тег пишется явно,
например `{"type": "after", "seconds": 60}`.

| Модель | `type` | Поле | Проверка | Завершается |
| --- | --- | --- | --- | --- |
| `AfterWaitCondition` | `"after"` | `seconds: float` | `>= 0` и конечное. | Через `seconds`. `0` завершается сразу. |
| `AtWaitCondition` | `"at"` | `timestamp: datetime` | Должно быть с часовым поясом. Наивные datetime отклоняются. | В этот момент. Время в прошлом завершается сразу. |
| `EventWaitCondition` | `"event"` | `name: str` | Пробелы обрезаются, пустая строка отклоняется. | Когда в контексте есть событие с этим именем. |
| `AnyOfWaitCondition` | `"any_of"` | `conditions: list` | Не меньше 2 элементов. Элементы должны быть `after`, `at` или `event`. Вложенный `any_of` отклоняется. | Когда завершается первое из перечисленных условий. |

`AllOf`, вызываемые объекты в роли условий и вложенные композиции не поддерживаются.

## События

События идут через существующий API `context.emit_event(name, payload)`. Те же
события управляют `triggered_by` у шагов и ссылкой `$event.<name>`.

- **Срабатывание по уровню.** Событие, отправленное до начала ожидания, завершает
  ожидание сразу.
- **Рассылка всем, без потребления.** Просыпаются все ожидающие с тем же именем.
  Более поздние ожидающие тоже видят событие.
- **Побеждает последнее значение.** Повторная отправка того же имени заменяет
  payload.
- **Общие для параллельных снимков.** Шаги одного параллельного пакета работают на
  снимках контекста, но все снимки делят одну шину событий. Соседний шаг может
  разбудить ожидающего в том же пакете.
- **Безопасно из потоков.** `emit_event` можно вызывать из синхронного инструмента в
  рабочем потоке. Пробуждения передаются обратно в цикл событий ожидающего.
- **Сразу и без отката.** Событие видно сразу после отправки, ещё до завершения
  отправившего шага. Если этот шаг потом упадёт, событие останется. Если вам нужна
  такая гарантия, отправляйте событие только после фиксации работы.
- **Payload должен быть JSON.** Если payload ожидаемого события не сериализуется в
  JSON, wait-шаг падает с `WaitStep event payload must be JSON-compatible`.

## Результат

Типизированный результат читается через `StepExecutionResult.as_wait_outcome()`.
Метод возвращает `WaitOutcome`:

| Поле | Значение |
| --- | --- |
| `trigger` | `"after"`, `"at"` или `"event"`: какое листовое условие сработало. |
| `elapsed_seconds` | Монотонное время от начала шага. |
| `condition_index` | Для `any_of`: индекс сработавшего условия. `None` для одиночного условия. |
| `seconds` | Задано для `after`. |
| `timestamp` | Задано для `at` (строка ISO 8601). |
| `name`, `payload` | Заданы для `event`. |

При успехе в `result` лежит тот же результат как JSON с отсортированными ключами, и в
историю добавляется одна запись.

Если в одном обороте цикла событий готовы несколько условий `any_of` (например, два
таймера нулевой длины или событие, уже отправленное раньше), побеждает то, что указано
**первым**.

Успешное ожидание — единственный успех. Отмена никогда не выглядит как сработавший
триггер. Если запуск отменён, шаг возвращает обычный результат отмены
(`skipped=True`), даже если условие выполнилось в том же обороте.

## Сбои и ограничения

- **Встроенного таймаута нет.** Голое ожидание `event` ждёт, пока не придёт событие,
  не будет отменён запуск или не сработает таймаут уровня цепочки. Если нужен
  дедлайн, объедините событие с таймером `after` в `any_of`. Ветка таймаута — это
  обычный успех с `trigger="after"`. Разветвляйтесь по нему на следующих шагах.
- **Таймеры живут внутри процесса.** `at` один раз вычисляет задержку от текущего
  времени UTC. Это не будильник по реальным часам, и он не переживает перезапуск.
- **Payload не в JSON** роняет шаг, как описано выше.
- **`cache` не отклоняется** на этом шаге. Попадание в кэш возвращает сохранённый
  результат без ожидания и без записи `output_memory_key`. Для ожидания это почти
  никогда не нужно. См. [кэширование](/ru/carl/steps/caching/).

## Сериализация

- Тип в формате цепочки — `"wait"`. Он появился в формате цепочки с
  `format_version` 5. Цепочки, сохранённые CARL 0.5.0, имеют `format_version` 11.
  См. [миграцию](/ru/carl/serialization/migration/).
- Весь конфиг проходит круг через `to_dict()` / `from_dict()` без потерь.
- У `ChainBuilder` нет хелпера `add_wait_step`. Создавайте `WaitStepDescription`
  напрямую.

## См. также

- [Шина событий](/ru/carl/orchestration/overview/#шина-событий) и `triggered_by`.
- [Управление запуском](/ru/carl/chains/run-controls/): пауза, возобновление, отмена
  и таймауты.
- [Human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/): ожидание решения
  человека.
- [Map-шаг](/ru/carl/steps/map/).
