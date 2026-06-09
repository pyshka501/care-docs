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

## Таймауты

- **На уровне цепочки**: `ReasoningChain(..., timeout=60.0)`.
- **На уровне шага**: `LLMStepDescription(..., timeout=30.0)` или через `LLMStepConfig.timeout`; tool-шаги используют `ToolStepConfig.timeout` (по умолчанию 30 с).

## Пауза и возобновление

`execute_async(context, resume_from=snapshot)` восстанавливает предыдущий
`ContextSnapshot` (история / память / метаданные / состояние отмены) и пропускает шаги,
уже завершённые в этом снимке — примитив межпроцессного возобновления, используемый CARE.
Используйте вместе с `ReasoningContext.snapshot()`.

## Смотрите также

- [Стриминг](/ru/carl/async/streaming/) — рендеринг частичного прогресса с `stream_async`.
