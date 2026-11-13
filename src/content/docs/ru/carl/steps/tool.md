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

- `result_data`: значение, которое вернул инструмент (позже его можно прочитать
  через `$steps.<n>.result_data` или `$metadata.step_<n>`). С 0.5.0 строка, в
  которой целиком лежит JSON-объект или массив, раскладывается, так что
  инструмент, вернувший JSON текстом, может кормить `$steps.<n>.result_data.<поле>`;
- `result`: значение строкой (JSON для нестроковых значений, исходный текст для
  строк);
- `tool_name`: инструмент, который на самом деле ответил, то есть имя запасного,
  если `ToolErrorRecovery` на него переключился;
- запись истории `Step N. <title> [TOOL: <name>]` с результатом.

Таймаут или исключение дают `success=False` с `error_message`. Запустятся ли
зависимые шаги, решает [fail-fast](/ru/carl/chains/run-controls/).

## Инструменты, которые являются цепочками

[Цепочка-инструмент](/ru/carl/steps/chain-tools/) регистрируется под своим именем,
и tool-шаг вызывает её как обычную функцию. Она возвращает типизированный конверт.
С 0.5.0 tool-шаг падает, если `status` конверта не `completed`. Сам конверт
остаётся в `result_data`.

## Ранний запуск инструментов (экспериментально)

`execute_eager_tools()` (появилась в 0.5.0, экспериментальная) выполняет
статический граф tool-шагов без пакетного планировщика. Инструмент стартует,
как только его объявленные зависимости успешно завершились и есть свободный
воркер. Результаты возвращаются в порядке объявления.

```python
import asyncio
from mmar_carl import ToolStepConfig, ToolStepDescription
from mmar_carl.eager_tools import execute_eager_tools

async def add_one(value):
    return {"value": value + 1}

async def double(value):
    return {"value": value * 2}

steps = [
    ToolStepDescription(number=1, title="Add one", config=ToolStepConfig(
        tool_name="add_one", input_mapping={"value": "$outer_context.value"})),
    ToolStepDescription(number=2, title="Double", dependencies=[1], config=ToolStepConfig(
        tool_name="double", input_mapping={"value": "$steps.1.result_data.value"})),
]
results = asyncio.run(execute_eager_tools(
    steps,
    tools={"add_one": add_one, "double": double},
    outer_context={"value": 20},
    max_concurrency=2,
))
# [шаг 1 → {'value': 21}, шаг 2 → {'value': 42}]
```

Это API хоста, а не тип шага. Импортируется из `mmar_carl.eager_tools`, на
верхнем уровне пакета его нет. Правила:

- Инструменты передаются явным словарём доверенных функций `async def`. Они
  должны быть без состояния, работать в любом порядке, который допускают
  зависимости, и корректно реагировать на отмену.
- Шаг читает только JSON из `$outer_context`, результаты объявленных предков
  или строковые литералы в кавычках. Каждый шаг получает свою копию, так что
  инструмент, изменивший свой вход, не испортит вход соседа. Граф и область
  видимости ссылок проверяются до первого вызова.
- Упавший шаг блокирует потомков: они возвращаются с `success=False` и
  `skipped=True`. Независимые ветки доходят до конца. `ToolStepConfig.timeout`
  валит один шаг, общий `timeout` отменяет идущие инструменты, ждёт их очистки
  и бросает `TimeoutError`.

Для всего, где есть память, история, события, условные переходы, чекпоинты,
динамические шаги или RE-PLAN, используйте `ReasoningChain.execute_async()`.

## Регистрация многих инструментов сразу

Используйте [декоратор `@carl_tool` и динамическое обнаружение](/ru/carl/steps/tool-discovery/),
чтобы регистрировать инструменты пачкой (из модуля, по glob-шаблону, из фабрики
или из закреплённого коммита Git).

## См. также

- [Обнаружение инструментов](/ru/carl/steps/tool-discovery/): `@carl_tool`, `register_tools_from_path`, обнаружение во время выполнения.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/): что можно писать в `input_mapping`.
- [Map-шаг](/ru/carl/steps/map/): вызвать один инструмент для каждого элемента списка.
- [Agent-шаг](/ru/carl/steps/agent/): дать LLM выбирать вызовы инструментов в ограниченном цикле.
