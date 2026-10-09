---
title: Handoff
description: Запуск целой под-цепочки внутри родительского прогона с изолированным контекстом.
sidebar:
  order: 3
---

`AgentHandoffStepDescription` запускает целую под-цепочку как один шаг. Под-цепочка
получает собственный `ReasoningContext`, построенный от родителя. Входы задаёт
`input_mapping`, итоговый вывод записывается обратно в память родителя.

```python
from mmar_carl import AgentHandoffStepConfig, AgentHandoffStepDescription

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={
            "input.topic": "$memory.input.topic",
            "input.lang": "'english'",
        },
        output_memory_key="research_result",
    ),
)
```

`sub_chain` — обязательный `ReasoningChain`. Если во время запуска он равен `None`,
шаг падает с понятной ошибкой.

## AgentHandoffStepConfig

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `input_mapping` | `{}` | Ключи — пути `namespace.key` в памяти под-цепочки. Ключ без точки попадает в пространство `input`. Значения — ссылки на родителя: `$memory.ns.key`, `$history[-1]`, `$outer_context` или литерал в кавычках. |
| `output_memory_key` | `""` | Ключ в памяти родителя для итогового вывода. Пустая строка отключает запись. Запись идёт только при успехе под-цепочки. |
| `output_namespace` | `"handoff"` | Пространство имён для `output_memory_key`. |
| `propagate_failure` | `True` | При `False` сбой под-цепочки записывается, но шаг считается успешным. |
| `inherit_tools` | `True` | Скопировать реестр инструментов родителя в под-контекст. |
| `timeout` | `None` | Лимит на запуск под-цепочки в секундах, `> 0`. Истечение роняет шаг. |

## Что видит под-цепочка

Под-контекст получает от родителя `outer_context`, LLM-клиент, модель, число
повторов, язык, системный промпт, лимиты истории и политику команд. История
начинается с нуля. Память — **глубокая копия** памяти родителя, поэтому записи
внутри под-цепочки наружу не утекают. В родителя пишется только `output_memory_key`.

## Результат

- `step_result.result`: итоговый вывод под-цепочки (или её последняя запись истории).
- `result_data["sub_result"]`: полный `ReasoningResult` под-цепочки.
- `result_data["sub_chain_success"]` и `result_data["steps_executed"]`.

Типизированного метода для handoff нет, ключи читаются напрямую.

## Сериализация

`to_dict()` пишет `sub_chain` как полный вложенный словарь цепочки (формат 11),
`from_dict()` восстанавливает настоящую под-цепочку. В цепочке формата 10 и старше
под-цепочки в JSON нет. Она загружается с под-цепочкой из одного шага
`__placeholder__`, которую нужно заменить перед запуском. Ограничения по глубине и
циклам описаны в [обзоре](/ru/carl/orchestration/overview/#сериализация-топологии).

## Handoff, supervisor или цепочка-инструмент

- **Handoff** запускает одну известную под-цепочку в фиксированном месте DAG.
- **[Supervisor](/ru/carl/orchestration/supervisor/)** даёт LLM выбрать одну из нескольких под-цепочек.
- **[Цепочки как инструменты](/ru/carl/steps/chain-tools/)** превращают цепочку в инструмент, который агент может вызвать или пропустить.
