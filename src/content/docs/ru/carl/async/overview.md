---
title: Асинхронное выполнение
description: Синхронный и асинхронный запуск, параллелизм DAG, изоляция памяти, колбэки, таймауты, отмена, пауза и продолжение.
sidebar:
  order: 1
---

CARL асинхронен в основе. Цепочка выполняет шаги через исполнитель DAG,
который запускает параллельно всё, что позволяют зависимости.

## Синхронно и асинхронно

```python
result = chain.execute(context)              # синхронная обёртка
result = await chain.execute_async(context)  # внутри асинхронного кода
```

`execute()` оборачивает `execute_async()`. Если вызвать его внутри уже
работающего event loop (ноутбук, асинхронный тест, веб-обработчик), он
предупредит и уйдёт в пул потоков с вложенным циклом. Это может зависнуть на
клиентах, привязанных к циклу. В таких местах используйте
`await chain.execute_async(...)` или передайте `strict_async=True`, чтобы
`execute()` бросал ошибку вместо предупреждения.

## Параллелизм DAG

Исполнитель делит шаги на **батчи**. Шаги с выполненными зависимостями идут
вместе, следующие батчи ждут только то, от чего зависят. `max_workers`
ограничивает параллелизм внутри батча (по умолчанию `3`, `"auto"` = размер
батча).

```python
chain = ReasoningChain(steps=steps, max_workers=4)   # или "auto"
```

```python
LLMStepDescription(number=1, title="Revenue", aim="...", dependencies=[])
LLMStepDescription(number=2, title="Costs",   aim="...", dependencies=[])     # идёт вместе с 1
LLMStepDescription(number=3, title="Profit",  aim="...", dependencies=[1, 2]) # ждёт оба
```

`chain.get_execution_plan()` показывает батчи до запуска.

## Изоляция памяти при параллелизме

Каждый шаг батча работает на своей копии контекста. Память устроена как
copy-on-write: соседи не видят записей друг друга, следующие батчи видят.
После батча записанные и удалённые ключи каждого шага сливаются в порядке
объявления шагов, поэтому при конфликте по одному ключу побеждает шаг,
объявленный позже. Запись истории каждого успешного шага и новые
зарегистрированные инструменты тоже сливаются. Инструменты общие, их должно
быть безопасно вызывать одновременно. См. [copy-on-write](/ru/carl/memory/cow/).

`runtime_input` копируется в каждую копию шага. Шина событий и токены паузы и
отмены общие, они передаются по ссылке. Поэтому один вызов на исходном
контексте доходит до всех работающих шагов, а шаг `wait` видит событие,
которое сосед отправил в том же батче.

## Колбэки наблюдения

Колбэки задаются на `ReasoningContext`:

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    on_step_start=lambda num, title: print(f"start {num}: {title}"),
    on_step_complete=lambda r: print(f"done {r.step_number}: {r.success}"),
    on_progress=lambda done, total: print(f"{done}/{total}"),
    on_llm_chunk=lambda chunk: print(chunk, end=""),   # потоковые токены
)
```

| Колбэк | Сигнатура |
| --- | --- |
| `on_step_start` | `(step_number, step_title)` |
| `on_step_complete` | `(StepExecutionResult)` |
| `on_chain_complete` | `(ReasoningResult)` |
| `on_progress` | `(completed, total)` |
| `on_llm_chunk` | `(chunk)` или `(chunk, *, step_number, stage)`. CARL смотрит на сигнатуру сам. |
| `on_step_event` | `(step_number, event_type, payload)`: мелкие события вроде `debate.turn_argument`, `parallel_sampling.sample`, `supervisor.route_selected`. Исключения внутри колбэка пишутся в лог и не роняют прогон. |
| `on_human_input_requested` | `async (HumanInputRequest) -> HumanInputResponse`: провайдер для [шагов ввода человека](/ru/carl/orchestration/human-in-the-loop/). |
| `on_command_approval_requested` | `(CommandApprovalRequest) -> bool`: подтверждение для [шагов command](/ru/carl/steps/command/). Без него команды, которым нужно подтверждение, запрещаются. |

## Таймауты

- **Цепочка**: `ReasoningChain(..., timeout=60.0)`. Считается только активное
  время, простой на подтверждённой паузе не учитывается.
- **Шаг**: `LLMStepDescription(..., timeout=30.0)` или `LLMStepConfig.timeout`.
  У шагов tool есть `ToolStepConfig.timeout` (по умолчанию 30 с). У других
  типов шагов свои ограничения в конфигах.

## Fail-fast, отмена, пауза

| Средство | Вызов | Эффект |
| --- | --- | --- |
| Fail-fast | `ReasoningChain(fail_fast=True)` | После первого окончательного сбоя новые шаги не стартуют, остальные пропускаются. |
| Отмена | `context.cancel()` | Работающие шаги останавливаются кооперативно. Не начатые шаги пропускаются с `error_message="cancelled by user"`. Будит прогон на паузе. |
| Пауза | `context.request_pause()` | Шаги из очереди не стартуют, работающие доходят до конца. `is_paused()` становится `True`, когда активных шагов нет. |
| Продолжить | `context.clear_pause()` | Прогон идёт дальше, готовые шаги не перезапускаются. |

Подробности, включая `result.metadata["fail_fast"]` и разницу между
`is_pause_requested()` и `is_paused()`:
[управление прогоном](/ru/carl/chains/run-controls/).

## Продолжение в другом процессе

`ReasoningContext.snapshot()` сохраняет историю, память, метаданные и
состояние отмены в `ContextSnapshot` (служебные ключи метаданных с `__`
отбрасываются). Позже:

```python
result = await chain.execute_async(new_context, resume_from=snapshot)
```

Шаги, завершённые в снимке, пропускаются. Объектов полномочий хоста
(`CommandPolicy`, `NetworkEnforcer`, …) в снимке нет. Новый контекст должен
снова получить их от хоста.

## См. также

- [Стриминг](/ru/carl/async/streaming/) — частичные результаты через `stream_async`.
- [Управление прогоном](/ru/carl/chains/run-controls/)
