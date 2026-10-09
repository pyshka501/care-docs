---
title: Шаг со структурированным выводом
description: Ограничить ответ LLM схемой JSON и проверить его, прежде чем цепочка пойдёт дальше.
sidebar:
  order: 7
---

`StructuredOutputStepDescription` делает вызов LLM, ответ которого должен быть
JSON по объявленной JSON Schema. Исполнитель проверяет ответ. Несовпадение со
схемой роняет шаг. Используйте этот шаг, когда следующему шагу нужны данные
надёжной формы.

## StructuredOutputStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `output_schema` | `dict` | (обязательное) | JSON Schema, которой должен соответствовать ответ. |
| `input_source` | `str` | `"$history[-1]"` | Одна [ссылка](/ru/carl/chains/dynamic-references/). Её значение становится блоком `Input` в промпте. |
| `input_mapping` | `dict[str, str]` | `{}` | Ограниченный вход: `{name: reference}`. Если задан, блок `Input` становится JSON-объектом только с этими значениями. |
| `schema_name` | `str` | `"StructuredOutput"` | Читаемое имя схемы, которое видит модель. |
| `instruction` | `str` | `""` | Строка задачи для модели (если пусто, берётся название шага). |
| `strict_json` | `bool` | `True` | Просить модель вернуть только чистый JSON. |

Промпт содержит задачу, имя схемы, саму схему, блок `Input` и инструкцию про JSON.
Ответ разбирается как чистый JSON, как блок кода в ограждении или как первый
`{...}` / `[...]` в тексте.

### Ограниченный вход через `input_mapping`

По умолчанию блок `Input` содержит то, во что разрешается `input_source`. Обычно
это вся предыдущая запись истории. `input_mapping` сужает его ровно до
перечисленных значений:

```python
StructuredOutputStepConfig(
    output_schema={...},
    input_mapping={
        "ticket": "$memory.input.ticket",
        "customer_tier": "$memory.input.tier",
    },
)
```

Тогда модель видит `{"ticket": ..., "customer_tier": ...}` и больше ничего из
запуска. `input_mapping` нельзя сочетать с `input_source`, отличным от значения по
умолчанию. Такая комбинация отклоняется при создании конфига. Хост может проверить
наличие этого контракта по константе модуля
`mmar_carl.STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI`.

## Контракт проверки

Исполнитель не доверяет модели и сам применяет объявленную схему:

- Схема проверяется (`check_schema`) **до любого вызова провайдера**. Поэтому
  некорректный контракт роняет шаг без затрат и без сетевых запросов.
- Удалённые ссылки отклоняются: `$ref`, `$dynamicRef` и `$recursiveRef` должны
  начинаться с `#`. Проверка никогда ничего не скачивает по сети.
- Значение `$schema` с неизвестным диалектом **закрывает путь с ошибкой**
  (`Unsupported JSON Schema dialect`), а не откатывается к новейшему черновику.
  Без `$schema` используется диалект библиотеки по умолчанию.
- Разобранный ответ проверяется с `FORMAT_CHECKER` диалекта, поэтому ключевые
  слова `format`, например `email` или `date`, применяются.
- Сообщения об ошибке называют JSON-путь и нарушенное ключевое слово (например,
  `Structured output does not match JSON Schema at $.score: expected type "number"`).
  Они **никогда не повторяют отклонённое значение**, так что ответ модели не
  утекает в логи.
- Автоматического переспроса при несовпадении со схемой нет. `retry_max` /
  `context.retry_max` повторяют только сам вызов провайдера.

`jsonschema` (`>=4.23.0,<5.0.0`) входит в основные зависимости `mmar-carl`.

## Что записывает шаг

При успехе `result` содержит JSON-строку, `result_data` разобранное значение, а
запись истории имеет вид `Step N. Title [STRUCTURED_OUTPUT]` плюс `Result: <json>`.
И успешный, и упавший результат содержат `token_usage` (если клиент сообщает
расход) и `model` (выбранная модель клиента). При стриминге `token_usage` остаётся
`{}`, а не заполняется нулями.

## Какая модель выполняет шаг

Шаг со структурированным выводом использует `default_llm_config` цепочки, если он
задан. Иначе используется клиент контекста по умолчанию.

:::caution
У `StructuredOutputStepDescription` нет поля `llm_config`. Переданный ему
`llm_config=...` молча игнорируется. То же происходит с `llm_config` у JSON-шага
типа `structured_output`. Чтобы один такой шаг работал на другой модели, дайте
цепочке или контексту клиент этой модели.
:::

## Из модели Pydantic

Проще всего собрать конфиг из модели Pydantic. CARL выводит JSON Schema через
`StructuredOutputStepConfig.from_pydantic_model()`:

```python
from pydantic import BaseModel
from mmar_carl import StructuredOutputStepDescription, StructuredOutputStepConfig

class RiskAssessment(BaseModel):
    severity: str
    rationale: str
    score: float

StructuredOutputStepDescription(
    number=2,
    title="Extract risk assessment",
    dependencies=[1],
    config=StructuredOutputStepConfig.from_pydantic_model(
        RiskAssessment,
        input_source="$history[-1]",
        instruction="Base the score on the evidence in the text.",
    ),
)
```

`from_pydantic_model` принимает `input_source`, `instruction` и `strict_json`.
Чтобы использовать `input_mapping`, соберите конфиг напрямую с
`output_schema=RiskAssessment.model_json_schema()`.

## Из готовой JSON Schema

```python
StructuredOutputStepConfig(
    output_schema={
        "type": "object",
        "properties": {
            "severity": {"type": "string"},
            "score": {"type": "number"},
        },
        "required": ["severity", "score"],
    },
    schema_name="RiskAssessment",
)
```

## Стриминг

Шаг со структурированным выводом стримит ответ по токенам, когда у контекста есть
callback [`on_llm_chunk`](/ru/carl/async/streaming/) **и** клиент поддерживает
стриминг. Отдельного флага в конфиге нет. Фрагменты приходят в callback с меткой
`stage="structured_output"`.

Исполнитель следит за накопленным буфером и останавливается, как только
разбирается сбалансированный JSON-объект. Он не ждёт хвостовых токенов после
закрывающей `}`. Если сбалансированный объект так и не появился, берётся весь
буфер. Проверка схемой в любом случае выполняется на результате.

```python
def on_chunk(chunk: str, **kwargs):
    print(chunk, end="", flush=True)

context.on_llm_chunk = on_chunk   # structured-output steps now stream
```

## См. также

- [Пример структурированного вывода](https://github.com/Glazkoff/carl/blob/main/examples/tool_calling/structured_output_example.py) в репозитории.
- [Потоковая передача токенов](/ru/carl/async/streaming/): callback `on_llm_chunk`.
