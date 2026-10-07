---
title: Supervisor
description: LLM выбирает одну из N именованных под-цепочек, и шаг её запускает.
sidebar:
  order: 2
---

`SupervisorStepDescription` делает один LLM-вызов для маршрутизации, сопоставляет
ответ с именами в `agents` и запускает выбранную под-цепочку в изолированном
контексте. Результат возвращается в родителя так же, как в
[handoff](/ru/carl/orchestration/handoff/).

```python
from mmar_carl import SupervisorStepConfig, SupervisorStepDescription

SupervisorStepDescription(
    number=1,
    title="Route to specialist",
    agents={"pdf": pdf_chain, "search": search_chain, "code": code_chain},
    config=SupervisorStepConfig(
        routing_prompt=(
            "Pick ONE specialist for the task. Reply with just the name.\n"
            "Specialists: {agents}\n\nTask: {task}"
        ),
        fallback_agent="search",
        output_memory_key="specialist_result",
    ),
)
```

`agents` — обязательный `dict[str, ReasoningChain]`. С пустым словарём шаг падает.

## SupervisorStepConfig

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `routing_prompt` | обязательное | Шаблон вызова маршрутизации. `{task}` — текст задачи, `{agents}` — имена через запятую. Шаблон проходит через `str.format`, поэтому фигурные скобки в тексте пишут как `{{` и `}}`. |
| `task_source` | `"$outer_context"` | Откуда брать задачу: `$outer_context`, `$memory.ns.key`, `$history[-1]` или литерал в кавычках. Нестроковые значения кодируются в JSON. |
| `fallback_agent` | `None` | Агент на случай, когда ответ не совпал ни с одним именем. При `None` такой ответ роняет шаг. |
| `allow_substring_match` | `False` | Включает третий уровень сопоставления (см. ниже). |
| `warn_on_ambiguous_route` | `True` | Предупреждать, если ответ совпал с несколькими именами на выигравшем уровне. |
| `input_mapping` | `{}` | Значения, которые копируются в память под-цепочки. Правила те же, что у [handoff](/ru/carl/orchestration/handoff/). |
| `output_memory_key` | `""` | Ключ в памяти родителя для итогового вывода под-цепочки. Пустая строка отключает запись. |
| `output_namespace` | `"supervisor"` | Пространство имён для `output_memory_key`. |
| `propagate_failure` | `True` | При `False` сбой под-цепочки записывается в `result_data`, но шаг считается успешным. |
| `inherit_tools` | `True` | Скопировать реестр инструментов родителя (и их теги) в под-контекст. |
| `timeout` | `None` | Лимит на запуск под-цепочки в секундах, `> 0`. Истечение роняет шаг. |
| `llm_config` | `None` | `LLMStepConfig` только для вызова маршрутизации. |

## Как сопоставляется ответ

Ответ обрезается по краям и переводится в нижний регистр. Имена агентов сравниваются
без учёта регистра:

1. `exact`: весь ответ и есть имя агента.
2. `whole_word`: имя агента встречается в ответе отдельным словом.
3. `substring`: имя агента встречается в ответе где угодно. Этот уровень работает
   только при `allow_substring_match=True`. Он ошибается: агент `code` совпадёт с
   ответом, где упомянут «codebase».

Если ничего не совпало, берётся `fallback_agent` и выдаётся предупреждение (через
`warnings.warn` и логгер `mmar_carl`). Без запасного агента шаг падает с ошибкой,
в которой процитирован ответ.

Если на выигравшем уровне совпало несколько имён, побеждает первое.
`routing_ambiguous` становится `True`, все совпадения попадают в
`routing_candidates`. Предупреждение выдаётся, если не выставлено
`warn_on_ambiguous_route=False`.

## Что видит под-цепочка

Под-контекст получает от родителя `outer_context`, LLM-клиент, язык, системный
промпт и политику команд. История пустая, память — глубокая копия памяти родителя.
До применения `input_mapping` supervisor записывает два ключа:

- `$memory.input.task`: текст задачи;
- `$memory.input.supervisor_agent`: имя выбранного агента.

## Результат

`step_result.result` — итоговый вывод под-цепочки. Подробности удобно читать через
типизированное представление:

```python
decision = step_result.as_supervisor_decision()
decision.agent_selected        # "search"
decision.routing_match_tier    # "exact" | "whole_word" | "substring" | "fallback_agent"
decision.routing_ambiguous     # bool
decision.routing_candidates    # list[str]
decision.routing_reply         # raw routing reply
decision.sub_result            # ReasoningResult of the sub-chain
```

Перед запуском под-цепочки шаг отправляет внутришаговое событие
`supervisor.route_selected` с `{"agent_name": ...}` через `context.on_step_event`.

## Сериализация

`to_dict()` пишет `agents` как вложенные цепочки (формат 11), `from_dict()` их
восстанавливает. Цепочки формата 10 и старше загружаются с пустым `agents`, его
нужно заполнить самому. Ограничения описаны в
[обзоре](/ru/carl/orchestration/overview/#сериализация-топологии).

## См. также

- [Handoff](/ru/carl/orchestration/handoff/): передача одной заранее известной под-цепочке.
- [Пример маршрутизации supervisor](https://github.com/Glazkoff/carl/blob/main/examples/agents/supervisor_routing_example.py)
  (mock-клиент, без API-ключа).
