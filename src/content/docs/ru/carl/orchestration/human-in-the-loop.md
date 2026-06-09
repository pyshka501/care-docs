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
ветвитесь на нём с помощью [conditional-шага](/ru/carl/steps/conditional/).

## Смотрите также

- [Пример human-in-the-loop](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) в репозитории — показывает подключение обработчика ввода.
- [Conditional-шаги](/ru/carl/steps/conditional/) — ветвление на ответе человека.
