---
title: Генерация из описания
description: Попросите LLM спланировать цепочку из задачи на естественном языке.
sidebar:
  order: 3
---

`ChainBuilder.from_description` — метаагент: он просит LLM **спланировать** цепочку
из LLM / Tool / Memory / Transform / Conditional-шагов для задачи, затем парсит
план через `ReasoningChain.from_dict`, применяя все обычные проверки (обнаружение
циклов, ссылки на зависимости, предупреждения о синтаксисе ссылок).

```python
from mmar_carl import ChainBuilder

chain = await ChainBuilder.from_description(
    task="Outline the key arguments in the text, then condense them to 3 bullets.",
    llm_client=client,
    max_steps=4,
    max_retries=2,                       # self-correct on validation errors
    available_tools=["fetch", "summarise"],
)
```

## Параметры

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `task` | `str` | — (обязательное) | Описание задачи на естественном языке. |
| `llm_client` | `Any` | — (обязательное) | Async-клиент с методом `get_response_with_retries(prompt, retries=…)` или `get_response(prompt)`. |
| `available_skills` | `list[str] \| None` | `None` | Имена навыков, упоминаемые в промпте планировщика. |
| `available_tools` | `list[str] \| None` | `None` | Имена инструментов, которые планировщик может использовать (tool-шаги должны использовать именно эти). |
| `max_steps` | `int` | `10` | Верхний предел планируемых шагов (вызывает `ValueError` при превышении). |
| `max_workers` | `int \| str` | `"auto"` | Настройка воркеров для результирующей цепочки. |
| `extra_instructions` | `str` | `""` | Свободный текст, добавляемый в конец промпта планировщика. |
| `max_retries` | `int` | `2` | Раунды самокоррекции при неудачной валидации сгенерированной цепочки. |

Это `async` classmethod — используйте `await`.

## Провенанс

Полный след планировщика записывается в `chain.metadata` для автономной диагностики:
`planner_prompt`, `planner_reply` и журнал попыток `planner_attempts` на каждую итерацию
(включая ошибки валидации, запустившие повтор).

## Смотрите также

- [Пример chain_from_description](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/chain_from_description_example.py) в репозитории.
