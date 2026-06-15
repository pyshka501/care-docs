---
title: Human-in-the-Loop
description: Пауза цепочки для ввода от человека — одобрение, значение или исправление.
sidebar:
  order: 6
---

`HumanInputStepDescription` приостанавливает выполнение и ждёт, пока человек предоставит
значение — полезно для одобрений, недостающих входных данных или исправлений. Ввод
предоставляется обработчиком, который вы подключаете (внутрипроцессный вызываемый объект
или вебхук для внепроцессных потоков).

```python
from mmar_carl import HumanInputStepDescription, HumanInputStepConfig

HumanInputStepDescription(
    number=2,
    title="Approve the plan",
    config=HumanInputStepConfig(
        prompt="Approve this plan? Reply 'yes' to continue.",
        timeout=300.0,
        fallback_value="no",
        output_memory_key="approval",
    ),
)
```

## HumanInputStepConfig

| Поле | Назначение |
| --- | --- |
| `prompt` | Что спрашивается у человека. |
| `timeout` | Секунды ожидания до использования запасного значения. |
| `fallback_value` | Значение, используемое если человек не ответил вовремя. |
| `output_memory_key` | Куда сохраняется ответ (читать позже через `$memory.*`). |

Собранное значение поступает в остаток цепочки как вывод любого другого шага —
ветвитесь на нём с помощью [conditional-шага](/ru/carl/steps/conditional/). Ответ
записывается в память в пространстве имён `human_input`, так что читайте его дальше
по цепочке через `$memory.human_input.<output_memory_key>`.

## Подключение обработчика ввода

Задайте `context.on_human_input_requested` как асинхронный вызываемый объект
`(prompt: str, future: asyncio.Future) -> None`. Он получает промпт и разрешает
future ответом человека; если future так и не разрешится, шаг откатывается к
запасному значению по истечении `timeout`.

```python
async def human_approver(prompt: str, future: asyncio.Future) -> None:
    answer = await collect_from_ui(prompt)   # your UI / queue / webhook bridge
    if not future.done():
        future.set_result(answer)

context.on_human_input_requested = human_approver
```

Если колбэк **не** зарегистрирован, шаг сразу использует `fallback_value` — благодаря
этому цепочки с human-шагом остаются полностью запускаемыми в пакетных/тестовых
сценариях.

## Пример

[Пример human-in-the-loop](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py)
из репозитория (без API-ключа) показывает шлюз одобрения: инструмент составляет
черновик поста, human-шаг собирает решение, а финальный инструмент публикует или
отбрасывает его на основе этого решения.

```python
ReasoningChain(steps=[
    ToolStepDescription(number=1, title="Draft Blog Post",
        config=ToolStepConfig(tool_name="draft_post", input_mapping={"topic": "$memory.input.topic"})),
    HumanInputStepDescription(number=2, title="Human Approval", dependencies=[1],
        config=HumanInputStepConfig(prompt="Approve to publish?", timeout=10.0,
                                    fallback_value="approve", output_memory_key="decision")),
    ToolStepDescription(number=3, title="Publish or Discard", dependencies=[2],
        config=ToolStepConfig(tool_name="route_decision", input_mapping={
            "draft": "$history[0]",                       # tool result → history
            "decision": "$memory.human_input.decision",   # human answer → memory
        })),
])
```

Когда таймаут срабатывает до того, как человек ответит, шаг использует запасное
значение и записывает `result_data["timed_out"] = True`. Пример также охватывает
цикл обратной связи для доработки и пакетный режим без колбэка.

## Смотрите также

- [Пример human-in-the-loop](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) в репозитории — показывает подключение обработчика ввода.
- [Conditional-шаги](/ru/carl/steps/conditional/) — ветвление на ответе человека.
