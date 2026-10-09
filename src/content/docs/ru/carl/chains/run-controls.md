---
title: Управление запуском
description: Fail-fast, пауза с подтверждением и возобновление, отмена и таймаут цепочки.
sidebar:
  order: 5
---

Хосту (интерфейсу, планировщику задач, Maestro) часто нужно остановить или
придержать идущую цепочку. В CARL для этого четыре механизма: `fail_fast`,
пауза и возобновление, отмена и `timeout` цепочки. Все они действуют на
границах шагов. Уже начатый шаг доходит до конца или до своего таймаута.

## Fail-fast

По умолчанию упавший шаг **не** останавливает цепочку. Независимые шаги
продолжают работать. Шаги, которые зависят от упавшего, тоже запускаются и
видят то, что он оставил (часто ничего). Так сложилось исторически.

Включите `fail_fast`, чтобы после первого окончательного сбоя новые шаги не
запускались:

```python
chain = ReasoningChain(steps=steps, max_workers=4, fail_fast=True)

# or
chain = ChainBuilder()...with_fail_fast().build()

# or directly
DAGExecutor(fail_fast=True)
```

При `fail_fast=True`:

- после того как шаг упал **окончательно** (его собственные повторы и запасные
  инструменты уже использованы), новые шаги не стартуют;
- уже запущенные шаги доходят до конца;
- каждый не начатый шаг помечается как пропущенный
  (`StepExecutionResult.skipped=True`);
- у результата цепочки `success=False`, а `result.metadata["fail_fast"]`
  описывает, что произошло:

```python
{
    "enabled": True,
    "triggered": True,
    "failed_step_number": 1,
    "skipped_step_numbers": [3, 2],
}
```

Правила и ограничения:

- `fail_fast` должен быть `bool`. При `fail_fast=True` значение `max_workers`
  должно быть положительным `int` или `"auto"`.
- Fail-fast важнее циклов и RE-PLAN на уровне цепочки: сбой останавливает
  запуск, а не возвращает к началу цикла и не перепланирует.
- Внешние побочные эффекты завершённых шагов **не** откатываются.
- `fail_fast` пишется в `to_dict()` и читается в `from_dict()`.
- Неожиданное исключение внутри исполнителя шага превращается в результат
  упавшего шага (с `error_traceback`), а не роняет весь запуск.

## Пауза и возобновление

Пауза **подтверждается**: запросить паузу и стоять на паузе — разные состояния.

```python
task = asyncio.create_task(chain.execute_async(context))

context.request_pause()
context.is_pause_requested()   # True right away
context.is_paused()            # False while a step is still running
# ... the running step finishes, the scheduler waits ...
context.is_paused()            # True: nothing is running

context.clear_pause()          # resume
result = await task
```

- `request_pause()` ставит запрос. Шаги в очереди проверяют его перед стартом.
  Идущие шаги (вызов LLM, инструмент) завершаются как обычно.
- `is_paused()` равно `True`, только когда пауза запрошена, планировщик ждёт и
  ни один шаг не активен. Это значение стоит показывать в интерфейсе как «На
  паузе».
- `clear_pause()` возобновляет запуск. Завершённые шаги **не** повторяются.
- `paused_duration()` возвращает накопленное время простоя на паузе в секундах.
- `wait_for_resume()` — awaitable, который использует исполнитель. Свои
  исполнители тоже могут его ждать.
- Параллельные снапшоты контекста делят один токен паузы, поэтому один вызов
  действует на весь батч.

## Отмена

```python
from mmar_carl import ExecutionCancelledError

task = asyncio.create_task(chain.execute_async(context))
context.cancel()
try:
    await task
except ExecutionCancelledError as exc:
    partial = exc.result          # ReasoningResult with completed steps
```

- `cancel()` запрашивает отмену и будит цепочку на паузе. Отменить её можно, не
  возобновляя.
- Не начатые шаги пропускаются, идущие доходят до конца.
- Запуск бросает `ExecutionCancelledError`. В его `result` лежит частичный
  `ReasoningResult` (`success=False`).
- `is_cancelled()` (синоним `is_cancellation_requested()`) и
  `await wait_for_cancellation()` позволяют долгим инструментам и своим
  исполнителям остановиться раньше. Например,
  [цепочки-инструменты](/ru/carl/steps/chain-tools/) так отменяют вложенный запуск.
- `reset_cancellation()` сбрасывает флаг перед повторным использованием контекста.

## Таймауты

| Уровень | Где | Что происходит |
| --- | --- | --- |
| Цепочка | `ReasoningChain(timeout=...)`, `ChainBuilder.with_timeout()` | Проверяется перед стартом каждого батча. Если **активное** время превысило предел, запуск бросает `TimeoutError` (`Chain execution timed out after …s. Completed k/n steps.`). Время на паузе не считается. |
| LLM-шаг | `LLMStepDescription.timeout`, `LLMStepConfig.timeout` | На каждый вызов. |
| Шаг инструмента | `ToolStepConfig.timeout` (по умолчанию `30.0`) | На каждый вызов инструмента; запасной инструмент через `ToolErrorRecovery.on_timeout`. |
| Агентные и runtime-шаги | собственный config | Например, `AgentStepConfig.timeout_seconds`, `ClaudeCodeStepConfig.timeout`, `CodexStepConfig.timeout`, `ChainToolDefinition.timeout_seconds`, лимиты рантайма для команд и кода. |

`timeout` цепочки работает и как лимит **на шаг**: исполнитель оборачивает
каждый шаг в `asyncio.wait_for(step.timeout or chain.timeout)`. Шаг, который
идёт дольше, падает с `Step timed out after …s`, но исключение не бросается.
Поле `timeout` на уровне шага есть только у LLM-шагов и command-plan шагов (и у
legacy `StepDescription`), так что для остальных типов предел задаёт значение
цепочки. Шаги инструментов и агентов вдобавок применяют свои таймауты из config.

## См. также

- [ReasoningChain](/ru/carl/chains/overview/) · [Асинхронное исполнение](/ru/carl/async/overview/)
- [Human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/): ожидание человека — это шаг, а не пауза.
