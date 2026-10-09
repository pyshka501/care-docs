---
title: Tool-шаг
description: Вызов зарегистрированных Python-функций внутри цепочки, с типизированными входами, проверками до вызова, повторами и запасными инструментами.
sidebar:
  order: 3
---

`ToolStepDescription` вызывает Python-функцию, которую вы зарегистрировали в контексте.
Поведение шага настраивается через `ToolStepConfig`.

## Сначала зарегистрируйте инструмент

Инструменты ищутся по имени в реестре инструментов контекста:

```python
def calculate_growth(data: str) -> dict:
    return {"growth_rate": 0.15, "trend": "positive"}

context.register_tool("calculate_growth", calculate_growth)
```

Подходят и обычные, и `async`-функции. Обычная функция выполняется в рабочем
потоке (`asyncio.to_thread`), `async`-функция ожидается напрямую. В обоих случаях
действует ограничение `ToolStepConfig.timeout`.

:::caution
Инструменты в **параллельных** шагах должны быть **без состояния**. Параллельные
шаги используют одни и те же функции, поэтому потокобезопасность изменяемого
состояния остаётся на вас. Синхронный инструмент, который уже работает в рабочем
потоке, нельзя принудительно остановить по таймауту.
:::

## ToolStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `tool_name` | `str` | обязательное | Имя зарегистрированного инструмента. |
| `tool_description` | `str` | `""` | Что делает инструмент. |
| `parameters` | `list[ToolParameter]` | `[]` | Объявленные параметры: типы для приведения и флаг `required`. |
| `input_mapping` | `dict[str, str]` | `{}` | Имя параметра инструмента → [ссылка](/ru/carl/chains/dynamic-references/) или литерал в кавычках. |
| `timeout` | `float` | `30.0` | Секунд на один вызов. |
| `error_recovery` | `ToolErrorRecovery \| None` | `None` | Повторы и запасные инструменты (ниже). |
| `allowed_tool_tags` | `list[str] \| None` | `None` | Разрешённые теги. Шаг отказывается вызывать инструмент, у которого нет ни одного из этих тегов. |
| `output_key` | `str` | `"result"` | Принимается ради совместимости. Исполнитель tool-шагов его не читает. |
| `retry_on_error` | `bool` | `True` | Принимается ради совместимости. Исполнитель tool-шагов его не читает, используйте `error_recovery`. |

### ToolParameter

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `name` | `str` | обязательное | Имя параметра (совпадает с ключом в `input_mapping`). |
| `type` | `str` | `"string"` | `string`, `int`, `float`, `bool`, `list` или `dict`. Строковое значение приводится к этому типу, `list` и `dict` разбираются как JSON. |
| `description` | `str` | `""` | Произвольный текст. |
| `required` | `bool` | `True` | См. раздел «Неразрешённые входы» ниже. |
| `default` | `Any` | `None` | Только для информации. |

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig, ToolParameter

ToolStepDescription(
    number=2,
    title="Calculate growth",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="calculate_growth",
        parameters=[ToolParameter(name="data", type="string")],
        input_mapping={"data": "$history[-1]"},  # feed step 1's output
    ),
)
```

## Входные данные от хоста: `$outer_context.<field>`

Когда хост передаёт структурированный вход в `ReasoningContext.runtime_input`,
маппинг может прочитать одно его поле:

```python
context = ReasoningContext(
    outer_context="Plan a trip.",          # prompt text for LLM steps
    runtime_input={"user": {"city": "Oslo"}},
    api=client,
)

ToolStepConfig(
    tool_name="weather",
    parameters=[ToolParameter(name="city", type="string")],
    input_mapping={"city": "$outer_context.user.city"},   # → "Oslo"
)
```

Если `runtime_input` задан, `$outer_context` указывает на `runtime_input`, а не на
текст промпта. Без него `$outer_context.<field>` читает из `outer_context`, если
там лежит JSON-объект. `runtime_input` копируется в контекст каждого шага, поэтому
ссылка работает внутри `chain.execute()` и в параллельных батчах. Подробнее:
[динамические ссылки](/ru/carl/chains/dynamic-references/).

## Неразрешённые входы падают до вызова

Если **обязательный** параметр разрешается в `None`, шаг падает, а инструмент
**не вызывается**:

```
CARL_TOOL_INPUT_UNRESOLVED: required parameter 'city' resolved to null; check input_mapping and runtime input.
```

Параметр обязателен, если в его `ToolParameter` стоит `required=True` (это
значение по умолчанию). Если объявления нет, CARL смотрит на сигнатуру функции.
Параметр без значения по умолчанию обязателен. Обязательно и любое имя, которого
нет в сигнатуре (например, у инструмента с `**kwargs`). Необязательные входы
помечайте `ToolParameter(..., required=False)` или задайте параметру функции
значение по умолчанию.

Типичные причины:

- опечатка в ссылке или ключ `$memory`, в который не пишет ни один шаг;
- `$outer_context.<field>`, когда поля нет в `runtime_input`;
- **литерал без кавычек**. Строка, которая не является ссылкой на `$` и не взята
  в кавычки, ищется как ключ метаданных и обычно разрешается в `None`. Пишите
  литералы в кавычках и объявляйте тип:

```python
ToolStepConfig(
    tool_name="total",
    parameters=[ToolParameter(name="values", type="list")],
    input_mapping={"values": '"[100, 200, 300]"'},   # quoted → parsed as JSON list
)
```

## Восстановление после ошибок

`ToolErrorRecovery` добавляет повторы и запасные инструменты:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `retry_max` | `int` | `0` | Дополнительные попытки после первой ошибки. |
| `retry_delay` | `float` | `0.0` | Пауза между попытками в секундах. |
| `on_timeout` | `str \| None` | `None` | Запасной инструмент при таймауте. |
| `on_exception` | `str \| None` | `None` | Запасной инструмент, когда повторы исчерпаны. |

```python
from mmar_carl import ToolStepConfig, ToolErrorRecovery

ToolStepConfig(
    tool_name="web_search",
    error_recovery=ToolErrorRecovery(
        retry_max=2,
        retry_delay=1.0,
        on_timeout="cached_search",    # registered fallback tool
        on_exception="cached_search",
    ),
)
```

Запасной инструмент получает те же именованные аргументы, что и основной.
`CARL_TOOL_INPUT_UNRESOLVED` возникает до первой попытки, поэтому повторы и
запасные инструменты никогда не запускаются с пропущенным входом.

## Результат

При успехе результат шага содержит:

- `result_data`: значение, которое вернул инструмент, как есть (позже его можно
  прочитать через `$steps.<n>.result_data` или `$metadata.step_<n>`);
- `result`: то же значение строкой (JSON для нестроковых значений);
- запись истории `Step N. <title> [TOOL: <name>]` с результатом.

Таймаут или исключение дают `success=False` с `error_message`. Запустятся ли
зависимые шаги, решает [fail-fast](/ru/carl/chains/run-controls/).

## Инструменты, которые являются цепочками

[Цепочка-инструмент](/ru/carl/steps/chain-tools/) регистрируется под своим именем,
и tool-шаг вызывает её как обычную функцию. Она возвращает типизированный конверт.
Tool-шаг успешен, даже если вложенная цепочка завершилась неудачей, поэтому
проверяйте поле `status` конверта.

## Регистрация многих инструментов сразу

Используйте [декоратор `@carl_tool` и динамическое обнаружение](/ru/carl/steps/tool-discovery/),
чтобы регистрировать инструменты пачкой (из модуля, по glob-шаблону или из фабрики).

## См. также

- [Обнаружение инструментов](/ru/carl/steps/tool-discovery/): `@carl_tool`, `register_tools_from_path`, обнаружение во время выполнения.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/): что можно писать в `input_mapping`.
- [Map-шаг](/ru/carl/steps/map/): вызвать один инструмент для каждого элемента списка.
- [Agent-шаг](/ru/carl/steps/agent/): дать LLM выбирать вызовы инструментов в ограниченном цикле.
