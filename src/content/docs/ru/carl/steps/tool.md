---
title: Tool-шаг
description: Вызов зарегистрированных Python-функций внутри цепочки с повторными попытками и запасными вариантами.
sidebar:
  order: 3
---

`ToolStepDescription` выполняет Python-функцию, зарегистрированную вами в контексте.
Поведение настраивается с помощью `ToolStepConfig`.

## Сначала зарегистрируйте инструмент

Инструменты ищутся по имени в реестре инструментов контекста:

```python
def calculate_growth(data: str) -> dict:
    return {"growth_rate": 0.15, "trend": "positive"}

context.register_tool("calculate_growth", calculate_growth)
```

:::caution
Инструменты, работающие в **параллельных** шагах, должны быть **без состояния** — параллельные шаги
разделяют инструменты через поверхностную копию, поэтому потокобезопасность изменяемого состояния не гарантируется.
:::

## ToolStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `tool_name` | `str` | — (обязательное) | Имя зарегистрированного инструмента. |
| `tool_description` | `str` | `""` | Описание того, что делает инструмент. |
| `parameters` | `list[ToolParameter]` | `[]` | Объявленные входные параметры. |
| `input_mapping` | `dict[str, str]` | `{}` | Отображение имён параметров инструмента → ссылок на контекст (например, `"$history[-1]"`). |
| `output_key` | `str` | `"result"` | Ключ, под которым вывод сохраняется в результате шага. |
| `timeout` | `float` | `30.0` | Таймаут выполнения в секундах. |
| `retry_on_error` | `bool` | `True` | Повторять ли попытку при ошибке. |
| `error_recovery` | `ToolErrorRecovery \| None` | `None` | Стратегия повторных попыток + запасной вариант (ниже). |
| `allowed_tool_tags` | `list[str] \| None` | `None` | Белый список тегов; исполнитель отказывает инструментам, чьи теги не пересекаются. |

## Пример

```python
from mmar_carl import ToolStepDescription, ToolStepConfig

ToolStepDescription(
    number=2,
    title="Calculate growth",
    dependencies=[1],
    config=ToolStepConfig(
        tool_name="calculate_growth",
        input_mapping={"data": "$history[-1]"},  # feed step 1's output
    ),
)
```

## Восстановление после ошибок

`ToolErrorRecovery` добавляет повторные попытки и запасные инструменты:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `retry_max` | `int` | `0` | Дополнительные попытки после первого сбоя. |
| `retry_delay` | `float` | `0.0` | Секунды между попытками. |
| `on_timeout` | `str \| None` | `None` | Имя запасного инструмента при таймауте. |
| `on_exception` | `str \| None` | `None` | Имя запасного инструмента после исчерпания попыток. |

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

## Регистрация множества инструментов сразу

Используйте [декоратор `@carl_tool` + динамическое обнаружение](/ru/carl/steps/tool-discovery/),
чтобы регистрировать инструменты пакетно (из модуля, по glob-шаблону или из фабрики)
вместо вызова `register_tool` по одному за раз.

## Смотрите также

- [Обнаружение инструментов](/ru/carl/steps/advanced/) — динамическая регистрация инструментов во время выполнения.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — что можно указывать в `input_mapping`.
