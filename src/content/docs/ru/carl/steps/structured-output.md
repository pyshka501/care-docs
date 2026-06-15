---
title: Шаг со структурированным выводом
description: Ограничение вывода LLM JSON-схемой, опционально из Pydantic-модели.
sidebar:
  order: 7
---

`StructuredOutputStepDescription` запускает LLM-шаг, вывод которого должен соответствовать
JSON-схеме — удобно, когда нижестоящему шагу нужны данные строго определённой формы.

## StructuredOutputStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `output_schema` | `dict` | — (обязательное) | JSON Schema, которой должен соответствовать вывод. |
| `input_source` | `str` | `"$history[-1]"` | Входные данные для построения промпта. |
| `schema_name` | `str` | `"StructuredOutput"` | Читаемое имя схемы. |
| `instruction` | `str` | `""` | Дополнительная инструкция перед преобразованием в схему. |
| `strict_json` | `bool` | `True` | Просить модель вернуть только чистый JSON. |

## Из Pydantic-модели

Самый простой способ построить конфигурацию — из Pydantic-модели: CARL сам выводит
JSON Schema с помощью `StructuredOutputStepConfig.from_pydantic_model()`:

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

## Из JSON Schema напрямую

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

Шаг со структурированным выводом стримит вывод по токенам автоматически, если в
контексте задан колбэк [`on_llm_chunk`](/ru/carl/async/overview/#мониторинговые-колбэки)
**и** клиент поддерживает стриминг — никакого флага в конфигурации задавать не нужно.
Чанки передаются в ваш колбэк (с меткой `stage="structured_output"`) по мере поступления.

В качестве оптимизации задержки исполнитель следит за накапливаемым буфером и
возвращает результат в тот момент, когда сбалансированный JSON-объект разбирается без
ошибок — поэтому он не ждёт хвостовых токенов, которые модель иногда выдаёт после
закрывающей `}`. Если сбалансированный объект так и не появляется, он откатывается к
полному накопленному буферу.

```python
def on_chunk(chunk: str, **kwargs):
    print(chunk, end="", flush=True)

context.on_llm_chunk = on_chunk   # structured-output steps now stream
```

## Смотрите также

- [Пример структурированного вывода](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/structured_output_example.py) в репозитории.
- [Стриминг токенов](/ru/carl/async/streaming/#стриминг-токенов) — колбэк `on_llm_chunk`.
