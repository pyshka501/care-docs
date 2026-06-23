---
title: Асинхронное выполнение
description: Sync vs async, параллелизм DAG, изоляция памяти, колбэки, таймауты и возобновление.
sidebar:
  order: 1
---

CARL асинхронен по своей сути. Цепочка выполняет шаги через DAG-исполнитель,
который параллелит всё, что позволяют зависимости.

## Sync vs async

```python
result = chain.execute(context)              # synchronous wrapper
result = await chain.execute_async(context)  # async (use inside async code)
```

`execute()` — тонкая синхронная обёртка над `execute_async()`. Используйте async-форму
внутри event loop (веб-серверы, TUI, ноутбуки); sync-форму — в скриптах.

## Параллелизм DAG

Исполнитель группирует шаги в **батчи** по зависимостям: шаги без невыполненных
зависимостей запускаются первыми и параллельно; последующие батчи ждут только
то, от чего реально зависят. Управляйте параллелизмом через `max_workers`:

```python
chain = ReasoningChain(steps=steps, max_workers=4)   # or "auto"
```

```python
LLMStepDescription(number=1, title="Revenue", dependencies=[])
LLMStepDescription(number=2, title="Costs",   dependencies=[])   # runs with 1
LLMStepDescription(number=3, title="Profit",  dependencies=[1, 2])  # waits for both
```

## Изоляция памяти при параллелизме

При параллельном выполнении каждый шаг получает **copy-on-write**-представление памяти.
Записи параллельных «братьев» **не видны** друг другу — только последующим батчам. Инструменты,
разделяемые между параллельными шагами, должны быть **без состояния**.

## Мониторинговые колбэки

Установите колбэки на `ReasoningContext` для наблюдения за запуском:

```python
context = ReasoningContext(
    outer_context=data,
    api=client,
    on_step_start=lambda num, title: print(f"▶ step {num}: {title}"),
    on_step_complete=lambda r: print(f"✓ step {r.step_number}: {r.success}"),
    on_progress=lambda done, total: print(f"{done}/{total}"),
    on_llm_chunk=lambda chunk: print(chunk, end=""),   # token streaming
)
```

| Колбэк | Сигнатура |
| --- | --- |
| `on_step_start` | `(step_number, step_title)` |
| `on_step_complete` | `(StepExecutionResult)` |
| `on_progress` | `(completed, total)` |
| `on_llm_chunk` | `(chunk)` или `(chunk, *, step_number, stage)` |
| `on_step_event` | `(step_number, event_type, payload)` — детальные события жизненного цикла шага. |
| `on_human_input_requested` | срабатывает, когда [шаг ввода человеком](/ru/carl/orchestration/human-in-the-loop/) приостанавливается в ожидании ввода. |

## Таймауты

- **На уровне цепочки**: `ReasoningChain(..., timeout=60.0)`.
- **На уровне шага**: `LLMStepDescription(..., timeout=30.0)` или через `LLMStepConfig.timeout`; tool-шаги используют `ToolStepConfig.timeout` (по умолчанию 30 с).

## Отмена

Отменяйте запуск кооперативно из другой задачи (например, по кнопке «стоп» в UI):

```python
context.cancel()          # request cancellation
context.is_cancelled()    # check the flag
context.reset_cancellation()  # clear it before reusing the context
```

Отменённый шаг помечается `skipped=True` с `error_message="cancelled by user"`,
а уже полученные частичные выводы попадают в результат. Шаги, которые ещё не
начались, пропускаются. `ExecutionCancelledError` — связанное экспортируемое исключение.

## Пауза и возобновление

Для сценария «остановиться и продолжить позже» сторона паузы создаёт снимок:

```python
context.request_pause()        # ask the run to pause at the next safe point
context.is_pause_requested()
await context.wait_for_resume()  # (inside a step) block until resumed
context.clear_pause()
```

Затем `execute_async(context, resume_from=snapshot)` восстанавливает предыдущий
`ContextSnapshot` (история / память / метаданные / состояние отмены) и пропускает шаги,
уже завершённые в этом снимке — примитив межпроцессного возобновления, используемый MAESTRO.
Используйте вместе с `ReasoningContext.snapshot()`. Для шагов с участием человека
`context.provide_human_input(value)` передаёт ожидаемый ответ.

## Смотрите также

- [Стриминг](/ru/carl/async/streaming/) — рендеринг частичного прогресса с `stream_async`.
