---
title: Стриминг
description: Рендеринг частичного прогресса по мере завершения каждого шага с помощью stream_async.
sidebar:
  order: 2
---

`chain.stream_async(context)` — async-генератор, который выдаёт каждый
`StepExecutionResult` **сразу по завершении его шага**, затем последним выдаёт терминальный
`ReasoningResult`. Это позволяет интерфейсу отображать частичный прогресс вместо
блокирования до завершения всей цепочки.

```python
from mmar_carl.models.results import StepExecutionResult, ReasoningResult

async for item in chain.stream_async(context):
    if isinstance(item, StepExecutionResult):
        print(f"step {item.step_number} done: success={item.success}")
    else:  # terminal ReasoningResult
        print(f"chain success={item.success}")
```

Для 3-шаговой цепочки длительностью ~24 с вывод шага 1 становится доступен около t≈7 с,
а не t≈24 с.

## Что важно знать

- **Порядок завершения** — элементы выдаются по мере того, как каждый шаг *завершается*, а не в порядке
  определения цепочки. Параллельные батчи выдают шаги по мере их завершения.
- **Колбэки по-прежнему срабатывают** — ваш `context.on_step_complete` выполняется наряду со
  стримом; события трассировки тоже срабатывают в реальном времени.
- **Терминальный результат** — ровно один `ReasoningResult` выдаётся последним; всё перед ним — `StepExecutionResult`.

## Стриминг токенов

Для стриминга *внутри* шага (токен за токеном) установите колбэк `on_llm_chunk` в
контексте — см. [колбэки](/ru/carl/async/overview/#мониторинговые-колбэки). Два варианта
работают вместе: `on_llm_chunk` стримит токены внутри шага; `stream_async` стримит завершённые шаги.

## Смотрите также

- [Асинхронное выполнение](/ru/carl/async/overview/) — параллелизм, колбэки, таймауты.
- [Пример стриминга](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/openrouter_example.py) в репозитории.
