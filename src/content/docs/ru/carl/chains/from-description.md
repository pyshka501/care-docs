---
title: Генерация по описанию
description: LLM планирует цепочку по задаче на естественном языке.
sidebar:
  order: 3
---

`ChainBuilder.from_description` просит LLM **спланировать** цепочку под задачу,
а затем разбирает план через `ReasoningChain.from_dict`. Поэтому работают
обычные проверки: поиск циклов, ссылки зависимостей, предупреждения о
синтаксисе ссылок.

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

Это `async` classmethod.

## Что может выдать планировщик

С 0.5.0 промпт планирования собирается из живого каталога шагов
(`get_step_catalog().generation_prompt(...)`), поэтому описывает **все**
зарегистрированные типы: по компактной карточке на тип и грамматику ссылок
`$...`. `available_tools` и `available_skills` перечисляются для шагов `tool` и
`agent_skill`. `capability_library` (`CapabilityLibrary`) добавляет в промпт
подобранный список инструментов и навыков. Maestro этим помощником не
пользуется, у него свой генератор.

## Параметры

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `task` | `str` | обязателен | Что должна делать цепочка. |
| `llm_client` | `Any` | обязателен | `LLMClientBase` или любой объект с async `get_response_with_retries(prompt, retries=…)` либо `get_response(prompt)`. |
| `available_skills` | `list[str] \| None` | `None` | Имена навыков, которые планировщик может взять в шаги `agent_skill`. |
| `available_tools` | `list[str] \| None` | `None` | Имена инструментов, которые планировщику велено использовать в шагах `tool`. |
| `capability_library` | `CapabilityLibrary \| None` | `None` | Дополнительные описания инструментов и навыков для промпта (EvoC). |
| `max_steps` | `int` | `10` | Предел числа шагов в плане (при превышении `ValueError`). |
| `max_workers` | `int \| str` | `"auto"` | Значение воркеров у итоговой цепочки. |
| `extra_instructions` | `str` | `""` | Свободный текст в конце промпта планирования. |
| `max_retries` | `int` | `2` | Число раундов самоисправления, если план не разобрался или не прошёл проверку. |

:::caution
`available_tools` — подсказка в промпте, а не проверка. План с неизвестным
инструментом будет принят. Перед запуском сгенерированной цепочки вызовите
`chain.preflight(context)`, чтобы поймать отсутствующие инструменты.
:::

Ответ может быть обёрнут в ```` ```json ````; обёртка снимается.

## Происхождение

След планировщика пишется в `chain.metadata` для разбора задним числом:
`planner_prompt` и `planner_reply` (оба обрезаны), `planner_attempts` (по записи
на попытку: промпт, ответ и ошибка проверки) и `generated_from_description`.

## См. также

- [Пример chain_from_description](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/examples/skills/chain_from_description_example.py) в репозитории.
- [ChainBuilder](/ru/carl/chains/builder/) · [Preflight](/ru/carl/care-integration/preflight/)
