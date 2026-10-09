---
title: Цепочки как инструменты
description: Встраивание целой цепочки как типизированного изолированного инструмента, который могут вызывать другие шаги. Схемы, изоляция, лимиты, версии инструментов хоста и результаты.
sidebar:
  order: 19
---

**Инструмент-цепочка** упаковывает целый `ReasoningChain` в вызываемый инструмент.
Родительская цепочка хранит его в своём поле верхнего уровня `chain_tools`. Во время
выполнения он регистрируется под своим именем, поэтому
[tool-шаг](/ru/carl/steps/tool/), [agent-шаг](/ru/carl/steps/agent/) или
[map-шаг](/ru/carl/steps/map/) могут вызывать его как обычную функцию.

Используйте его, чтобы переиспользовать проверенную подцепочку со строгим контрактом:
типизированный вход, типизированный выход, свой бюджет и никакого доступа к состоянию
родителя. Чтобы запустить подцепочку, которая делит память с родителем, используйте
[handoff](/ru/carl/orchestration/handoff/).

## Определение инструмента-цепочки

```python
from mmar_carl import (
    ChainToolDefinition, ReasoningChain, ToolStepConfig, ToolStepDescription,
)

child = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Normalize text",
        config=ToolStepConfig(tool_name="normalize",
                              input_mapping={"payload": "$outer_context"}),
    ),
])

normalizer = ChainToolDefinition.from_chain(
    name="normalize_with_chain",
    description="Run the pinned normalizer chain.",
    chain=child,
    input_schema={
        "type": "object",
        "properties": {"text": {"type": "string"}},
        "required": ["text"],
        "additionalProperties": False,
    },
    output_schema={
        "type": "object",
        "properties": {"normalized": {"type": "string"}},
        "required": ["normalized"],
        "additionalProperties": False,
    },
    output_reference="$steps.1.result_data",
    allowed_tools=["normalize"],        # host tools the child may use
    timeout_seconds=5,
)
```

`from_chain` замораживает дочернюю цепочку через `chain.to_dict()`. Последующие
правки `child` не меняют инструмент.

## Использование из родительской цепочки

```python
parent = ReasoningChain(
    steps=[
        ToolStepDescription(
            number=1,
            title="Invoke child chain",
            config=ToolStepConfig(tool_name="normalize_with_chain",
                                  input_mapping={"text": "$outer_context"}),
        ),
    ],
    chain_tools=[normalizer],
)

context = ReasoningContext(outer_context="  CARL Composition  ", api=client)
context.register_tool("normalize", normalize)    # every allowed_tools entry must exist

result = await parent.execute_async(context)
outcome = ChainToolOutcome.model_validate(result.step_results[0].result_data)
if outcome.success:
    print(outcome.output)        # {'normalized': 'carl composition'}
else:
    print(outcome.status, outcome.error_code, outcome.error_message)
```

С `ChainBuilder` определения добавляются через `.add_chain_tool(definition)`. Чтобы
зарегистрировать определение прямо в контексте, вызовите
`context.register_chain_tool(definition)`. Повторная регистрация того же контракта
ничего не делает. Конфликт имени с другим инструментом вызывает ошибку, если не
передан `replace=True`.

:::caution
Tool-шаг, который вызывает инструмент-цепочку, **завершается успешно, даже если
вложенная цепочка упала**: инструмент вернул корректный конверт. Всегда проверяйте
`ChainToolOutcome.status` (или `success`). Успехом считается только `completed`.
:::

## ChainToolDefinition

Модель заморожена и отклоняет неизвестные поля.

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `name` | `str` | обязательно | Имя инструмента: первой идёт буква или `_`, дальше буквы, цифры, `_`, `-`. Не длиннее 64 символов. `finish` зарезервировано. |
| `description` | `str` | обязательно | Не длиннее 2000 символов, непустое. |
| `chain_snapshot` | `dict` | обязательно | Полный payload `ReasoningChain.to_dict()` (`format_version` и `steps` обязательны). |
| `snapshot_sha256` | `str` | вычисляется | SHA-256 канонического JSON снимка. Если вы передаёте значение, оно должно совпасть. |
| `input_schema` | `dict` | обязательно | Схема именованных аргументов. Должна быть `type: object`. |
| `output_schema` | `dict` | обязательно | Схема значения, которое читается из дочерней цепочки после её завершения. |
| `output_reference` | `str` | обязательно | Ссылка в дочерней цепочке, откуда читать: `$history…`, `$memory.…`, `$metadata.…`, `$steps.…` или `$outer_context…`. |
| `allowed_tools` | `list[str]` | `[]` | Инструменты хоста, которые копируются в дочерний контекст. Имена уникальны. Инструмент не может указать сам себя. |
| `required_tool_revisions` | `dict[str, str]` | `{}` | Закреплённые ревизии инструментов хоста (см. ниже). |
| `tags` | `list[str]` | `["chain"]` | Теги зарегистрированного инструмента (для `allowed_tool_tags`). |
| `max_depth` | `int` | `4` | Предел вложенности, 1–32. |
| `timeout_seconds` | `float` | `120.0` | Бюджет на один вызов, конечный, не больше 86 400. |
| `max_input_bytes` | `int` | `1000000` | Лимит на аргументы в JSON (не больше 16 МБ). |
| `max_output_bytes` | `int` | `1000000` | Лимит на вывод в JSON (не больше 16 МБ). |
| `contract_version` | `1` | `1` | Версия конверта. |

### Подмножество схемы

Обе схемы используют небольшое подмножество JSON Schema. Оно проверяется при создании
определения: `type` (`null`, `boolean`, `integer`, `number`, `string`, `array`,
`object`), `properties`, `required`, `items`, `enum` и
`additionalProperties: false`. Любое другое ключевое слово отклоняется.

## Изоляция

Дочерняя цепочка получает новый контекст:

- проверенные аргументы как JSON в `outer_context`, так что их читают
  `$outer_context` и `$outer_context.<field>` (они же служат её `runtime_input`);
- LLM-клиент, модель, язык, системный промпт и настройки повторов родителя;
- **только** инструменты хоста из `allowed_tools` и инструменты-цепочки, встроенные в
  её собственный снимок;
- пустые память и историю.

Она не может читать историю, память, сообщения и метаданные родителя. Она не
наследует колбэки, шину событий, `CommandPolicy`, контроль сети и другие права на
выполнение. Отмена родителя отменяет и дочернюю цепочку.

## Проверки до и во время запуска

При создании родительской цепочки:

- имена инструментов-цепочек должны быть уникальными;
- определение не может указывать соседний инструмент-цепочку в `allowed_tools`.
  Вместо этого вложите его в собственный `chain_tools` дочерней цепочки;
- каждый инструмент, который требуется снимку дочерней цепочки, должен быть в
  `allowed_tools`.

При запуске родителя каждая запись `allowed_tools` должна быть зарегистрирована в
контексте. Иначе выполнение останавливается с `Embedded chain tools require missing host
tools: …`. Имя, уже занятое другим инструментом, считается ошибкой.

## Версии инструментов хоста

`required_tool_revisions` закрепляет инструменты хоста, от которых зависит
инструмент-цепочка. Ключи должны быть в `allowed_tools`, значения — hex-дайджесты
SHA-256. Перед каждым вызовом рантайм сравнивает каждое значение с атрибутом
`__carl_tool_revision__` вызываемого объекта. Если у инструмента другая ревизия (или её
нет), вызов получает статус `unavailable` с `error_code="missing_host_tools"`.

```python
def normalize(payload):
    return {"normalized": payload["text"].strip().lower()}

normalize.__carl_tool_revision__ = "<sha256 of this tool version>"

pinned = ChainToolDefinition.model_validate({
    **normalizer.model_dump(),
    "required_tool_revisions": {"normalize": "<sha256 of this tool version>"},
})
```

У `from_chain` нет параметра для ревизий, поэтому добавляйте их, как показано выше.

## ChainToolOutcome

Каждый вызов возвращает этот конверт (как словарь в `result_data` tool-шага):

| Поле | Значение |
| --- | --- |
| `status` | `completed`, `failed`, `cancelled`, `timed_out`, `invalid_input`, `invalid_output`, `unavailable` или `recursion_limit`. |
| `success` | `True` только для `completed`. |
| `output` | Вывод, прошедший схему. Только при `completed`. |
| `error_code`, `error_message` | Почему вызов не завершился. |
| `invocation_id`, `tool_name`, `depth` | Идентификация этого вызова. |
| `snapshot_sha256`, `input_sha256`, `output_sha256` | Дайджесты происхождения. `output_sha256` только при `completed`. |
| `duration_seconds`, `token_usage`, `executed_steps` | Стоимость вызова. |

| `status` | Типичный `error_code` |
| --- | --- |
| `invalid_input` | `input_not_json`, `input_too_large`, `input_schema_mismatch` |
| `unavailable` | `missing_host_tools`, `invalid_chain_snapshot`, `snapshot_digest_mismatch` |
| `recursion_limit` | `recursion_limit` (цикл или глубина больше `max_depth`) |
| `cancelled` | `cancelled_by_host` |
| `timed_out` | `chain_tool_timeout` |
| `failed` | `nested_chain_failed`, `nested_execution_exception` |
| `invalid_output` | `output_not_json`, `output_too_large`, `output_schema_mismatch` |

## Сериализация

`chain_tools` записывается через `to_dict()` и читается обратно через `from_dict()`.
JSON цепочек, созданный до появления поля `chain_tools`, мигрирует через
`ReasoningChain.migrate(raw)`, который добавляет пустой список. Рантайм, который не
знает этого поля, отклоняет цепочку с `ChainFormatNewerError`, а не отбрасывает
вложенные цепочки молча. См. [миграцию](/ru/carl/serialization/migration/).

## См. также

- [Handoff](/ru/carl/orchestration/handoff/): запуск подцепочки, которая делит состояние с родителем.
- [Tool-шаг](/ru/carl/steps/tool/) · [Agent-шаг](/ru/carl/steps/agent/) · [Map-шаг](/ru/carl/steps/map/)
- [Пример](https://github.com/Glazkoff/carl/blob/main/examples/agents/chain_as_tool_example.py) в репозитории.
