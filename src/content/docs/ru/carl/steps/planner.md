---
title: Шаг Planner
description: Модель выбирает и упорядочивает ограниченный набор действий-инструментов, заранее объявленных в цепочке.
sidebar:
  order: 23
---

`PlannerStepDescription` (`step_type: "planner"`, появился в 0.5.0) даёт
модели выбрать, какие из заранее заданных действий-инструментов выполнить и в
каком порядке. Действия и их аргументы объявляет цепочка. Модель возвращает
только id действий. Затем CARL добавляет выбранные действия в идущий DAG как
обычные [tool-шаги](/ru/carl/steps/tool/).

Пустой план допустим. Шаг, который зависит от планировщика, ждёт, пока
закончится вся выбранная последовательность.

## Пример

```python
from mmar_carl import (
    Language, LLMStepDescription, PlannerStepConfig, PlannerStepDescription,
    ReasoningChain, ReasoningContext, ToolStepConfig,
)

plan = PlannerStepDescription(
    number=1,
    title="Choose checks",
    config=PlannerStepConfig(
        instruction="Select the checks the user asked for.",
        input_mapping={"request": "$outer_context.request"},
        actions={
            "inventory": ToolStepConfig(
                tool_name="check_inventory",
                tool_description="Count units in stock",
                input_mapping={"product_id": "$outer_context.product_id"},
            ),
            "price": ToolStepConfig(
                tool_name="check_price",
                tool_description="Look up the current price",
                input_mapping={"product_id": "$outer_context.product_id"},
            ),
        },
        max_actions=2,
    ),
)
report = LLMStepDescription(number=2, title="Report", aim="Summarise the checks.", dependencies=[1])
chain = ReasoningChain(steps=[plan, report])

context = ReasoningContext(
    outer_context="How much is SKU-7?",
    runtime_input={"request": "How much is SKU-7?", "product_id": "SKU-7"},
    api=client,
    language=Language.ENGLISH,
)
context.register_tool("check_inventory", lambda product_id: {"units": 12})
context.register_tool("check_price", lambda product_id: {"price": 19.9})

result = chain.execute(context)
```

Если модель ответит `{"actions": ["price"]}`, в прогоне будут планировщик
(шаг 1), вставленный tool-шаг с заголовком `price` (шаг 3, следующий свободный
номер) и затем отчёт (шаг 2), который дождался шага 3.

## PlannerStepConfig

Неизвестные поля модель отклоняет.

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `instruction` | `str` | обязательное | Что планировать, 1–8192 символа. |
| `actions` | `dict[str, ToolStepConfig]` | обязательное | 1–32 именованных действия. Имена от 1 до 64 символов. Каждое значение это полный конфиг инструмента со своим `input_mapping`. |
| `input_mapping` | `dict[str, str]` | `{}` | Входы, которые видит модель: `{имя: ссылка}`. |
| `max_actions` | `int` | `3` | Верхняя граница длины плана, 1–16. |

`PlannerStepDescription` также принимает необязательный `llm_config` для
вызова планирования. `cache` отклоняется: планировщик добавляет шаги в DAG.

## Как строится план

Планировщик делает вызов [структурированного вывода](/ru/carl/steps/structured-output/).
В промпт идут `instruction`, значения `input_mapping` и каталог имён действий с
их `tool_description` (или `tool_name`, если описание пустое). Ответ должен
пройти JSON Schema: `{"actions": [...]}`, не больше `max_actions` уникальных
имён из `actions`.

Модель не может передать аргументы инструменту, придумать инструмент или
добавить ещё один планировщик. Аргументы остаются в цепочке. Регистрируйте
только те инструменты, которые хост готов вызывать; `chain.preflight(context)`
перечисляет основные и запасные инструменты всех действий.

## Результат

| Где | Что |
| --- | --- |
| `$steps.N.result_data.actions` | Выбранные id действий по порядку. |
| `$steps.N.result_data.step_numbers` | Номера, выданные вставленным tool-шагам, в том же порядке (для непустого плана). |
| Вставленные шаги | Обычные результаты tool-шагов с именем действия в заголовке. Каждый зависит от предыдущего. |

`ReasoningContext.on_step_complete` срабатывает, когда планировщик сделал выбор,
а другие шаги его батча ещё могут идти. Для непустого плана
`on_step_event(planner_number, "planner_actions_scheduled", payload)`
срабатывает после выдачи номеров и до старта инструментов. В payload лежат
параллельные списки `actions` и `step_numbers`.

Упавший вставленный инструмент ведёт себя как любой упавший шаг. Включите
[`fail_fast`](/ru/carl/chains/run-controls/) у цепочки, если сбой инструмента
должен остановить остаток плана.

## Ограничения

- Цепочка с планировщиком не принимает RE-PLAN, циклы с возвратом,
  воспроизведение трассы и продолжение из сохранённого снимка. Пауза и
  возобновление внутри процесса работают как обычно.
- Бюджет планировщика равен `max_actions` или числу `actions`, если их меньше.
  Сумма по всем планировщикам должна укладываться в `max_injections` цепочки
  (по умолчанию 50), иначе цепочка отклоняется при сборке.
- Тип шага появился в формате 13. Читатель старше 0.5.0 отклоняет формат 13 и
  новее с `ChainFormatNewerError`.

## См. также

- [Command plan](/ru/carl/steps/command-plan/): модель выбирает типизированные аргументы для одной возможности хоста.
- [Agent-шаг](/ru/carl/steps/agent/): ограниченный цикл, где модель выбирает и аргументы.
- [Tool-шаг](/ru/carl/steps/tool/) · [Динамические ссылки](/ru/carl/chains/dynamic-references/)
